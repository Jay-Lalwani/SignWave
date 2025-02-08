// src/components/WorkflowEditor/WorkflowEditor.tsx

import React, { useCallback, useState, useEffect, useMemo } from 'react';
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
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TextNode, ImageNode, VideoNode, APINode } from './NodeTypes';
import NodeForm from './NodeForm';
import EdgeForm from './EdgeForm';

// Available gestures for edges
export const AVAILABLE_GESTURES = [
  'Thumb_Up',
  'Thumb_Down',
  'Open_Palm',
  'Closed_Fist',
  'Victory',
  'Pointing_Up'
];

export type SlideNodeData = {
  label: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'api';
  url?: string;
  videoUrl?: string;
  autoplay?: boolean;
  loop?: boolean;
  playPauseGesture?: string;
  scrubForwardGesture?: string;
  scrubBackwardGesture?: string;
  apiEndpoint?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiPayload?: string;
  zoomPoint?: { x: number; y: number };
  zoomInGesture?: string;
  zoomOutGesture?: string;
};

// Custom Edge type to store gesture info
const gestureEdgeType = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label
}: any) => {
  // Using the built-in `getBezierPath` might be needed:
  // But we'll keep it as is from your original code or 
  // you can import getBezierPath from `reactflow` if needed.
  // The original code used getBezierPath; keep it if you want
  // the same curve shape.
  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={`M${sourceX},${sourceY} C${sourceX + 100},${sourceY} ${targetX - 100},${targetY} ${targetX},${targetY}`}
        markerEnd={markerEnd}
      />
      {label && (
        <text>
          <textPath
            href={`#${id}`}
            style={{ fontSize: '12px' }}
            startOffset="50%"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {label}
          </textPath>
        </text>
      )}
    </>
  );
};

const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  apiNode: APINode
};

const edgeTypes = {
  gesture: gestureEdgeType
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'textNode',
    data: { label: 'Start', content: '', type: 'text' },
    position: { x: 250, y: 25 }
  }
];

const initialEdges: Edge[] = [];

export type WorkflowData = {
  nodes: Node[];
  edges: Edge[];
};

type Props = {
  onWorkflowUpdate?: (data: WorkflowData) => void;
  initialWorkflow?: WorkflowData;
};

