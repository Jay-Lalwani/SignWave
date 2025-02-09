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
    // Check URL parameters for workflow URL
    const urlParams = new URLSearchParams(window.location.search);
    const workflowUrl = urlParams.get('url');
    
    if (workflowUrl) {
      // Fetch and load the workflow from URL
      fetch(workflowUrl)
        .then(response => response.json())
        .then(parsed => {
          if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
            setWorkflow(parsed);
            // change the url to the base url
            setTimeout(() => {
              window.history.replaceState({}, '', window.location.pathname);
              window.location.reload();
            }, 100);
          } else {
            alert('Invalid workflow format in the provided URL');
          }
        })
        .catch(err => {
          console.error('Error loading workflow from URL:', err);
          alert('Failed to load workflow from URL. Check console for details.');
        });
    }

    // Load from localStorage as fallback
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
          <>
            <button onClick={() => setShowGenerateModal(true)}>
              Generate Presentation
            </button>
            <button onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workflow));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "presentation_workflow.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}>
              Export Workflow
            </button>
            <button onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    try {
                      const content = e.target?.result as string;
                      const parsed = JSON.parse(content);
                      if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
                        setWorkflow(parsed);
                        setTimeout(() => window.location.reload(), 100);
                      } else {
                        alert('Invalid workflow format');
                      }
                    } catch (err) {
                      alert('Error reading file: ' + err);
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}>
              Import Workflow
            </button>
            <button onClick={() => {
              const url = prompt('Enter URL to workflow JSON file:');
              if (url) {
                window.location.href = `${window.location.pathname}?url=${encodeURIComponent(url)}`;
              }
            }}>
              Load from URL
            </button>
          </>
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
