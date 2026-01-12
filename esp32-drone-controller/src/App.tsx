import { useState, useCallback, useRef } from 'react';
import { BlocklyComponent } from './components/Blockly/BlocklyComponent';
import { defineCustomBlocks } from './components/Blockly/customBlocks';
import { initPythonGenerator, generateCode } from './components/Blockly/generator';
import * as Blockly from 'blockly/core';
import { serialManager } from './utils/SerialManager';
import { SimulatorPage } from './SimulatorPage';
import { useDroneSimulator } from './components/Simulator/useDroneSimulator';
import { initSimGenerator, generateSimCommands } from './components/Blockly/simGenerator';
import type { SimulatorCommand } from './types/simulator';
import './index.css';

defineCustomBlocks();
initPythonGenerator();
initSimGenerator();

function App() {
  const [pythonCode, setPythonCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Simulator Page State
  const [showSimulator, setShowSimulator] = useState(false);
  const [pendingCommands, setPendingCommands] = useState<SimulatorCommand[]>([]);

  // Store workspace XML for persistence
  const workspaceXmlRef = useRef<string>('<xml xmlns="http://www.w3.org/1999/xhtml"></xml>');

  const { state: simState, isExecuting: isSimulating, runSimulation, resetSimulation } = useDroneSimulator();

  const handleXmlChange = useCallback((xml: string) => {
    // Save the XML whenever the workspace changes
    workspaceXmlRef.current = xml;
  }, []);

  const handleCodeChange = useCallback(() => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      const code = generateCode(workspace);
      setPythonCode(code);
    }
  }, []);

  const handleSimulate = () => {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      const commands = generateSimCommands(workspace);
      // Reset before starting new simulation
      resetSimulation();
      // Store commands and show simulator page
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
    <>
      {/* Simulator Page - rendered as overlay when active */}
      {showSimulator && (
        <SimulatorPage
          state={simState}
          isExecuting={isSimulating}
          onReset={resetSimulation}
          onBack={handleBackFromSimulator}
          onRunSimulation={runSimulation}
          pendingCommands={pendingCommands}
        />
      )}

      {/* Main Editor - always rendered but hidden when simulator is active */}
      <div
        className="app-container"
        style={{
          display: showSimulator ? 'none' : undefined
        }}
      >
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.2rem', margin: 0 }}>🛸 Drone Blocks</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className={`btn ${isConnected ? 'btn-primary' : ''} `}
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
            {pythonCode || "# Drag blocks to generate code..."}
          </pre>
        </div>
      </div>
    </>
  );
}

export default App;
