import React from 'react';
import { LazySimulatorWrapper } from './components/Simulator/LazySimulatorWrapper';
import type { DroneState, SimulatorCommand } from './types/simulator';

interface SimulatorPageProps {
    state: DroneState;
    isExecuting: boolean;
    onReset: () => void;
    onBack: () => void;
    onRunSimulation: (commands: SimulatorCommand[]) => Promise<void>;
    pendingCommands: SimulatorCommand[];
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
    state,
    isExecuting,
    onReset,
    onBack,
    onRunSimulation,
    pendingCommands
}) => {
    // Auto-run simulation when page loads with pending commands
    React.useEffect(() => {
        if (pendingCommands.length > 0 && !isExecuting) {
            onRunSimulation(pendingCommands);
        }
    }, []); // Only run once on mount

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#0a0a0f',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header Bar */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.5rem',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}
                    >
                        ← Back to Editor
                    </button>
                    <h1 style={{
                        fontSize: '1.1rem',
                        margin: 0,
                        color: 'white',
                        fontWeight: 'normal'
                    }}>
                        🛸 Drone Simulator
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onReset}
                        disabled={isExecuting}
                        style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#ef4444',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: isExecuting ? 'not-allowed' : 'pointer',
                            opacity: isExecuting ? 0.5 : 1,
                            fontSize: '0.9rem'
                        }}
                    >
                        🔄 Reset Position
                    </button>
                </div>
            </header>

            {/* 3D Simulator (Full Screen) */}
            <div style={{ flex: 1, position: 'relative' }}>
                <LazySimulatorWrapper
                    state={state}
                    isExecuting={isExecuting}
                    onReset={onReset}
                />
            </div>

            {/* Status Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem',
                background: 'rgba(0,0,0,0.5)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                color: isExecuting ? '#4ade80' : 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem'
            }}>
                {isExecuting ? (
                    <span>▶ Simulation Running...</span>
                ) : (
                    <span>✓ Ready • Use mouse to orbit camera • Scroll to zoom</span>
                )}
            </div>
        </div>
    );
};
