import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import WorkflowEditor, { WorkflowData } from './components/WorkflowEditor';
import PresentationMode from './components/PresentationMode';
import GeneratePresentationModal from './components/GeneratePresentationModal';
import { generatePresentationWorkflow } from './components/GeneratePresentationWorkflow';

type Mode = 'edit' | 'present';

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

  // Save workflow changes to localStorage.
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

  // State to control the generate presentation modal.
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Function to generate the presentation workflow from the user's prompt.
  const handleGeneratePresentation = async (prompt: string) => {
    try {
      const generatedWorkflow = await generatePresentationWorkflow(prompt);
      if (generatedWorkflow && Array.isArray(generatedWorkflow.nodes) && Array.isArray(generatedWorkflow.edges)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(generatedWorkflow));
        setWorkflow(generatedWorkflow);
      } else {
        console.error("Generated workflow does not match expected format.");
      }
    } catch (error) {
      console.error("Error generating presentation:", error);
    }
    setShowGenerateModal(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={() => setMode(mode === 'edit' ? 'present' : 'edit')}>
          Switch to {mode === 'edit' ? 'Presentation' : 'Edit'} Mode
        </button>
        {mode === 'edit' && (
          <button onClick={() => setShowGenerateModal(true)}>
            Generate Presentation
          </button>
        )}
      </header>
      <main>
        {mode === 'edit' ? (
          <WorkflowEditor onWorkflowUpdate={handleWorkflowUpdate} initialWorkflow={workflow} />
        ) : (
          <PresentationMode workflow={workflow} />
        )}
      </main>
      {showGenerateModal && (
        <GeneratePresentationModal
          onGenerate={handleGeneratePresentation}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
}

export default App;
