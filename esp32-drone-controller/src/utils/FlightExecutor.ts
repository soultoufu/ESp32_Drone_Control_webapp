/**
 * FlightExecutor — converts SimulatorCommand[] into live MSP RC commands.
 *
 * Architecture:
 *   - Keeps a 16-channel RC array in memory
 *   - Sends MSP_SET_RAW_RC at 20 Hz (50 ms) via setInterval (keepalive)
 *   - Sequentially executes each command by adjusting channel values + sleeping
 *   - Parses incoming binary MSP telemetry responses
 *
 * INAV/Betaflight failsafe triggers if SET_RAW_RC stops for >200 ms,
 * so the keepalive must start before any command is sent.
 */

import type { SimulatorCommand } from '../types/simulator';
import { MSPProtocol, MSP_CMD, RC } from './MSPProtocol';
import { wsManager } from './WebSocketManager';

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export interface TelemetryData {
    roll: number;
    pitch: number;
    yaw: number;
    altitude: number;
    voltage: number;
    battery: number;
    armed: boolean;
}

export class FlightExecutor {
    private channels: number[] = new Array(16).fill(RC.CENTER);
    private keepaliveId: ReturnType<typeof setInterval> | null = null;
    private telemetryId: ReturnType<typeof setInterval> | null = null;
    private running = false;
    private telemetryBuffer: Uint8Array = new Uint8Array(0);

    // Latest parsed telemetry — updated by startTelemetryPolling
    private latestTelemetry: Partial<TelemetryData> = {};
    private onTelemetryCallback: ((data: Partial<TelemetryData>) => void) | null = null;

    onTelemetry(callback: (data: Partial<TelemetryData>) => void): void {
        this.onTelemetryCallback = callback;
    }

    // ------------------------------------------------------------------
    // Keepalive (20 Hz RC packets)
    // ------------------------------------------------------------------

    startKeepalive(): void {
        if (this.keepaliveId !== null) return;
        this.keepaliveId = setInterval(() => {
            wsManager.sendBinary(MSPProtocol.buildSetRawRC(this.channels));
        }, 50);
    }

    stopKeepalive(): void {
        if (this.keepaliveId !== null) {
            clearInterval(this.keepaliveId);
            this.keepaliveId = null;
        }
    }

    // ------------------------------------------------------------------
    // Telemetry polling (500 ms) — sends read requests to FC
    // ------------------------------------------------------------------

    startTelemetryPolling(): void {
        if (this.telemetryId !== null) return;

        // Wire up binary response handler
        wsManager.onBinary((data: Uint8Array) => {
            this.handleBinaryData(data);
        });

        this.telemetryId = setInterval(() => {
            wsManager.sendBinary(MSPProtocol.buildRequest(MSP_CMD.ATTITUDE));
            wsManager.sendBinary(MSPProtocol.buildRequest(MSP_CMD.ALTITUDE));
            wsManager.sendBinary(MSPProtocol.buildRequest(MSP_CMD.ANALOG));
            wsManager.sendBinary(MSPProtocol.buildRequest(MSP_CMD.STATUS));
        }, 500);
    }

    stopTelemetryPolling(): void {
        if (this.telemetryId !== null) {
            clearInterval(this.telemetryId);
            this.telemetryId = null;
        }
    }

    /** Called by wsManager when binary frames arrive from the bridge. */
    private handleBinaryData(data: Uint8Array): void {
        // Append to rolling buffer (FC may send responses back-to-back)
        const combined = new Uint8Array(this.telemetryBuffer.length + data.length);
        combined.set(this.telemetryBuffer);
        combined.set(data, this.telemetryBuffer.length);
        this.telemetryBuffer = combined;

        // Parse all complete responses from the buffer
        let offset = 0;
        while (offset < this.telemetryBuffer.length) {
            const slice = this.telemetryBuffer.slice(offset);
            const response = MSPProtocol.parseResponse(slice);
            if (!response) break;

            switch (response.cmd) {
                case MSP_CMD.ATTITUDE: {
                    const att = MSPProtocol.parseAttitude(response.payload);
                    Object.assign(this.latestTelemetry, att);
                    break;
                }
                case MSP_CMD.ALTITUDE: {
                    this.latestTelemetry.altitude = MSPProtocol.parseAltitude(response.payload);
                    break;
                }
                case MSP_CMD.ANALOG: {
                    const analog = MSPProtocol.parseAnalog(response.payload);
                    Object.assign(this.latestTelemetry, analog);
                    break;
                }
                case MSP_CMD.STATUS: {
                    const status = MSPProtocol.parseStatus(response.payload);
                    this.latestTelemetry.armed = status.armed;
                    break;
                }
            }
            this.onTelemetryCallback?.(this.latestTelemetry);

            // Advance buffer past this response (header 5B + payload + checksum 1B)
            offset += 6 + response.payload.length;
        }
        this.telemetryBuffer = this.telemetryBuffer.slice(offset);
    }

    // ------------------------------------------------------------------
    // Channel helpers
    // ------------------------------------------------------------------

    private setChannel(index: number, value: number): void {
        this.channels[index] = Math.max(RC.MIN, Math.min(RC.MAX, value));
    }

    private emergencyNeutral(): void {
        this.channels.fill(RC.CENTER);
        this.channels[RC.THROTTLE] = RC.MIN;
        this.channels[RC.ARM] = RC.ARM_OFF;
    }

