import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import WorkflowEditor, { WorkflowData } from './components/WorkflowEditor';
import PresentationMode from './components/PresentationMode';
import CADController from './components/CADMode/CADController';
import GestureRecognizer, { GestureResult } from './components/GestureRecognizer';

type Mode = 'edit' | 'present' | 'cad';

const STORAGE_KEY = 'gesture_presentation_workflow';

const defaultWorkflow: WorkflowData = {
  nodes: [{
    id: '1',
    type: 'textNode',
    data: { label: 'Start', content: '', type: 'text' },
    position: { x: 250, y: 25 },
  }],
  edges: []
};

function App() {
  const [mode, setMode] = useState<Mode>('edit');
  const [workflow, setWorkflow] = useState<WorkflowData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultWorkflow;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        return parsed;
      }
      return defaultWorkflow;
    } catch (e) {
      console.error('Failed to parse saved workflow:', e);
      return defaultWorkflow;
    }
  });

  const [gestureData, setGestureData] = useState<{
    handPosition: { x: number; y: number; z: number };
    isGrabbing: boolean;
    gesture: string;
  } | null>(null);

  const [calibrationComplete, setCalibrationComplete] = useState(false);

  // Debug log for state changes
  useEffect(() => {
    console.log('App state:', { mode, calibrationComplete, hasGestureData: !!gestureData });
  }, [mode, calibrationComplete, gestureData]);

  // Save workflow whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
    } catch (e) {
      console.error('Failed to save workflow:', e);
    }
  }, [workflow]);

  // Add debug logging for state changes
  useEffect(() => {
    console.log('App state updated:', {
      mode,
      calibrationComplete,
      hasGestureData: !!gestureData,
      currentGesture: gestureData?.gesture
    });
  }, [mode, calibrationComplete, gestureData]);

  const handleWorkflowUpdate = useCallback((newWorkflow: WorkflowData) => {
    setWorkflow(newWorkflow);
  }, []);

  const handleGestureDetected = useCallback((result: GestureResult) => {
    console.log('App received gesture:', result);
    // Update gesture data with hand position if available
    setGestureData({
      handPosition: result.handPosition || { x: 0, y: 0, z: 0 },
      isGrabbing: result.gesture === 'Closed_Fist',
      gesture: result.gesture
    });
  }, []);

  const handleModeChange = (newMode: Mode) => {
    console.log('Changing mode to:', newMode);
    setMode(newMode);
    if (newMode === 'cad') {
      setCalibrationComplete(false);
    }
  };

  const handleCalibrationComplete = useCallback(() => {
    console.log('Calibration complete');
    setCalibrationComplete(true);
  }, []);

  return (
    <div className={`App ${mode === 'cad' ? 'cad-mode-active' : ''}`}>
      <header className="App-header">
        <div className="mode-controls">
          <button onClick={() => handleModeChange('edit')} className={mode === 'edit' ? 'active' : ''}>
            Edit Mode
          </button>
          <button onClick={() => handleModeChange('present')} className={mode === 'present' ? 'active' : ''}>
            Present Mode
          </button>
          <button onClick={() => handleModeChange('cad')} className={mode === 'cad' ? 'active' : ''}>
            CAD Mode {calibrationComplete ? '(Calibrated)' : ''}
          </button>
        </div>
      </header>
      <main>
        {mode === 'cad' && !calibrationComplete && (
          <GestureRecognizer
            onGestureDetected={handleGestureDetected}
            showWebcam={true}
            startCalibration={true}
            onCalibrationComplete={handleCalibrationComplete}
          />
        )}

        {mode === 'edit' && (
          <WorkflowEditor onWorkflowUpdate={handleWorkflowUpdate} initialWorkflow={workflow} />
        )}
        {mode === 'present' && (
          <PresentationMode workflow={workflow} />
        )}
        {mode === 'cad' && calibrationComplete && (
          <div style={{ width: '100%', height: 'calc(100vh - 60px)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
              <CADController
                isActive={true}
                gestureData={gestureData || undefined}
                onModeChange={(isCADMode) => {
                  if (!isCADMode && mode === 'cad') {
                    handleModeChange('edit');
                  }
                }}
              />
            </div>
            <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
              <GestureRecognizer
                onGestureDetected={handleGestureDetected}
                showWebcam={true}
                startCalibration={false}
                className="cad-gesture-recognizer"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
