import React, { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { TextNode } from './nodes/TextNode';
import { ImageNode } from './nodes/ImageNode';
import { VideoNode } from './nodes/VideoNode';
import { ApiNode } from './nodes/ApiNode';
import { GestureEdge } from './edges/GestureEdge';
import { NodeEditorPanel } from './panels/NodeEditorPanel';
import { EdgeEditorPanel } from './panels/EdgeEditorPanel';
import { SlideNodeData } from '../types/workflow';
import { NODE_TYPES, initialNodes } from '../constants/workflow';

type Props = {
  onWorkflowUpdate?: (data: WorkflowData) => void;
  initialWorkflow?: WorkflowData;
};

export type WorkflowData = {
  nodes: Node<SlideNodeData>[];
  edges: Edge[];
};

const WorkflowEditor: React.FC<Props> = ({ onWorkflowUpdate, initialWorkflow }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialWorkflow?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialWorkflow?.edges || []
  );
  const [selectedNode, setSelectedNode] = useState<Node<SlideNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Load initial workflow when it changes
  React.useEffect(() => {
    if (initialWorkflow) {
      setNodes(initialWorkflow.nodes);
      setEdges(initialWorkflow.edges);
    }
  }, [initialWorkflow, setNodes, setEdges]);

  const handleNodeFormChange = useCallback((updates: Partial<SlideNodeData>) => {
    if (!selectedNode) return;

    const updatedNode = {
      ...selectedNode,
      data: { ...selectedNode.data, ...updates }
    };

    setNodes(nds => {
      const updated = nds.map(n => n.id === selectedNode.id ? updatedNode : n);
      onWorkflowUpdate?.({ nodes: updated, edges });
      return updated;
    });
  }, [selectedNode, edges, onWorkflowUpdate, setNodes]);

  const handleGestureChange = useCallback((gesture: string) => {
    if (!selectedEdge) return;

    const updatedEdge = {
      ...selectedEdge,
      data: { gesture },
      label: gesture,
      animated: !!gesture,
      style: { 
        strokeWidth: 2,
        stroke: gesture ? '#ff0072' : '#b1b1b7'
      }
    };

    setEdges(eds => {
      const updated = eds.map(e => e.id === selectedEdge.id ? updatedEdge : e);
      onWorkflowUpdate?.({ nodes, edges: updated });
      return updated;
    });
  }, [selectedEdge, nodes, onWorkflowUpdate, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges(eds => {
        // Check if connection already exists
        const connectionExists = eds.some(
          edge => edge.source === params.source && edge.target === params.target
        );

        if (connectionExists) {
          alert('A connection already exists between these nodes!');
          return eds;
        }

        const newEdge = {
          ...params,
          id: `${params.source}-${params.target}-${Date.now()}`,
          type: 'gesture',
          data: { gesture: '' },
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { strokeWidth: 2 },
          animated: false,
          label: 'Click to set gesture'
        };
        const updated = addEdge(newEdge, eds);
        onWorkflowUpdate?.({ nodes, edges: updated });
        setSelectedEdge(newEdge as Edge);
        return updated;
      });
    },
    [nodes, onWorkflowUpdate, setEdges]
  );

  const onNodeDragStop = useCallback(() => {
    onWorkflowUpdate?.({ nodes, edges });
  }, [nodes, edges, onWorkflowUpdate]);

  const addNode = useCallback((type: string) => {
    const newNode: Node<SlideNodeData> = {
      id: `${Date.now()}`,
      type,
      data: { 
        label: `New ${NODE_TYPES.find(t => t.id === type)?.label}`, 
        content: '',
        type: type === 'apiNode' ? 'api' : 
              type === 'imageNode' ? 'image' : 
              type === 'videoNode' ? 'video' : 
              'text',
        // Initialize with empty values based on type
        ...(type === 'videoNode' ? { 
          videoUrl: '', 
          autoplay: false, 
          loop: false,
          playPauseGesture: '',
          scrubForwardGesture: '',
          scrubBackwardGesture: ''
        } : {}),
        ...(type === 'imageNode' ? { url: '' } : {}),
        ...(type === 'apiNode' ? { apiEndpoint: '', apiMethod: 'GET', apiPayload: '' } : {})
      },
      position: {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100,
      },
    };

    setNodes(nds => {
      const updated = [...nds, newNode];
      onWorkflowUpdate?.({ nodes: updated, edges });
      return updated;
    });
  }, [edges, onWorkflowUpdate, setNodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    setSelectedNode(node as Node<SlideNodeData>);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Memoize node and edge types
  const nodeTypes = useMemo(() => ({
    textNode: TextNode,
    imageNode: ImageNode,
    videoNode: VideoNode,
    apiNode: ApiNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    gesture: GestureEdge,
  }), []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex' }} onClick={() => {
      setSelectedNode(null);
      setSelectedEdge(null);
    }}>
      <div style={{ flex: 1, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Strict}
          snapToGrid
          fitView
          defaultEdgeOptions={{
            type: 'gesture',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 }
          }}
        >
          <Controls />
          <Background />
          <Panel position="top-left" style={{ 
            padding: '10px',
            display: 'flex',
            gap: '10px',
            flexDirection: 'column'
          }}>
            {NODE_TYPES.map(type => (
              <button 
                key={type.id}
                onClick={() => addNode(type.id)}
                style={{ 
                  padding: '8px 16px',
                  background: type.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Add {type.label}</span>
              </button>
            ))}
          </Panel>
        </ReactFlow>
      </div>
      
      {selectedEdge && (
        <EdgeEditorPanel
          edge={selectedEdge}
          nodes={nodes}
          onGestureChange={handleGestureChange}
          onDeleteEdge={() => {
            setEdges(eds => {
              const filtered = eds.filter(e => e.id !== selectedEdge.id);
              onWorkflowUpdate?.({ nodes, edges: filtered });
              return filtered;
            });
            setSelectedEdge(null);
          }}
          onClose={() => setSelectedEdge(null)}
        />
      )}

      {selectedNode && (
        <NodeEditorPanel
          node={selectedNode}
          onNodeFormChange={handleNodeFormChange}
          onDeleteNode={() => {
            setNodes(nds => {
              const filtered = nds.filter(n => n.id !== selectedNode.id);
              setEdges(eds => {
                const updatedEdges = eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id);
                onWorkflowUpdate?.({ nodes: filtered, edges: updatedEdges });
                return updatedEdges;
              });
              return filtered;
            });
            setSelectedNode(null);
          }}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

export default WorkflowEditor; 