import { useState, useCallback, useRef, useEffect } from 'react';
import { SimulatorCommand, DroneState } from '../../types/simulator';

export const useDroneSimulator = () => {
    const [state, setState] = useState<DroneState>({
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        isFlying: false
    });

    const [isExecuting, setIsExecuting] = useState(false);
    const commandQueue = useRef<SimulatorCommand[]>([]);
    const currentCommandIndex = useRef(-1);

    const executeCommand = useCallback(async (command: SimulatorCommand) => {
        const { type, value = 100 } = command;
        const distanceMeter = value / 100; // Convert cm to meters for 3D world

        return new Promise<void>((resolve) => {
            const duration = 1000; // ms per command for now
            const startPos = [...state.position];
            const startRot = [...state.rotation];

            let elapsed = 0;
            const step = (time: number) => {
                if (!elapsed) elapsed = time;
                const progress = Math.min((time - elapsed) / duration, 1);

                const nextPos = [...startPos] as [number, number, number];
                const nextRot = [...startRot] as [number, number, number];

                switch (type) {
                    case 'takeoff':
                        nextPos[1] = progress * 1; // Takeoff to 1m
                        break;
                    case 'land':
                        nextPos[1] = (1 - progress) * 1;
                        break;
                    case 'move_forward':
                        // In Three.js, -Z is forward
                        nextPos[2] = startPos[2] - (progress * distanceMeter);
                        break;
                    case 'move_backward':
                        nextPos[2] = startPos[2] + (progress * distanceMeter);
                        break;
                    case 'move_left':
                        nextPos[0] = startPos[0] - (progress * distanceMeter);
                        break;
                    case 'move_right':
                        nextPos[0] = startPos[0] + (progress * distanceMeter);
                        break;
                    case 'turn_left':
                        nextRot[1] = startRot[1] + (progress * (value * Math.PI / 180));
                        break;
                    case 'turn_right':
                        nextRot[1] = startRot[1] - (progress * (value * Math.PI / 180));
                        break;
                }

                setState(prev => ({
                    ...prev,
                    position: nextPos,
                    rotation: nextRot,
                    isFlying: type === 'land' ? progress < 0.9 : true
                }));

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(step);
        });
    }, [state.position, state.rotation]);

    const runSimulation = useCallback(async (commands: SimulatorCommand[]) => {
        setIsExecuting(true);
        commandQueue.current = commands;

        for (const cmd of commands) {
            await executeCommand(cmd);
        }

        setIsExecuting(false);
    }, [executeCommand]);

    const resetSimulation = useCallback(() => {
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
