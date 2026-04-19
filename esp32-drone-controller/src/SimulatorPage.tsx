import React from 'react';
import { LazySimulatorWrapper } from './components/Simulator/LazySimulatorWrapper';
import { TIME_SCALE_PRESETS } from './components/Simulator/useDroneSimulator';
import type { DroneState, SimulatorCommand } from './types/simulator';

interface SimulatorPageProps {
    state: DroneState;
    isExecuting: boolean;
    onReset: () => void;
    onBack: () => void;
    onRunSimulation: (commands: SimulatorCommand[]) => Promise<void>;
    pendingCommands: SimulatorCommand[];
    timeScale: number;
    onTimeScaleChange: (scale: number) => void;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
    state,
    isExecuting,
    onReset,
    onBack,
    onRunSimulation,
    pendingCommands,
    timeScale,
    onTimeScaleChange
}) => {
    // Auto-run simulation when page loads with pending commands
    React.useEffect(() => {
        if (pendingCommands.length > 0 && !isExecuting) {
            onRunSimulation(pendingCommands);
        }
    }, []); // Only run once on mount

    // Find the matching preset label for the current time scale
    const activePreset = TIME_SCALE_PRESETS.find(p => p.value === timeScale);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#080c14',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header Bar — improved contrast */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 30, 0.95) 100%)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
                boxShadow: '0 2px 20px rgba(0, 0, 0, 0.4)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'rgba(148, 163, 184, 0.15)',
                            border: '1px solid rgba(148, 163, 184, 0.25)',
                            color: '#e2e8f0',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        ← Back to Editor
                    </button>
                    <h1 style={{
                        fontSize: '1.1rem',
                        margin: 0,
                        color: '#f1f5f9',
                        fontWeight: 600,
                        letterSpacing: '0.02em'
                    }}>
                        🛸 Drone Simulator
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Time Scale Control */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '10px',
                        padding: '0.3rem 0.5rem'
                    }}>
                        <span style={{
                            fontSize: '0.75rem',
                            color: '#94a3b8',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            paddingLeft: '0.25rem'
                        }}>
                            ⏱ Speed
                        </span>
                        {TIME_SCALE_PRESETS.map(preset => {
                            const isActive = timeScale === preset.value;
                            return (
                                <button
                                    key={preset.label}
                                    onClick={() => onTimeScaleChange(preset.value)}
                                    disabled={isExecuting}
                                    style={{
                                        background: isActive
                                            ? 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: isActive
                                            ? '1px solid rgba(129, 140, 248, 0.6)'
                                            : '1px solid rgba(255, 255, 255, 0.08)',
                                        color: isActive ? '#ffffff' : '#94a3b8',
                                        padding: '0.35rem 0.65rem',
                                        borderRadius: '6px',
                                        cursor: isExecuting ? 'not-allowed' : 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: isActive ? 700 : 500,
                                        fontFamily: "'Inter', system-ui, sans-serif",
                                        transition: 'all 0.15s ease',
                                        boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
                                        opacity: isExecuting ? 0.6 : 1,
                                        minWidth: '3rem'
                                    }}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Replay button */}
                    <button
                        onClick={() => {
                            onReset();
                            if (pendingCommands.length > 0) {
                                setTimeout(() => onRunSimulation(pendingCommands), 100);
                            }
                        }}
                        disabled={isExecuting}
                        style={{
                            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            color: '#7dd3fc',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: isExecuting ? 'not-allowed' : 'pointer',
                            opacity: isExecuting ? 0.5 : 1,
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            transition: 'all 0.15s ease'
                        }}
                    >
                        🔁 Replay
                    </button>

                    <button
                        onClick={onReset}
                        disabled={isExecuting}
                        style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            color: '#fca5a5',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: isExecuting ? 'not-allowed' : 'pointer',
                            opacity: isExecuting ? 0.5 : 1,
                            fontSize: '0.9rem',
                            fontWeight: 500,
                            transition: 'all 0.15s ease'
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

            {/* Status Bar — improved contrast and richer status info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 1.5rem',
                background: 'linear-gradient(180deg, rgba(10, 15, 30, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
                borderTop: '1px solid rgba(56, 189, 248, 0.12)',
                fontSize: '0.85rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: isExecuting ? '#4ade80' : '#94a3b8'
                }}>
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isExecuting ? '#4ade80' : '#64748b',
                        boxShadow: isExecuting ? '0 0 8px rgba(74, 222, 128, 0.6)' : 'none',
                        animation: isExecuting ? 'pulse 1.5s ease-in-out infinite' : 'none'
                    }} />
                    {isExecuting ? (
                        <span style={{ fontWeight: 600 }}>▶ Simulation Running...</span>
                    ) : (
                        <span>✓ Ready • Use mouse to orbit camera • Scroll to zoom</span>
                    )}
                </div>

                {/* Speed indicator in status bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#cbd5e1',
                    fontSize: '0.8rem'
                }}>
                    <span style={{ color: '#64748b' }}>Speed:</span>
                    <span style={{
                        color: '#a78bfa',
                        fontWeight: 600,
                        fontFamily: "'Inter', monospace"
                    }}>
                        {activePreset?.label || `${(1 / timeScale).toFixed(2)}×`}
                    </span>
                </div>
            </div>

            {/* Pulse animation for status indicator */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
};
