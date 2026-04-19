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

export const SimulatorPanel3D: React.FC<Props> = ({ state, isExecuting }) => {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            background: 'linear-gradient(180deg, #0c1222 0%, #0a0e1a 50%, #080c14 100%)'
        }}>
            {/* 3D Canvas */}
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[3, 3, 3]} />
                {/* Bug 10 fix: no target prop — defaults to [0,0,0] (the launch pad).
                    Previously passing state.position caused jarring camera jumps on every frame. */}
                <OrbitControls
                    enableDamping
                    dampingFactor={0.05}
                />

                {/* Lighting — boosted for better visibility and contrast */}
                <ambientLight intensity={0.6} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1.2}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                />
                {/* Fill light from the opposite side to reduce harsh shadows */}
                <directionalLight
                    position={[-5, 5, -5]}
                    intensity={0.3}
                    color="#a78bfa"
                />
                {/* Subtle hemisphere light for ambient color variation */}
                <hemisphereLight
                    color="#60a5fa"
                    groundColor="#1e293b"
                    intensity={0.25}
                />

                {/* Scene Content */}
                <Scene />
                <VirtualDrone position={state.position} rotation={state.rotation} />
            </Canvas>

            {/* Telemetry HUD — high-contrast redesign */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                background: 'rgba(15, 23, 42, 0.92)',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                color: '#e2e8f0',
                fontFamily: "'Inter', 'Fira Code', monospace",
                fontSize: '0.85rem',
                zIndex: 100,
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 189, 248, 0.08)',
                backdropFilter: 'blur(8px)',
                minWidth: '160px'
            }}>
                <div style={{
                    marginBottom: '8px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                }}>
                    📡 Telemetry
                </div>

                {/* Position data */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px', lineHeight: 1.7 }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>X:</span>
                    <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{state.position[0].toFixed(2)}m</span>

                    <span style={{ color: '#64748b', fontWeight: 600 }}>Y:</span>
                    <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{state.position[2].toFixed(2)}m</span>

                    <span style={{ color: '#64748b', fontWeight: 600 }}>Alt:</span>
                    <span style={{
                        color: state.position[1] > 0 ? '#4ade80' : '#e2e8f0',
                        fontFamily: 'monospace',
                        fontWeight: state.position[1] > 0 ? 600 : 400
                    }}>{state.position[1].toFixed(2)}m</span>

                    <span style={{ color: '#64748b', fontWeight: 600 }}>Hdg:</span>
                    <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>
                        {(state.rotation[1] * 180 / Math.PI).toFixed(0)}°
                    </span>
                </div>

                {isExecuting && (
                    <div style={{
                        color: '#4ade80',
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid rgba(74, 222, 128, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                    }}>
                        <span style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: '#4ade80',
                            boxShadow: '0 0 6px rgba(74, 222, 128, 0.6)',
                            animation: 'telemetry-pulse 1.2s ease-in-out infinite'
                        }} />
                        LIVE
                    </div>
                )}
            </div>

            {/* Controls hint — improved visibility */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                background: 'rgba(15, 23, 42, 0.88)',
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                color: '#cbd5e1',
                fontSize: '0.78rem',
                zIndex: 100,
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(6px)',
                letterSpacing: '0.01em'
            }}>
                🖱️ Drag to orbit • Scroll to zoom
            </div>

            {/* Inline animation for telemetry pulse */}
            <style>{`
                @keyframes telemetry-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};
