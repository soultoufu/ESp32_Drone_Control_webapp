import React, { Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import type { DroneState } from '../../types/simulator';

// Lazy load the 3D simulator component
// This ensures 'three' and '@react-three/fiber' are only loaded when this component is rendered
const LazySimulatorPanel3D = React.lazy(() =>
    import('./SimulatorPanel3D').then(module => ({ default: module.SimulatorPanel3D }))
);

interface Props {
    state: DroneState;
    isExecuting: boolean;
    onReset: () => void;
}

export const LazySimulatorWrapper: React.FC<Props> = (props) => {
    return (
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
            <ErrorBoundary
                fallback={
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                        padding: '2rem',
                        textAlign: 'center',
                        background: '#1a1a2e'
                    }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>⚠️ 3D Simulator Unavailable</h3>
                        <p>The 3D engine could not be loaded.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem' }}>
                            This usually happens if dependencies are missing.
                            Try running: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>npm install three @react-three/fiber @react-three/drei</code>
                        </p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '1rem' }}>
                            The app will continue to work - only the 3D preview is affected.
                        </p>
                    </div>
                }
            >
                <Suspense fallback={
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        background: '#0a0a0f'
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧊</div>
                        <div>Loading 3D Engine...</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>
                            This may take a moment on first load
                        </div>
                    </div>
                }>
                    <LazySimulatorPanel3D {...props} />
                </Suspense>
            </ErrorBoundary>
        </div>
    );
};
