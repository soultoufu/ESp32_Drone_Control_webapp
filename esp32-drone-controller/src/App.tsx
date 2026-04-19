import { useState, useCallback, useRef, useEffect } from 'react';
import { BlocklyComponent } from './components/Blockly/BlocklyComponent';
import { defineCustomBlocks } from './components/Blockly/customBlocks';
import { initPythonGenerator, generateCode } from './components/Blockly/generator';
import * as Blockly from 'blockly/core';
import { wsManager } from './utils/WebSocketManager';
import { flightExecutor } from './utils/FlightExecutor';
import { SimulatorPage } from './SimulatorPage';
import { useDroneSimulator } from './components/Simulator/useDroneSimulator';
import { initSimGenerator, generateSimCommands } from './components/Blockly/simGenerator';
import { ConnectDialog } from './components/ConnectDialog';
import { TelemetryPanel } from './components/TelemetryPanel';
import type { SimulatorCommand } from './types/simulator';
import './index.css';

defineCustomBlocks();
initPythonGenerator();
initSimGenerator();

// --- Toast notification types ---
type ToastLevel = 'info' | 'success' | 'error';
interface Toast { text: string; kind: ToastLevel }

function App() {
  const [pythonCode, setPythonCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [pendingCommands, setPendingCommands] = useState<SimulatorCommand[]>([]);

  // Connection dialog
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  // Sidebar tabs
  const [sidebarTab, setSidebarTab] = useState<'instructions' | 'telemetry'>('instructions');

  // Serial/RPi logs for TelemetryPanel
  const [serialLogs, setSerialLogs] = useState<string[]>([]);

  // Toast notifications (replaces alert())
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((text: string, kind: ToastLevel = 'info') => {
    setToast({ text, kind });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  // Workspace XML — persisted to localStorage (Bug 7 fix)
  // Read directly (not a lazy initializer — useRef doesn't support that)
  const workspaceXmlRef = useRef<string>(
    localStorage.getItem('droneWorkspaceXml') || '<xml xmlns="http://www.w3.org/1999/xhtml"></xml>'
  );

  const { state: simState, isExecuting: isSimulating, timeScale, setTimeScale, runSimulation, resetSimulation } = useDroneSimulator();

  // Wire up WebSocketManager callbacks on mount (Bug 8 fix: disconnect detection)
  useEffect(() => {
    wsManager.onDisconnect(() => {
      setIsConnected(false);
      showToast('Disconnected from Raspberry Pi', 'error');
    });

    wsManager.onData((line: string) => {
      setSerialLogs(prev => [...prev.slice(-200), line]);
    });

    wsManager.onStatus((message: string, level) => {
      if (level === 'error') {
        showToast(message, 'error');
      } else if (level === 'success') {
        showToast(message, 'success');
      }
      // debug/info messages flow to the terminal via onData
    });

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [showToast]);

  const handleXmlChange = useCallback((xml: string) => {
    workspaceXmlRef.current = xml;
    // Bug 7 fix: persist workspace to localStorage
    localStorage.setItem('droneWorkspaceXml', xml);
  }, []);

  const handleCodeChange = useCallback(() => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      setPythonCode(generateCode(workspace));
    }
  }, []);

  const handleSimulate = () => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      const commands = generateSimCommands(workspace);
      resetSimulation();
      setPendingCommands(commands);
      setShowSimulator(true);
    }
  };

  const handleBackFromSimulator = () => {
    setShowSimulator(false);
    setPendingCommands([]);
  };

  const handleConnect = async () => {
    if (isConnected) {
      await wsManager.disconnect();
      setIsConnected(false);
    } else {
      setShowConnectDialog(true);
    }
  };

  const handleConnectSuccess = () => {
    setIsConnected(true);
    setShowConnectDialog(false);
    showToast('Connected to Raspberry Pi', 'success');
    // Switch to telemetry tab so the user can see incoming data
    setSidebarTab('telemetry');
    // Wire binary MSP responses to telemetry display and start polling
    flightExecutor.onTelemetry((data) => {
      setSerialLogs(prev => [...prev.slice(-200), JSON.stringify(data)]);
    });
    flightExecutor.startTelemetryPolling();
  };

  const handleExecute = async () => {
    if (!isConnected) {
      showToast('Please connect to the Raspberry Pi first.', 'error');
      return;
    }
    const workspace = Blockly.getMainWorkspace();
    if (!workspace) return;
    const commands = generateSimCommands(workspace);
    if (commands.length === 0) {
      showToast('No blocks to execute. Add some blocks first.', 'info');
      return;
    }

    setIsUploading(true);
    showToast('Executing flight plan...', 'info');
    try {
      await flightExecutor.execute(commands, (msg) => {
        setSerialLogs(prev => [...prev.slice(-200), msg]);
      });
      showToast('Flight plan complete.', 'success');
    } catch (error) {
      console.error('Execution failed', error);
      showToast('Execution failed. Check the telemetry log.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Toast color map
  const toastColors: Record<ToastLevel, string> = {
    info: 'rgba(56,189,248,0.2)',
    success: 'rgba(74,222,128,0.2)',
    error: 'rgba(239,68,68,0.2)'
  };
  const toastBorderColors: Record<ToastLevel, string> = {
    info: 'rgba(56,189,248,0.5)',
    success: 'rgba(74,222,128,0.5)',
    error: 'rgba(239,68,68,0.5)'
  };
  const toastTextColors: Record<ToastLevel, string> = {
    info: '#7dd3fc',
    success: '#86efac',
    error: '#fca5a5'
  };

  return (
    <>
      {/* Connection dialog */}
      {showConnectDialog && (
        <ConnectDialog
          onSuccess={handleConnectSuccess}
          onCancel={() => setShowConnectDialog(false)}
        />
      )}

      {/* Toast notification (Bug 9 fix: replaces alert()) */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 3000,
          background: toastColors[toast.kind],
          border: `1px solid ${toastBorderColors[toast.kind]}`,
          color: toastTextColors[toast.kind],
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          backdropFilter: 'blur(8px)',
          fontSize: '0.9rem',
          maxWidth: 360,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          pointerEvents: 'none'
        }}>
          {toast.text}
        </div>
      )}

      {/* Simulator page */}
      {showSimulator && (
        <SimulatorPage
          state={simState}
          isExecuting={isSimulating}
          onReset={resetSimulation}
          onBack={handleBackFromSimulator}
          onRunSimulation={runSimulation}
          pendingCommands={pendingCommands}
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
        />
      )}

      {/* Main Editor */}
      <div
        className="app-container"
        style={{ display: showSimulator ? 'none' : undefined }}
      >
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.2rem', margin: 0 }}>🛸 Drone Blocks</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className={`btn ${isConnected ? 'btn-primary' : ''}`}
              onClick={handleConnect}
            >
              {isConnected ? 'Disconnect 🔌' : 'Connect to RPi 📡'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExecute}
              disabled={!isConnected || isUploading}
              style={{ opacity: (!isConnected || isUploading) ? 0.5 : 1 }}
            >
              {isUploading ? 'Executing... ⏳' : 'Execute 🚀'}
            </button>
            {isUploading && (
              <button
                className="btn"
                onClick={() => { flightExecutor.abort(); setIsUploading(false); }}
                style={{ background: 'rgba(239,68,68,0.3)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.5)' }}
              >
                Abort ✋
              </button>
            )}
            <button
              className="btn"
              onClick={handleSimulate}
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
                color: 'white'
              }}
            >
              Test Virtual 🎮
            </button>
          </div>
        </header>

        {/* Sidebar with tabs */}
        <div className="sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          {/* Tab headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
            {(['instructions', 'telemetry'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  background: sidebarTab === tab ? 'rgba(56,189,248,0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: sidebarTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
                  color: sidebarTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'hidden', padding: sidebarTab === 'instructions' ? '1rem' : 0 }}>
            {sidebarTab === 'instructions' ? (
              <>
                <h3 style={{ margin: '0 0 0.75rem' }}>Instructions</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  1. Power on your Raspberry Pi drone and connect to its WiFi network.
                  <br /><br />
                  2. Click <strong>"Connect to RPi"</strong> and enter its IP address.
                  <br /><br />
                  3. Build your flight plan with blocks.
                  <br /><br />
                  4. Click <strong>"Execute"</strong> to send the flight plan via MSP.
                  <br /><br />
                  5. Use <strong>"Test Virtual"</strong> to simulate without hardware.
                </p>

                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem' }}>Status</h4>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: isConnected ? '#4ade80' : '#f87171'
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      backgroundColor: isConnected ? '#4ade80' : '#f87171',
                      boxShadow: isConnected ? '0 0 6px #4ade80' : 'none'
                    }} />
                    {isConnected ? 'Connected to RPi' : 'Disconnected'}
                  </div>
                </div>
              </>
            ) : (
              <TelemetryPanel logs={serialLogs} />
            )}
          </div>
        </div>

        <div className="workspace glass-panel" style={{ margin: '1rem', border: 'none', overflow: 'hidden' }}>
          <BlocklyComponent
            onCodeChange={handleCodeChange}
            onXmlChange={handleXmlChange}
            initialXml={workspaceXmlRef.current}
          />
        </div>

        <div className="code-preview glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--glass-border)',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            background: 'rgba(0,0,0,0.1)'
          }}>
            MicroPython Preview
          </div>
          <pre style={{ margin: 0, padding: '1rem', overflow: 'auto', flex: 1 }}>
            {pythonCode || '# Drag blocks to generate code...'}
          </pre>
        </div>
      </div>
    </>
  );
}

export default App;
