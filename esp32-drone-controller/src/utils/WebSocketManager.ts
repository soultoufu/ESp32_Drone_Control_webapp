import type { ClientMessage, ServerMessage } from '../types/websocket-protocol';

const DEFAULT_PORT = 8765;
const CONNECT_TIMEOUT_MS = 5000;

export class WebSocketManager {
    private ws: WebSocket | null = null;

    private onDataCallback: ((data: string) => void) | null = null;
    private onDisconnectCallback: (() => void) | null = null;
    private onStatusCallback: ((message: string, level: 'info' | 'error' | 'success' | 'debug') => void) | null = null;

    onData(callback: (data: string) => void) {
        this.onDataCallback = callback;
    }

    onDisconnect(callback: () => void) {
        this.onDisconnectCallback = callback;
    }

    onStatus(callback: (message: string, level: 'info' | 'error' | 'success' | 'debug') => void) {
        this.onStatusCallback = callback;
    }

    /**
     * Connect to the Raspberry Pi WebSocket server.
     * @param address  IP (e.g. "192.168.4.1") or IP:port (e.g. "192.168.4.1:8765")
     */
    async connect(address: string): Promise<boolean> {
        if (this.ws) {
            await this.disconnect();
        }

        // Build URL — add default port if not specified
        const hasPort = address.includes(':');
        const url = `ws://${address}${hasPort ? '' : `:${DEFAULT_PORT}`}`;

        return new Promise<boolean>((resolve) => {
            let settled = false;
            const settle = (success: boolean) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeoutId);
                resolve(success);
            };

            const timeoutId = setTimeout(() => {
                console.error(`[WebSocket] Connection to ${url} timed out`);
                this.ws?.close();
                settle(false);
            }, CONNECT_TIMEOUT_MS);

            try {
                this.ws = new WebSocket(url);
            } catch (err) {
                console.error('[WebSocket] Failed to construct WebSocket:', err);
                settle(false);
                return;
            }

            this.ws.onopen = () => {
                console.log(`[WebSocket] Connected to ${url}`);
                this.send({ type: 'ping' });
                settle(true);
            };

            this.ws.onerror = (err) => {
                console.error('[WebSocket] Connection error:', err);
                settle(false);
            };

            this.ws.onclose = () => {
                console.log('[WebSocket] Disconnected');
                this.ws = null;
                this.onDisconnectCallback?.();
            };

            this.ws.onmessage = (event: MessageEvent) => {
                this.handleMessage(event.data as string);
            };
        });
    }

    async disconnect(): Promise<void> {
        if (this.ws) {
            // Best-effort abort any running script
            if (this.ws.readyState === WebSocket.OPEN) {
                this.send({ type: 'abort' });
                this.ws.close();
            }
            this.ws = null;
        }
    }

    /** Upload a full Python script to the RPi for execution. */
    async uploadCode(code: string): Promise<void> {
        this.send({ type: 'upload', code });
    }

    /** Send a single drone command (immediate execution on RPi). */
    sendCommand(action: 'takeoff' | 'land' | 'emergency_stop' | 'move' | 'rotate' | 'delay', params?: Record<string, unknown>): void {
        this.send({ type: 'command', action, ...params } as ClientMessage);
    }

    /** Low-level string write — sends raw string over WebSocket (for interface compatibility). */
    async write(data: string): Promise<void> {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    private send(message: ClientMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('[WebSocket] Attempted to send while not connected:', message);
        }
    }

    private handleMessage(raw: string): void {
        let msg: ServerMessage;
        try {
            msg = JSON.parse(raw) as ServerMessage;
        } catch {
            console.warn('[WebSocket] Received non-JSON message:', raw);
            return;
        }

        switch (msg.type) {
            case 'pong':
                console.log(`[WebSocket] RPi server version: ${msg.version}`);
                break;

            case 'telemetry':
                // Forward the raw JSON string to TelemetryPanel, which already
                // parses JSON lines for type === 'telemetry'.
                this.onDataCallback?.(raw);
                break;

            case 'status':
                this.onStatusCallback?.(msg.message, msg.level);
                // Also forward as a log line so the terminal in TelemetryPanel shows it
                this.onDataCallback?.(msg.message);
                break;

            case 'error':
                this.onStatusCallback?.(msg.message, 'error');
                this.onDataCallback?.(`ERROR: ${msg.message}`);
                break;
        }
    }
}

export const wsManager = new WebSocketManager();
