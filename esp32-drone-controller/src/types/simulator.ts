export type CommandType = 'takeoff' | 'land' | 'emergency_stop' | 'move_forward' | 'move_backward' | 'move_left' | 'move_right' | 'move_up' | 'move_down' | 'turn_left' | 'turn_right' | 'delay';

export interface SimulatorCommand {
    type: CommandType;
    // value semantics by command type:
    //   movement (move_*): seconds of flight at DRONE_SPEED m/s → distance = value × DRONE_SPEED
    //   turn_left / turn_right: degrees
    //   delay: milliseconds
    //   takeoff / land / emergency_stop: unused (may be omitted)
    value?: number;
    duration?: number; // ms to execute
}

export interface DroneState {
    position: [number, number, number];
    rotation: [number, number, number];
    isFlying: boolean;
}
