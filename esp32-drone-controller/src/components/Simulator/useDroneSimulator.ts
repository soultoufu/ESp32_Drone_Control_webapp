import { useState, useCallback, useRef } from 'react';

// Available time scale presets for the UI
export const TIME_SCALE_PRESETS = [
    { label: '0.25×', value: 4 },
    { label: '0.5×', value: 2 },
    { label: '1×', value: 1 },
    { label: '2×', value: 0.5 },
    { label: '4×', value: 0.25 }
] as const;
import type { SimulatorCommand, DroneState } from '../../types/simulator';

export const useDroneSimulator = () => {
    const [state, setState] = useState<DroneState>({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        isFlying: false
    });

    const [isExecuting, setIsExecuting] = useState(false);
    const [timeScale, setTimeScale] = useState(1); // 1 = real-time, <1 = faster, >1 = slower

    // Bug 1 fix: use refs for authoritative position/rotation so sequential
    // commands always start from where the previous command left the drone,
    // not from the stale closure value captured at callback creation time.
    const positionRef = useRef<[number, number, number]>([0, 0, 0]);
    const rotationRef = useRef<[number, number, number]>([0, 0, 0]);
    const timeScaleRef = useRef(1);

    // Bug 1 fix: no deps — reads from refs which are always current
    const executeCommand = useCallback(async (command: SimulatorCommand) => {
        const { type, value = 2 } = command;

        // Movement blocks say "Move for N seconds" — value IS a duration in seconds.
        // Convert to metres using a fixed cruise speed so all directions are consistent:
        //   "move forward 5" = "move left 5" = 5 m (5 s × 1 m/s).
        // Yaw uses value as degrees; delay uses value as ms — neither uses distanceMeter.
        const DRONE_SPEED = 1; // m/s cruise speed
        const distanceMeter = value * DRONE_SPEED;

        // Time scaling factor — controls how fast sim time passes vs Blockly time.
        // Read from the ref so the animation loop always uses the latest value.
        const SIM_TIME_SCALE = timeScaleRef.current;

        return new Promise<void>((resolve) => {
            // For delay commands, value is already in ms from simGenerator.
            // For movement commands, scale duration proportionally to distance.
            const duration = type === 'delay'
                ? value / SIM_TIME_SCALE
                : Math.max(300, (distanceMeter * 1000) / SIM_TIME_SCALE);

            // Bug 1 fix: read from refs, not from stale closure over state
            const startPos = [...positionRef.current] as [number, number, number];
            const startRot = [...rotationRef.current] as [number, number, number];

            // Bug 5 fix: emergency_stop is instantaneous — drop and resolve immediately
            if (type === 'emergency_stop') {
                const nextPos: [number, number, number] = [startPos[0], 0, startPos[2]];
                // Also level out pitch and roll on emergency stop
                const levelRot: [number, number, number] = [0, startRot[1], 0];
                positionRef.current = nextPos;
                rotationRef.current = levelRot;
                setState({ position: nextPos, rotation: levelRot, isFlying: false });
                resolve();
                return;
            }

            let elapsed = 0;
            const step = (time: number) => {
                if (!elapsed) elapsed = time;
                const progress = Math.min((time - elapsed) / duration, 1);

                const nextPos = [...startPos] as [number, number, number];
                const nextRot = [...startRot] as [number, number, number];

                // Read current yaw for body-relative movement
                const yaw = startRot[1];

                // Drone physics — pitch & roll tilt during transit.
                // Real multirotors pitch nose-down to accelerate forward and
                // roll to strafe left/right. We model this with a bell-curve
                // (sin(π·progress)) so the drone tilts into the move and
                // levels back to 0 by the time the command completes.
                // rotation[0] = pitch  (+ = nose down / forward tilt)
                // rotation[1] = yaw    (heading — unchanged here)
                // rotation[2] = roll   (+ = right wing down / right tilt)
                const MAX_TILT = 0.26; // ~15 degrees in radians
                const tiltEnvelope = Math.sin(Math.PI * progress); // 0→peak→0

                switch (type) {
                    case 'takeoff':
                        nextPos[1] = progress * 1; // Ascend to 1m
                        // Slight nose-up on ascent (like a real drone spinning up)
                        nextRot[0] = -MAX_TILT * 0.3 * tiltEnvelope;
                        break;
                    case 'land':
                        // Bug 3 fix: land from actual current altitude, not hardcoded 1m
                        nextPos[1] = startPos[1] * (1 - progress);
                        // Slight nose-down on descent
                        nextRot[0] = MAX_TILT * 0.3 * tiltEnvelope;
                        break;
                    case 'move_forward':
                        // Bug 11 fix: apply yaw rotation to movement vector
                        nextPos[0] = startPos[0] - Math.sin(yaw) * progress * distanceMeter;
                        nextPos[2] = startPos[2] - Math.cos(yaw) * progress * distanceMeter;
                        // Pitch nose down to fly forward
                        nextRot[0] = MAX_TILT * tiltEnvelope;
                        break;
                    case 'move_backward':
                        nextPos[0] = startPos[0] + Math.sin(yaw) * progress * distanceMeter;
                        nextPos[2] = startPos[2] + Math.cos(yaw) * progress * distanceMeter;
                        // Pitch nose up to fly backward
                        nextRot[0] = -MAX_TILT * tiltEnvelope;
                        break;
                    case 'move_left':
                        nextPos[0] = startPos[0] - Math.cos(yaw) * progress * distanceMeter;
                        nextPos[2] = startPos[2] + Math.sin(yaw) * progress * distanceMeter;
                        // Roll left wing down to strafe left
                        nextRot[2] = -MAX_TILT * tiltEnvelope;
                        break;
                    case 'move_right':
                        nextPos[0] = startPos[0] + Math.cos(yaw) * progress * distanceMeter;
                        nextPos[2] = startPos[2] - Math.sin(yaw) * progress * distanceMeter;
                        // Roll right wing down to strafe right
                        nextRot[2] = MAX_TILT * tiltEnvelope;
                        break;
                    case 'move_up':
                        // Bug 2 fix: move_up was missing
                        nextPos[1] = startPos[1] + progress * distanceMeter;
                        break;
                    case 'move_down':
                        // Bug 2 fix: move_down was missing; clamp to ground
                        nextPos[1] = Math.max(0, startPos[1] - progress * distanceMeter);
                        break;
                    case 'turn_left':
                        nextRot[1] = startRot[1] + progress * (value * Math.PI / 180);
                        break;
                    case 'turn_right':
                        nextRot[1] = startRot[1] - progress * (value * Math.PI / 180);
                        break;
                    case 'delay':
                        // Just wait, no position change
                        break;
                }

                // Bug 1 fix: write final position back to refs so next command starts here
                if (progress >= 1) {
                    positionRef.current = nextPos;
                    rotationRef.current = nextRot;
                }

                setState(prev => ({
                    ...prev,
                    position: nextPos,
                    rotation: nextRot,
                    isFlying: type === 'land' ? progress < 0.95 : true
                }));

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(step);
        });
    }, []); // Bug 1 fix: empty deps — refs are always current

    const runSimulation = useCallback(async (commands: SimulatorCommand[]) => {
        setIsExecuting(true);

        for (const cmd of commands) {
            await executeCommand(cmd);
        }

        setIsExecuting(false);
    }, [executeCommand]);

    const resetSimulation = useCallback(() => {
        // Bug 1 fix: reset refs alongside state
        positionRef.current = [0, 0, 0];
        rotationRef.current = [0, 0, 0];
        setState({
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            isFlying: false
        });
        setIsExecuting(false);
    }, []);

    // Keep the ref in sync with the state so the animation loop reads the latest value
    const handleSetTimeScale = useCallback((scale: number) => {
        timeScaleRef.current = scale;
        setTimeScale(scale);
    }, []);

    return {
        state,
        isExecuting,
        timeScale,
        setTimeScale: handleSetTimeScale,
        runSimulation,
        resetSimulation
    };
};
