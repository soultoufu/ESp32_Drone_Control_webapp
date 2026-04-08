import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { DroneState } from '../../types/simulator';
import { Scene } from './Scene';
import { VirtualDrone } from './VirtualDrone';

interface Props {
    state: DroneState;
    isExecuting: boolean;
    onReset: () => void;
}

export const SimulatorPanel3D: React.FC<Props> = ({ state, isExecuting, onReset }) => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a0f' }}>
            {/* HUD / Overlay Controls */}
            <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 10,
                display: 'flex',
                gap: '0.5rem'
            }}>
                <button
                    className="btn"
                    onClick={onReset}
                    disabled={isExecuting}
                    style={{
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(255,0,0,0.2)'
                    }}
                >
                    🔄 Reset
                </button>
            </div>

            {/* 3D Canvas */}
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[3, 3, 3]} />
                {/* Bug 10 fix: no target prop — defaults to [0,0,0] (the launch pad).
                    Previously passing state.position caused jarring camera jumps on every frame. */}
                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                />

                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />

                {/* Scene Content */}
                <Scene />
                <VirtualDrone position={state.position} rotation={state.rotation} />
            </Canvas>

            {/* Telemetry HUD */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                background: 'rgba(30, 41, 59, 0.95)',
                padding: '12px 16px',
                borderRadius: '10px',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                zIndex: 100,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
                <div style={{ marginBottom: '4px', fontWeight: 'bold', color: '#94a3b8' }}>Telemetry</div>
                <div>X: {state.position[0].toFixed(2)}m</div>
                <div>Y: {state.position[2].toFixed(2)}m</div>
                <div>Alt: {state.position[1].toFixed(2)}m</div>
                <div>Hdg: {(state.rotation[1] * 180 / Math.PI).toFixed(0)}°</div>
                {isExecuting && <div style={{ color: '#4ade80', marginTop: '8px' }}>▶ Running...</div>}
            </div>

            {/* Controls hint */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                background: 'rgba(30, 41, 59, 0.9)',
                padding: '8px 14px',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.75rem',
                zIndex: 100,
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
                🖱️ Drag to orbit • Scroll to zoom
            </div>
        </div>
    );
};
