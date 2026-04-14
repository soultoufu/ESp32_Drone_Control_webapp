import { useState, useCallback, useRef } from 'react';
import type { SimulatorCommand, DroneState } from '../../types/simulator';

export const useDroneSimulator = () => {
    const [state, setState] = useState<DroneState>({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        isFlying: false
    });

    const [isExecuting, setIsExecuting] = useState(false);

    // Bug 1 fix: use refs for authoritative position/rotation so sequential
    // commands always start from where the previous command left the drone,
    // not from the stale closure value captured at callback creation time.
    const positionRef = useRef<[number, number, number]>([0, 0, 0]);
    const rotationRef = useRef<[number, number, number]>([0, 0, 0]);

    // Bug 1 fix: no deps — reads from refs which are always current
    const executeCommand = useCallback(async (command: SimulatorCommand) => {
        const { type, value = 100 } = command;
        const distanceMeter = value / 100; // Convert cm to meters

        // Time scaling factor — controls how fast sim time passes vs Blockly time.
        // A factor of 4 means 10s in Blockly ≈ 2.5s in the simulator.
        const SIM_TIME_SCALE = 4;

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
                positionRef.current = nextPos;
                setState({ position: nextPos, rotation: startRot, isFlying: false });
                resolve();
                return;
            }

            let elapsed = 0;
            const step = (time: number) => {
                if (!elapsed) elapsed = time;
                const progress = Math.min((time - elapsed) / duration, 1);

                const nextPos = [...startPos] as [number, number, number];
                const nextRot = [...startRot] as [number, number, number];

                // Bug 11 fix: read current yaw for body-relative movement
                const yaw = startRot[1];

                switch (type) {
                    case 'takeoff':
                        nextPos[1] = progress * 1; // Ascend to 1m
                        break;
                    case 'land':
                        // Bug 3 fix: land from actual current altitude, not hardcoded 1m
                        nextPos[1] = startPos[1] * (1 - progress);
                        break;
                    case 'move_forward':
                        // Bug 11 fix: apply yaw rotation to movement vector
                        nextPos[0] = startPos[0] - Math.sin(yaw) * progress * distanceMeter;
                        nextPos[2] = startPos[2] - Math.cos(yaw) * progress * distanceMeter;
                        break;
                    case 'move_backward':
                        nextPos[0] = startPos[0] + Math.sin(yaw) * progress * distanceMeter;
                        nextPos[2] = startPos[2] + Math.cos(yaw) * progress * distanceMeter;
                        break;
                    case 'move_left':
                        nextPos[0] = startPos[0] - Math.cos(yaw) * progress * distanceMeter;
                        nextPos[2] = startPos[2] + Math.sin(yaw) * progress * distanceMeter;
                        break;
                    case 'move_right':
                        nextPos[0] = startPos[0] + Math.cos(yaw) * progress * distanceMeter;
                        nextPos[2] = startPos[2] - Math.sin(yaw) * progress * distanceMeter;
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

    return {
        state,
        isExecuting,
        runSimulation,
        resetSimulation
    };
};