    // ------------------------------------------------------------------
    // Main execute entry point
    // ------------------------------------------------------------------

    async execute(
        commands: SimulatorCommand[],
        onProgress?: (msg: string) => void
    ): Promise<void> {
        this.running = true;
        this.emergencyNeutral();
        this.startKeepalive();

        try {
            for (const cmd of commands) {
                if (!this.running) break;
                onProgress?.(`→ ${cmd.type}${cmd.value !== undefined ? ` (${cmd.value})` : ''}`);
                await this.executeOne(cmd);
            }
        } finally {
            this.emergencyNeutral();
            // Send a few final disarm packets before stopping keepalive
            for (let i = 0; i < 5; i++) {
                wsManager.sendBinary(MSPProtocol.buildSetRawRC(this.channels));
                await sleep(20);
            }
            this.stopKeepalive();
            this.running = false;
        }
    }

    abort(): void {
        this.running = false;
        this.emergencyNeutral();
        // Immediately send disarm
        wsManager.sendBinary(MSPProtocol.buildSetRawRC(this.channels));
        this.stopKeepalive();
    }

    get isRunning(): boolean {
        return this.running;
    }

    // ------------------------------------------------------------------
    // Per-command execution
    // ------------------------------------------------------------------

    private async executeOne(cmd: SimulatorCommand): Promise<void> {
        switch (cmd.type) {
            case 'takeoff':
                await this.doTakeoff();
                break;

            case 'land':
                await this.doLand();
                break;

            case 'emergency_stop':
                this.emergencyNeutral();
                wsManager.sendBinary(MSPProtocol.buildSetRawRC(this.channels));
                break;

            case 'move_forward':
                this.setChannel(RC.PITCH, RC.CENTER + RC.MOVE_AMOUNT);
                await sleep((cmd.value ?? 1) * 1000);
                this.setChannel(RC.PITCH, RC.CENTER);
                break;

            case 'move_backward':
                this.setChannel(RC.PITCH, RC.CENTER - RC.MOVE_AMOUNT);
                await sleep((cmd.value ?? 1) * 1000);
                this.setChannel(RC.PITCH, RC.CENTER);
                break;

            case 'move_left':
                this.setChannel(RC.ROLL, RC.CENTER - RC.MOVE_AMOUNT);
                await sleep((cmd.value ?? 1) * 1000);
                this.setChannel(RC.ROLL, RC.CENTER);
                break;

            case 'move_right':
                this.setChannel(RC.ROLL, RC.CENTER + RC.MOVE_AMOUNT);
                await sleep((cmd.value ?? 1) * 1000);
                this.setChannel(RC.ROLL, RC.CENTER);
                break;

            case 'move_up':
                this.setChannel(RC.THROTTLE, RC.HOVER_THROTTLE + RC.VERT_AMOUNT);
                await sleep((cmd.value ?? 1) * 1000);
                this.setChannel(RC.THROTTLE, RC.HOVER_THROTTLE);
                break;

            case 'move_down':
                this.setChannel(RC.THROTTLE, RC.HOVER_THROTTLE - RC.VERT_AMOUNT);
                await sleep((cmd.value ?? 1) * 1000);
                this.setChannel(RC.THROTTLE, RC.HOVER_THROTTLE);
                break;

            case 'turn_left': {
                const degrees = cmd.value ?? 90;
                this.setChannel(RC.YAW, RC.CENTER - RC.YAW_AMOUNT);
                await sleep((degrees / 90) * 1000);
                this.setChannel(RC.YAW, RC.CENTER);
                break;
            }

            case 'turn_right': {
                const degrees = cmd.value ?? 90;
                this.setChannel(RC.YAW, RC.CENTER + RC.YAW_AMOUNT);
                await sleep((degrees / 90) * 1000);
                this.setChannel(RC.YAW, RC.CENTER);
                break;
            }

            case 'delay':
                // value is already in ms (simGenerator multiplies by 1000)
                await sleep(cmd.value ?? 1000);
                break;
        }
    }

    // ------------------------------------------------------------------
    // Takeoff: arm → ramp throttle to hover over 2 s → hold 1.5 s
    // ------------------------------------------------------------------

    private async doTakeoff(): Promise<void> {
        // Arm
        this.setChannel(RC.ARM, RC.ARM_ON);
        this.setChannel(RC.THROTTLE, RC.MIN);
        await sleep(500);

        // Ramp throttle from MIN to HOVER over 2000 ms
        const steps = 40; // 2000ms / 50ms
        const delta = (RC.HOVER_THROTTLE - RC.MIN) / steps;
        for (let i = 0; i <= steps; i++) {
            this.setChannel(RC.THROTTLE, Math.round(RC.MIN + delta * i));
            await sleep(50);
        }

        // Hold at hover
        await sleep(1500);
    }

    // ------------------------------------------------------------------
    // Land: ramp throttle from hover to MIN over 3 s → disarm
    // ------------------------------------------------------------------

    private async doLand(): Promise<void> {
        const steps = 60; // 3000ms / 50ms
        const startThrottle = this.channels[RC.THROTTLE];
        const delta = (startThrottle - RC.MIN) / steps;
        for (let i = 0; i <= steps; i++) {
            this.setChannel(RC.THROTTLE, Math.round(startThrottle - delta * i));
            await sleep(50);
        }
        // Disarm
        this.setChannel(RC.ARM, RC.ARM_OFF);
        await sleep(200);
    }
}

export const flightExecutor = new FlightExecutor();
