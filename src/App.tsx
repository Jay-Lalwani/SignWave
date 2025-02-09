import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import WorkflowEditor, { WorkflowData } from './components/WorkflowEditor';
import PresentationMode from './components/PresentationMode';
import GeneratePresentationModal from './components/GeneratePresentationModal';
import { generatePresentationWorkflow } from './components/GeneratePresentationWorkflow';
import { generateProjectImage } from './components/GenerateProjectImage';
import openai from 'openai';

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

  // Function to update image nodes by generating a project image using the node's label as prompt.
  async function updateImageNodes(currentWorkflow: WorkflowData, client: any): Promise<WorkflowData> {
    const updatedNodes = await Promise.all(
      currentWorkflow.nodes.map(async (node) => {
        if (node.type === "imageNode" && node.data.label) {
          try {
            const imageUrl = await generateProjectImage(node.data.content, client);
            return {
              ...node,
              data: {
                ...node.data,
                url: imageUrl,
              },
            };
          } catch (error) {
            console.error(`Error generating image for node ${node.id}:`, error);
            return node;
          }
        }
        return node;
      })
    );
    return { ...currentWorkflow, nodes: updatedNodes };
  }

  const [showGenerateModal, setShowGenerateModal] = useState(false);

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
          onGenerate={async (prompt) => {
            const client = new openai.OpenAI({
              baseURL: "https://api.ai.it.cornell.edu",
              apiKey: process.env.REACT_APP_OPENAI_API_KEY,
              dangerouslyAllowBrowser: true,
            });
            try {
              const generatedWorkflow = await generatePresentationWorkflow(prompt, client);
              if (generatedWorkflow && Array.isArray(generatedWorkflow.nodes) && Array.isArray(generatedWorkflow.edges)) {
                const modalElement = document.querySelector('textarea')?.closest('div')?.querySelector('p');
                if (modalElement) modalElement.textContent = 'Generating Images...';
                await new Promise(resolve => setTimeout(resolve, 100)); // Let the UI update
                const updatedWorkflow = await updateImageNodes(generatedWorkflow, client);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWorkflow));
                setWorkflow(updatedWorkflow);
              } else {
                console.error("Generated workflow does not match expected format.");
              }
            } catch (error) {
              console.error("Error generating presentation:", error);
            }
            setShowGenerateModal(false);
          }}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </div>
  );
}

export default App;
