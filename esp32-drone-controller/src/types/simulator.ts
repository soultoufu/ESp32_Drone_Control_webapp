export type CommandType = 'takeoff' | 'land' | 'emergency_stop' | 'move_forward' | 'move_backward' | 'move_left' | 'move_right' | 'move_up' | 'move_down' | 'turn_left' | 'turn_right' | 'delay';

export interface SimulatorCommand {
    type: CommandType;
    value?: number; // Distance in cm or degrees
    duration?: number; // ms to execute
}

export interface DroneState {
    position: [number, number, number];
    rotation: [number, number, number];
    isFlying: boolean;
}
