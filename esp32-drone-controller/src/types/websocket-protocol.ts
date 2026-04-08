// Messages sent from the webapp to the Raspberry Pi WebSocket server
export type ClientMessage =
    | { type: 'ping' }
    | { type: 'command'; action: 'takeoff' | 'land' | 'emergency_stop' }
    | { type: 'command'; action: 'move'; direction: string; duration: number }
    | { type: 'command'; action: 'rotate'; degrees: number }
    | { type: 'command'; action: 'delay'; seconds: number }
    | { type: 'upload'; code: string }
    | { type: 'abort' };

// Messages received from the Raspberry Pi WebSocket server
export type ServerMessage =
    | { type: 'pong'; version: string }
    | { type: 'telemetry'; battery: number; height: number; speed: number; state: string; yaw: number; timestamp: number }
    | { type: 'status'; message: string; level: 'info' | 'debug' | 'error' | 'success' }
    | { type: 'error'; message: string; code?: string };
