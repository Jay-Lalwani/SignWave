import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import WorkflowEditor, { WorkflowData } from './components/WorkflowEditor';
import PresentationMode from './components/PresentationMode';
import CADController from './components/CADMode/CADController';

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
      // Ensure the parsed data has the correct structure
      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        return parsed;
      }
      return defaultWorkflow;
    } catch (e) {
      console.error('Failed to parse saved workflow:', e);
      return defaultWorkflow;
    }
  });

  // Save workflow whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflow));
    } catch (e) {
      console.error('Failed to save workflow:', e);
    }
  }, [workflow]);

  const handleWorkflowUpdate = useCallback((newWorkflow: WorkflowData) => {
    setWorkflow(newWorkflow);
  }, []);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="mode-controls">
          <button onClick={() => handleModeChange('edit')} className={mode === 'edit' ? 'active' : ''}>
            Edit Mode
          </button>
          <button onClick={() => handleModeChange('present')} className={mode === 'present' ? 'active' : ''}>
            Present Mode
          </button>
          <button onClick={() => handleModeChange('cad')} className={mode === 'cad' ? 'active' : ''}>
            CAD Mode
          </button>
        </div>
      </header>
      <main>
        {mode === 'edit' && (
          <WorkflowEditor onWorkflowUpdate={handleWorkflowUpdate} initialWorkflow={workflow} />
        )}
        {mode === 'present' && (
          <PresentationMode workflow={workflow} />
        )}
        {mode === 'cad' && (
          <CADController
            isActive={true}
            gestureData={mode === 'cad' ? undefined : null} // We'll integrate gesture data here
          />
        )}
      </main>
    </div>
  );
}

export default App;
