import { useEffect, useRef, useState } from 'react';

interface TelemetryPanelProps {
    logs: string[];
}

export const TelemetryPanel = ({ logs }: TelemetryPanelProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [metrics, setMetrics] = useState<Record<string, any>>({});

    // Parse logs for telemetry data
    useEffect(() => {
        if (logs.length === 0) return;

        // Check the latest log for JSON telemetry
        const lastLog = logs[logs.length - 1];
        try {
            if (lastLog.trim().startsWith('{')) {
                const data = JSON.parse(lastLog);
                if (data.type === 'telemetry') {
                    // Merge new metrics
                    setMetrics(prev => ({ ...prev, ...data }));
                }
            }
        } catch (e) {
            // Not JSON or parse error, just ignore
        }
    }, [logs]);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>

            {/* Metrics Dashboard */}
            <div className="glass-panel" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                <MetricCard label="Battery" value={metrics.battery ? `${metrics.battery}%` : 'N/A'} icon="🔋" />
                <MetricCard label="Height" value={metrics.height ? `${metrics.height}m` : 'N/A'} icon="📏" />
                <MetricCard label="Speed" value={metrics.speed ? `${metrics.speed}m/s` : 'N/A'} icon="🚀" />
                <MetricCard label="State" value={metrics.state || 'Unknown'} icon="🤖" />
            </div>

            {/* Terminal Output */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    padding: '0.5rem 1rem',
                    borderBottom: '1px solid var(--glass-border)',
                    fontWeight: 'bold',
                    background: 'rgba(0,0,0,0.1)'
                }}>
                    RPi Terminal
                </div>
                <div
                    ref={scrollRef}
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem',
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        color: '#e2e8f0'
                    }}
                >
                    {logs.length === 0 ? (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Waiting for data...
                        </span>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} style={{ marginBottom: '0.25rem', wordBreak: 'break-all' }}>
                                <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem', fontSize: '0.8em' }}>
                                    {'>'}
                                </span>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, icon }: { label: string, value: string | number, icon: string }) => (
    <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{value}</div>
    </div>
);
