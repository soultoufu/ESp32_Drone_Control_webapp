import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Scene } from './Scene';
import { VirtualDrone } from './VirtualDrone';
import { Suspense } from 'react';
import type { DroneState } from '../../types/simulator';

interface SimulatorPanelProps {
    state: DroneState;
    isExecuting: boolean;
    onRun: () => void;
    onReset: () => void;
}

export const SimulatorPanel = ({ state, isExecuting, onRun, onReset }: SimulatorPanelProps) => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#020617' }}>
            <Canvas shadows>
                <Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[5, 5, 5]} />
                    <OrbitControls makeDefault />

                    {/* Lights */}
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} castShadow />
                    <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                    {/* World */}
                    <Scene />

                    {/* The Drone */}
                    <VirtualDrone position={state.position} rotation={state.rotation} />
                </Suspense>
            </Canvas>

            {/* Overlay UI */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                pointerEvents: 'none'
            }}>
                <div style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(4px)'
                }}>
                    Simulator {isExecuting ? 'Running... ⏳' : 'Ready'}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', pointerEvents: 'auto' }}>
                    <button
                        onClick={onRun}
                        disabled={isExecuting}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: isExecuting ? 0.5 : 1 }}
                    >
                        {isExecuting ? 'Executing...' : 'Run Simulation'}
                    </button>
                    <button
                        onClick={onReset}
                        className="btn"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', color: 'white' }}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};
