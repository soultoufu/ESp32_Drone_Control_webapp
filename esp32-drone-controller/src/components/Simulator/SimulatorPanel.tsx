import React from 'react';
import type { DroneState } from '../../types/simulator';
import './Simulator.css';

interface Props {
    state: DroneState;
    isExecuting: boolean;
    onReset: () => void;
}

export const SimulatorPanel: React.FC<Props> = ({ state, isExecuting, onReset }) => {
    // Map Drone State (x, y, z) to CSS 3D Coordinates
    // Drone X -> CSS X (Left/Right)
    // Drone Z (Forward) -> CSS Y (Forward/Back in isometric view)
    // Drone Y (Altitude) -> CSS Z (Height off the ground)

    const { position, rotation } = state;
    const [droneX, droneHeight, droneForward] = position;

    // Coordinate Mapping for CSS 3D 'preserve-3d' Scene
    // Scale up for better visibility (multiply by 100 to convert meters to pixels)
    const x = droneX * 100;
    const y = -droneForward * 100; // Negative because CSS Y goes down
    const z = droneHeight * 100;

    const rotZ = -rotation[1] * (180 / Math.PI); // Convert radians to degrees

    return (
        <div className="sim-scene-container">
            {/* HUD / Overlay Controls */}
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', gap: '0.5rem' }}>
                <button
                    className="btn"
                    onClick={onReset}
                    disabled={isExecuting}
                    style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,0,0,0.2)' }}
                >
                    🔄 Reset
                </button>
            </div>

            {/* The 3D World Container */}
            <div className="sim-world">

                {/* Origin Marker Wrapper */}
                <div className="sim-origin">

                    {/* The Drone Entity */}
                    <div
                        className="sim-drone"
                        style={{
                            transform: `translate3d(${x}px, ${y}px, ${z}px) rotateZ(${rotZ}deg)`
                        }}
                    >
                        {/* Visual Representation of Drone Body */}
                        <div className="drone-body">
                            <div className="drone-arm arm-1"></div>
                            <div className="drone-arm arm-2"></div>
                            {/* Rotors */}
                            <div className="rotor rotor-fl"></div>
                            <div className="rotor rotor-fr"></div>
                            <div className="rotor rotor-bl"></div>
                            <div className="rotor rotor-br"></div>
                            {/* Front Indicator */}
                            <div style={{
                                position: 'absolute',
                                top: -25,
                                width: '100%',
                                textAlign: 'center',
                                color: '#38bdf8',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textShadow: '0 0 4px rgba(0,0,0,0.8)'
                            }}>Front</div>
                        </div>
                    </div>

                    {/* Shadow (Ground projection) */}
                    <div
                        className="drone-shadow"
                        style={{
                            transform: `translate3d(${x}px, ${y}px, 0px) scale(${Math.max(0.2, 1 - z / 500)})`,
                            opacity: Math.max(0.1, 0.6 - z / 500)
                        }}
                    />
                </div>
            </div>

            {/* Telemetry HUD */}
            <div className="sim-controls">
                <div>X: {droneX.toFixed(2)}m</div>
                <div>Y: {droneForward.toFixed(2)}m</div>
                <div>Alt: {droneHeight.toFixed(2)}m</div>
                <div>Hdg: {rotZ.toFixed(0)}°</div>
                {isExecuting && <div style={{ color: '#4ade80' }}>▶ Running...</div>}
            </div>
        </div>
    );
};
