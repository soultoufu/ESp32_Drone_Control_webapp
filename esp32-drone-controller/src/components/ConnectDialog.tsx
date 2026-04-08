import React, { useState } from 'react';
import { wsManager } from '../utils/WebSocketManager';

interface ConnectDialogProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const ConnectDialog: React.FC<ConnectDialogProps> = ({ onSuccess, onCancel }) => {
    const [address, setAddress] = useState<string>(
        () => localStorage.getItem('rpiAddress') || '192.168.4.1'
    );
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        if (!address.trim()) {
            setError('Please enter an IP address.');
            return;
        }
        setError(null);
        setIsConnecting(true);

        const success = await wsManager.connect(address.trim());

        setIsConnecting(false);
        if (success) {
            localStorage.setItem('rpiAddress', address.trim());
            onSuccess();
        } else {
            setError(`Could not connect to ws://${address.trim()}:8765. Make sure the Raspberry Pi server is running and on the same network.`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleConnect();
        if (e.key === 'Escape') onCancel();
    };

    return (
        /* Backdrop */
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)'
            }}
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            {/* Dialog */}
            <div className="glass-panel" style={{ width: 380, padding: '1.5rem', borderRadius: '12px' }}>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>Connect to Raspberry Pi</h2>
                <p style={{ margin: '0 0 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Enter the IP address of the Raspberry Pi running the drone server.
                </p>

                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                    IP Address <span style={{ opacity: 0.6 }}>(port 8765)</span>
                </label>
                <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. 192.168.4.1"
                    autoFocus
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        outline: 'none',
                        marginBottom: error ? '0.5rem' : '1.25rem'
                    }}
                />

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: '6px',
                        padding: '0.6rem 0.75rem',
                        color: '#fca5a5',
                        fontSize: '0.82rem',
                        marginBottom: '1.25rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        className="btn"
                        onClick={onCancel}
                        disabled={isConnecting}
                        style={{ opacity: isConnecting ? 0.5 : 1 }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConnect}
                        disabled={isConnecting}
                        style={{ minWidth: 100 }}
                    >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
};