const WorkflowEditor: React.FC<Props> = ({ onWorkflowUpdate, initialWorkflow }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialWorkflow?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialWorkflow?.edges || initialEdges
  );

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedGesture, setSelectedGesture] = useState('');
  const [nodeForm, setNodeForm] = useState<SlideNodeData | null>(null);

  // Load initial workflow from props
  useEffect(() => {
    if (initialWorkflow) {
      setNodes(initialWorkflow.nodes);
      setEdges(initialWorkflow.edges);
    }
  }, [initialWorkflow, setNodes, setEdges]);

  // Initialize form data when node is selected
  useEffect(() => {
    if (selectedNode) {
      setNodeForm(selectedNode.data as SlideNodeData);
    } else {
      setNodeForm(null);
    }
  }, [selectedNode]);

  const handleNodeFormChange = useCallback(
    (updates: Partial<SlideNodeData>) => {
      if (!selectedNode || !nodeForm) return;

      const newFormData = { ...nodeForm, ...updates };
      setNodeForm(newFormData);

      const updatedNode = {
        ...selectedNode,
        data: newFormData
      };

      setNodes((nds) => {
        const updated = nds.map((n) => (n.id === selectedNode.id ? updatedNode : n));
        onWorkflowUpdate?.({ nodes: updated, edges });
        return updated;
      });
    },
    [selectedNode, nodeForm, edges, onWorkflowUpdate, setNodes]
  );

  // Update form when selected edge changes
  useEffect(() => {
    if (selectedEdge) {
      setSelectedGesture(selectedEdge.data?.gesture || '');
    } else {
      setSelectedGesture('');
    }
  }, [selectedEdge]);

  const handleGestureChange = useCallback(
    (gesture: string) => {
      setSelectedGesture(gesture);
      if (selectedEdge) {
        const updatedEdge = {
          ...selectedEdge,
          data: { gesture },
          label: gesture,
          animated: !!gesture,
          style: { strokeWidth: 2, stroke: gesture ? '#ff0072' : '#b1b1b7' }
        };
        setEdges((eds) => {
          const updated = eds.map((e) => (e.id === selectedEdge.id ? updatedEdge : e));
          onWorkflowUpdate?.({ nodes, edges: updated });
          return updated;
        });
      }
    },
    [selectedEdge, nodes, onWorkflowUpdate, setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        // Check if connection already exists
        const connectionExists = eds.some(
          (edge) => edge.source === params.source && edge.target === params.target
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

  const addNode = useCallback(
    (type: string) => {
      const labelMap: Record<string, string> = {
        textNode: 'Text Slide',
        imageNode: 'Image Slide',
        videoNode: 'Video Slide',
        apiNode: 'API Action'
      };
      const newNode: Node<SlideNodeData> = {
        id: `${Date.now()}`,
        type,
        data: {
          label: `New ${labelMap[type] || 'Slide'}`,
          content: '',
          type: type === 'apiNode' ? 'api' : type === 'imageNode' ? 'image' : type === 'videoNode' ? 'video' : 'text',
          ...(type === 'videoNode'
            ? {
                videoUrl: '',
                autoplay: false,
                loop: false,
                playPauseGesture: '',
                scrubForwardGesture: '',
                scrubBackwardGesture: ''
              }
            : {}),
          ...(type === 'imageNode' ? { url: '' } : {}),
          ...(type === 'apiNode'
            ? { apiEndpoint: '', apiMethod: 'GET', apiPayload: '' }
            : {})
        },
        position: {
          x: Math.random() * 300 + 100,
          y: Math.random() * 300 + 100
        }
      };

      setNodes((nds) => {
        const updated = [...nds, newNode];
        onWorkflowUpdate?.({ nodes: updated, edges });
        return updated;
      });
    },
    [edges, onWorkflowUpdate, setNodes]
  );

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      setSelectedNode(node);
      setSelectedEdge(null);
    },
    []
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      setSelectedEdge(edge);
      setSelectedNode(null);
    },
    []
  );

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'flex' }}
      onClick={() => {
        setSelectedNode(null);
        setSelectedEdge(null);
      }}
    >
      <div style={{ flex: 1, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={memoizedNodeTypes}
          edgeTypes={memoizedEdgeTypes}
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
          <Panel
            position="top-left"
            style={{
              padding: '10px',
              display: 'flex',
              gap: '10px',
              flexDirection: 'column'
            }}
          >
            <button
              onClick={() => addNode('textNode')}
              style={{
                padding: '8px 16px',
                background: '#777',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Text Slide
            </button>
            <button
              onClick={() => addNode('imageNode')}
              style={{
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Image Slide
            </button>
            <button
              onClick={() => addNode('videoNode')}
              style={{
                padding: '8px 16px',
                background: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Video Slide
            </button>
            <button
              onClick={() => addNode('apiNode')}
              style={{
                padding: '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add API Action
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Edge form */}
      {selectedEdge && (
        <EdgeForm
          edge={selectedEdge}
          nodes={nodes}
          selectedGesture={selectedGesture}
          onGestureChange={handleGestureChange}
          onDelete={() => {
            setEdges((eds) => {
              const filtered = eds.filter((e) => e.id !== selectedEdge.id);
              onWorkflowUpdate?.({ nodes, edges: filtered });
              return filtered;
            });
            setSelectedEdge(null);
          }}
          onClose={() => setSelectedEdge(null)}
        />
      )}

      {/* Node form */}
      {selectedNode && nodeForm && (
        <NodeForm
          node={selectedNode}
          nodeForm={nodeForm}
          onNodeFormChange={handleNodeFormChange}
          onClose={() => setSelectedNode(null)}
          onDelete={() => {
            setNodes((nds) => {
              const filteredNodes = nds.filter((n) => n.id !== selectedNode.id);
              setEdges((eds) => {
                const updatedEdges = eds.filter(
                  (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
                );
                onWorkflowUpdate?.({ nodes: filteredNodes, edges: updatedEdges });
                return updatedEdges;
              });
              return filteredNodes;
            });
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkflowEditor;
