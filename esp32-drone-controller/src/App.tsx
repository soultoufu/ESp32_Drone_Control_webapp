import { useState, useCallback, useEffect } from 'react';
import { BlocklyComponent } from './components/Blockly/BlocklyComponent';
import { defineCustomBlocks } from './components/Blockly/customBlocks';
import { initPythonGenerator, generateCode } from './components/Blockly/generator';
import * as Blockly from 'blockly/core';
import { serialManager } from './utils/SerialManager';
import { TelemetryPanel } from './components/TelemetryPanel';
import './index.css';

// Initialize blocks and generator once
defineCustomBlocks();
initPythonGenerator();

function App() {
  const [pythonCode, setPythonCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'telemetry'>('code');
  const [logs, setLogs] = useState<string[]>([]);

  const handleXmlChange = useCallback(() => {
    // We can save the XML here if needed for persistence
  }, []);

  const handleCodeChange = useCallback(() => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      const code = generateCode(workspace);
      setPythonCode(code);
    }
  }, []);

  useEffect(() => {
    serialManager.onData((data) => {
      setLogs(prev => [...prev.slice(-99), data]); // Keep last 100 lines
    });
  }, []);

  const handleConnect = async () => {
    if (isConnected) {
      await serialManager.disconnect();
      setIsConnected(false);
    } else {
      const success = await serialManager.connect();
      setIsConnected(success);
    }
  };

  const handleUpload = async () => {
    if (!isConnected) {
      alert("Please connect to the drone first!");
      return;
    }

    setIsUploading(true);
    try {
      console.log("Uploading code:", pythonCode);
      await serialManager.uploadCode(pythonCode);
      alert("Upload Complete! The drone should be executing your code.");
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Check console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.2rem', margin: 0 }}>🛸 Drone Blocks</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className={`btn ${isConnected ? 'btn-primary' : ''}`}
            onClick={handleConnect}
          >
            {isConnected ? 'Disconnect 🔌' : 'Connect ESP32 (USB)'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!isConnected || isUploading}
            style={{ opacity: (!isConnected || isUploading) ? 0.5 : 1 }}
          >
            {isUploading ? 'Uploading... ⏳' : 'Upload & Run 🚀'}
          </button>
        </div>
      </header>

      <div className="sidebar glass-panel">
        <h3>Instructions</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          1. Connect your ESP32 Drone via USB.
          <br />
          2. Click "Connect ESP32".
          <br />
          3. Build your flight plan.
          <br />
          4. Click "Upload & Run".
        </p>

        <div style={{ marginTop: '2rem' }}>
          <h4>Status</h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: isConnected ? '#4ade80' : '#f87171'
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#4ade80' : '#f87171'
            }} />
            {isConnected ? 'Device Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      <div className="workspace glass-panel" style={{ margin: '1rem', border: 'none', overflow: 'hidden' }}>
        <BlocklyComponent
          onCodeChange={handleCodeChange}
          onXmlChange={handleXmlChange}
          initialXml={'<xml xmlns="http://www.w3.org/1999/xhtml"></xml>'}
        />
      </div>

      <div className="code-preview glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--glass-border)'
        }}>
          <button
            onClick={() => setActiveTab('code')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'code' ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'code' ? 'bold' : 'normal',
              transition: 'background 0.2s'
            }}
          >
            Code Preview
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: activeTab === 'telemetry' ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'telemetry' ? 'bold' : 'normal',
              borderLeft: '1px solid var(--glass-border)',
              transition: 'background 0.2s'
            }}
          >
            Telemetry {isConnected && <span style={{ fontSize: '0.5em' }}>🟢</span>}
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'code' ? (
            <>
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
                {pythonCode || "# Drag blocks to generate code..."}
              </pre>
            </>
          ) : (
            <div style={{ flex: 1, overflow: 'hidden', padding: '0.5rem' }}>
              <TelemetryPanel logs={logs} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
