import React, { useCallback, useState, useEffect, useMemo } from 'react';
import Spline from "@splinetool/react-spline";
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
  NodeProps,
  Handle,
  Position,
  MarkerType,
  EdgeProps,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Node Types
export type SlideNodeData = {
  label: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'api' | 'complexobject';
  url?: string;
  videoUrl?: string;
  autoplay?: boolean;
  loop?: boolean;
  // Video control gestures
  playPauseGesture?: string;
  scrubForwardGesture?: string;
  scrubBackwardGesture?: string;
  scrubAmount?: number; // seconds to scrub forward/backward
  apiEndpoint?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiPayload?: string;
  zoomPoint?: { x: number; y: number };
  zoomInGesture?: string;
  zoomOutGesture?: string;
  // Spline specific properties
  splineScene?: string;
  splineLoaded?: boolean;
  rotationGesture?: {
    left?: string;
    right?: string;
  };
  rotationDegree?: {
    left?: { x: number; y: number };
    right?: { x: number; y: number };
  };
  // Zoom configuration
  minZoom?: number;
  maxZoom?: number;
  // Pointer configuration
  pointerColor?: string;
  pointerSize?: number;
  // Pointer control gestures
  pointerStartGesture?: string;
  pointerStopGesture?: string;
  // New field: choose between laser (red dot) or canvas (writing)
  pointerMode?: "laser" | "canvas";
};

const BaseNodeStyle = {
  padding: '15px',
  borderRadius: '8px',
  background: 'white',
  minWidth: '200px',
  border: '2px solid #777'
};

const TextNode = ({ data, selected }: NodeProps<SlideNodeData>) => {
  return (
    <div style={{ 
      ...BaseNodeStyle,
      borderColor: selected ? '#ff0072' : '#777',
    }}>
      <Handle 
        type="target" 
        position={Position.Left}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.label}</div>
      {data.content && (
        <div style={{ fontSize: '0.9em', color: '#666' }}>
          {data.content.substring(0, 30)}...
        </div>
      )}
      <div style={{ fontSize: '0.8em', color: '#999', marginTop: '5px' }}>
        Text Slide
      </div>
      <Handle 
        type="source" 
        position={Position.Right}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
    </div>
  );
};

const ImageNode = ({ data, selected }: NodeProps<SlideNodeData>) => {
  return (
    <div style={{ 
      ...BaseNodeStyle,
      borderColor: selected ? '#ff0072' : '#4CAF50',
    }}>
      <Handle 
        type="target" 
        position={Position.Left}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.label}</div>
      {data.url && (
        <div style={{ 
          width: '100%', 
          height: '100px', 
          background: '#f0f0f0',
          marginBottom: '8px',
          backgroundImage: `url(${data.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '4px'
        }} />
      )}
      <div style={{ fontSize: '0.8em', color: '#4CAF50', marginTop: '5px' }}>
        Image Slide
      </div>
      <Handle 
        type="source" 
        position={Position.Right}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
    </div>
  );
};

// ComplexObjectNode component
const ComplexObjectNode = ({ data, selected }: NodeProps<SlideNodeData>) => {
  return (
    <div style={{ 
      ...BaseNodeStyle,
      borderColor: selected ? '#ff0072' : '#FF9800',
      minHeight: '250px',
    }}>
      <Handle 
        type="target" 
        position={Position.Left}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.label}</div>
      {data.splineScene && (
        <div style={{ 
          width: '100%', 
          height: '200px',
          background: '#f0f0f0',
          marginBottom: '8px',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}> 
          <Spline 
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            scene={data.splineScene}
            onLoad={() => console.log('Spline scene loaded')}
          />
        </div>
      )}
      <div style={{ fontSize: '0.8em', color: '#FF9800', marginTop: '5px' }}>
        Complex Object
      </div>
      <Handle 
        type="source" 
        position={Position.Right}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
    </div>
  );
};

const VideoNode = ({ data, selected }: NodeProps<SlideNodeData>) => {
  return (
    <div style={{ 
      ...BaseNodeStyle,
      borderColor: selected ? '#ff0072' : '#9C27B0',
    }}>
      <Handle 
        type="target" 
        position={Position.Left}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.label}</div>
      {data.videoUrl && (
        <div style={{ 
          width: '100%', 
          height: '100px',
          background: '#f0f0f0',
          marginBottom: '8px',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <video
            src={data.videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            fontSize: '0.8em'
          }}>
            {data.autoplay ? 'Autoplay' : 'Click to play'} {data.loop ? '• Loop' : ''}
          </div>
        </div>
      )}
      <div style={{ fontSize: '0.8em', color: '#9C27B0', marginTop: '5px' }}>
        Video Slide
      </div>
      <Handle 
        type="source" 
        position={Position.Right}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
    </div>
  );
};

const APINode = ({ data, selected }: NodeProps<SlideNodeData>) => {
  return (
    <div style={{ 
      ...BaseNodeStyle,
      borderColor: selected ? '#ff0072' : '#2196F3',
    }}>
      <Handle 
        type="target" 
        position={Position.Left}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.label}</div>
      {data.apiEndpoint && (
        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '4px' }}>
          {data.apiMethod} {data.apiEndpoint}
        </div>
      )}
      <div style={{ fontSize: '0.8em', color: '#2196F3', marginTop: '5px' }}>
        API Action
      </div>
      <Handle 
        type="source" 
        position={Position.Right}
        style={{ width: '12px', height: '12px', background: '#555' }} 
      />
    </div>
  );
};

// Custom edge component
const GestureEdge = ({
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
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
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

// Define node types outside component
const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  apiNode: APINode,
  complexObjectNode: ComplexObjectNode,
};

// Define edge types outside component
const edgeTypes = {
  gesture: GestureEdge,
};

const AVAILABLE_GESTURES = [
  'Thumb_Up',
  'Thumb_Down',
  'Open_Palm',
  'Closed_Fist',
  'Victory',
  'Pointing_Up',
];


const NODE_TYPES = [
  { id: 'textNode', label: 'Text Slide', color: '#777' },
  { id: 'imageNode', label: 'Image Slide', color: '#4CAF50' },
  { id: 'videoNode', label: 'Video Slide', color: '#9C27B0' },
  { id: 'apiNode', label: 'API Action', color: '#2196F3' },
  { id: 'complexObjectNode', label: 'Complex Object', color: '#FF9800' },
];

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'textNode',
    data: { label: 'Start', content: '', type: 'text' },
    position: { x: 250, y: 25 },
  },
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

// Collapsible section component
const FormSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ marginTop: '15px', borderTop: '1px solid #eee' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px',
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontSize: '1em',
          fontWeight: 'bold',
          color: '#666'
        }}
      >
        {title}
        <span style={{ transform: `rotate(${isOpen ? 180 : 0}deg)`, transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{ padding: '10px' }}>
          {children}
        </div>
      )}
    </div>
  );
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

  // Load initial workflow when it changes
  useEffect(() => {
    if (initialWorkflow) {
      setNodes(initialWorkflow.nodes);
      setEdges(initialWorkflow.edges);
    }
  }, [initialWorkflow, setNodes, setEdges]);

  // Initialize form data when node is selected
  useEffect(() => {
    if (selectedNode) {
      setNodeForm(selectedNode.data);
    } else {
      setNodeForm(null);
    }
  }, [selectedNode]);

  // Update node when form changes
  const handleNodeFormChange = useCallback((updates: Partial<SlideNodeData>) => {
    if (!selectedNode || !nodeForm) return;

    const newFormData = { ...nodeForm, ...updates };
    setNodeForm(newFormData);

    const updatedNode = {
      ...selectedNode,
      data: newFormData
    };

    setNodes(nds => {
      const updated = nds.map(n => n.id === selectedNode.id ? updatedNode : n);
      onWorkflowUpdate?.({ nodes: updated, edges });
      return updated;
    });
  }, [selectedNode, nodeForm, edges, onWorkflowUpdate, setNodes]);

  // Update form when selected edge changes
  useEffect(() => {
    if (selectedEdge) {
      setSelectedGesture(selectedEdge.data?.gesture || '');
    } else {
      setSelectedGesture('');
    }
  }, [selectedEdge]);

  const handleGestureChange = useCallback((gesture: string) => {
    setSelectedGesture(gesture);
    if (selectedEdge) {
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
    }
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
              type === 'complexObjectNode' ? 'complexobject' :
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
        ...(type === 'complexObjectNode' ? { 
          rotationDegree: { 
            left: { x: 0, y: 0 }, 
            right: { x: 0, y: 0 } 
          } 
        } : {}),
        ...(type === 'apiNode' ? { apiEndpoint: '', apiMethod: 'GET', apiPayload: '' } : {}),
        // Default pointer mode is "laser"
        pointerMode: "laser"
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
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Memoize node and edge types
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);
  const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

  // Check valid url for spline scene
  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return true; // Empty is considered valid
    try {
      new URL(url);
      return url.includes('spline.design');
    } catch {
      return false;
    }
  };

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
        <div 
          style={{ 
            width: '300px',
            padding: '20px',
            background: '#f8f8f8',
            borderLeft: '1px solid #ddd',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setSelectedEdge(null)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
          
          <h3>Edit Connection</h3>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '10px' }}>
              From: {nodes.find(n => n.id === selectedEdge.source)?.data.label}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
              To: {nodes.find(n => n.id === selectedEdge.target)?.data.label}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Gesture:</label>
            <select
              value={selectedGesture}
              onChange={(e) => handleGestureChange(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="">Select a gesture...</option>
              {AVAILABLE_GESTURES.map(gesture => (
                <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setEdges(eds => {
                const filtered = eds.filter(e => e.id !== selectedEdge.id);
                onWorkflowUpdate?.({ nodes, edges: filtered });
                return filtered;
              });
              setSelectedEdge(null);
            }}
            style={{
              padding: '8px 16px',
              background: '#ff0072',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              marginTop: '15px'
            }}
          >
            Delete Connection
          </button>
        </div>
      )}

      {selectedNode && nodeForm && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '100%',
            background: 'white',
            boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
            padding: '20px',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
          <h3 style={{ marginTop: 0 }}>Edit Node</h3>
          {/* Basic settings always visible */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Label:</label>
            <input
              type="text"
              value={nodeForm.label}
              onChange={(e) => handleNodeFormChange({ label: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Content section based on node type */}
          {nodeForm.type === 'text' && (
            <FormSection title="Content" defaultOpen={true}>
              <textarea
                value={nodeForm.content || ''}
                onChange={(e) => handleNodeFormChange({ content: e.target.value })}
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
            </FormSection>
          )}

          {nodeForm.type === 'image' && (
            <FormSection title="Image Settings" defaultOpen={true}>
              <input
                type="text"
                value={nodeForm.url || ''}
                onChange={(e) => handleNodeFormChange({ url: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                placeholder="Enter image URL"
              />
              {nodeForm.url && (
                <img 
                  src={nodeForm.url} 
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: 'auto',
                    marginTop: '10px',
                    borderRadius: '4px'
                  }}
                />
              )}
            </FormSection>
          )}
          {nodeForm.type === 'complexobject' && (
            <>
              <FormSection title="Complex Object Settings" defaultOpen={true}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Spline Scene URL:</label>
                  <input
                    type="text"
                    value={nodeForm.splineScene || ''}
                    onChange={(e) => {
                      try {
                        const url = new URL(e.target.value);
                        handleNodeFormChange({ splineScene: e.target.value });
                      } catch (error) {
                        console.error('Invalid URL:', error);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      borderColor: isValidUrl(nodeForm.splineScene) ? '#ddd' : '#ff0072'
                    }}
                    placeholder="https://prod.spline.design/..."
                  />
                  {nodeForm.splineScene && isValidUrl(nodeForm.splineScene) && (
                    <div style={{ 
                      width: '100%',
                      height: '400px',
                      marginTop: '10px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      background: '#f0f0f0'
                    }}>
                      <Spline 
                        scene={nodeForm.splineScene}
                        onLoad={() => handleNodeFormChange({ splineLoaded: true })}
                      />
                    </div>
                  )}
                </div>
              </FormSection>

              <FormSection title="Rotation Controls">
                {/* Left Rotation */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Left Rotation:</label>
                  <select
                    value={nodeForm.rotationGesture?.left || ''}
                    onChange={(e) => handleNodeFormChange({ 
                      rotationGesture: { 
                        ...nodeForm.rotationGesture,
                        left: e.target.value 
                      }
                    })}
                    style={{ 
                      width: '100%', 
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  >
                    <option value="">Select a gesture...</option>
                    {AVAILABLE_GESTURES.map(gesture => (
                      <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="X rotation"
                      value={nodeForm.rotationDegree?.left?.x || ''}
                      onChange={(e) => handleNodeFormChange({ 
                        rotationDegree: { 
                          ...nodeForm.rotationDegree,
                          left: { 
                            x: Math.max(0, Number(e.target.value)),
                            y: nodeForm.rotationDegree?.left?.y || 0 
                          }
                        } 
                      })}
                      style={{
                        width: '50%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Y rotation"
                      value={nodeForm.rotationDegree?.left?.y || ''}
                      onChange={(e) => handleNodeFormChange({ 
                        rotationDegree: { 
                          ...nodeForm.rotationDegree,
                          left: { 
                            x: nodeForm.rotationDegree?.left?.x || 0,
                            y: Math.max(0, Number(e.target.value))
                          }
                        } 
                      })}
                      style={{
                        width: '50%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>

                {/* Right Rotation */}
                <div style={{ marginTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Right Rotation:</label>
                  <select
                    value={nodeForm.rotationGesture?.right || ''}
                    onChange={(e) => handleNodeFormChange({ 
                      rotationGesture: { 
                        ...nodeForm.rotationGesture,
                        right: e.target.value 
                      }
                    })}
                    style={{ 
                      width: '100%', 
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      marginBottom: '10px'
                    }}
                  >
                    <option value="">Select a gesture...</option>
                    {AVAILABLE_GESTURES.map(gesture => (
                      <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="number"
                      min="0"
                      placeholder="X rotation"
                      value={nodeForm.rotationDegree?.right?.x || ''}
                      onChange={(e) => handleNodeFormChange({ 
                        rotationDegree: { 
                          ...nodeForm.rotationDegree,
                          right: { 
                            x: Math.max(0, Number(e.target.value)),
                            y: nodeForm.rotationDegree?.right?.y || 0 
                          }
                        } 
                      })}
                      style={{
                        width: '50%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Y rotation"
                      value={nodeForm.rotationDegree?.right?.y || ''}
                      onChange={(e) => handleNodeFormChange({ 
                        rotationDegree: { 
                          ...nodeForm.rotationDegree,
                          right: { 
                            x: nodeForm.rotationDegree?.right?.x || 0,
                            y: Math.max(0, Number(e.target.value))
                          }
                        } 
                      })}
                      style={{
                        width: '50%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              </FormSection>
            </>
          )}
          {nodeForm.type === 'video' && (
            <>
              <FormSection title="Video Settings" defaultOpen={true}>
                <input
                  type="text"
                  value={nodeForm.videoUrl || ''}
                  onChange={(e) => handleNodeFormChange({ videoUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                  placeholder="Enter video URL"
                />
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={nodeForm.autoplay || false}
                      onChange={(e) => handleNodeFormChange({ autoplay: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    Autoplay
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={nodeForm.loop || false}
                      onChange={(e) => handleNodeFormChange({ loop: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    Loop video
                  </label>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Scrub Amount (seconds):</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Default: 5"
                    value={nodeForm.scrubAmount || ''}
                    onChange={(e) => handleNodeFormChange({ scrubAmount: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </FormSection>

              <FormSection title="Video Control Gestures">
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Play/Pause Gesture:</label>
                  <select
                    value={nodeForm.playPauseGesture || ''}
                    onChange={(e) => handleNodeFormChange({ playPauseGesture: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select a gesture...</option>
                    {AVAILABLE_GESTURES.map(gesture => (
                      <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Scrub Forward Gesture:</label>
                  <select
                    value={nodeForm.scrubForwardGesture || ''}
                    onChange={(e) => handleNodeFormChange({ scrubForwardGesture: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select a gesture...</option>
                    {AVAILABLE_GESTURES.map(gesture => (
                      <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Scrub Backward Gesture:</label>
                  <select
                    value={nodeForm.scrubBackwardGesture || ''}
                    onChange={(e) => handleNodeFormChange({ scrubBackwardGesture: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select a gesture...</option>
                    {AVAILABLE_GESTURES.map(gesture => (
                      <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </FormSection>
            </>
          )}

          {nodeForm.type === 'api' && (
            <FormSection title="API Settings" defaultOpen={true}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>API Endpoint:</label>
                <input
                  type="text"
                  value={nodeForm.apiEndpoint || ''}
                  onChange={(e) => handleNodeFormChange({ apiEndpoint: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Method:</label>
                <select
                  value={nodeForm.apiMethod || 'GET'}
                  onChange={(e) => handleNodeFormChange({ apiMethod: e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE' })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Payload (JSON):</label>
                <textarea
                  value={nodeForm.apiPayload || ''}
                  onChange={(e) => handleNodeFormChange({ apiPayload: e.target.value })}
                  style={{
                    width: '100%',
                    height: '150px',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    resize: 'vertical'
                  }}
                />
              </div>
            </FormSection>
          )}

          <FormSection title="Zoom Settings">
            <label style={{ display: 'block', marginBottom: '5px' }}>Zoom Point:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                placeholder="X %"
                value={nodeForm.zoomPoint?.x || ''}
                onChange={(e) => handleNodeFormChange({ 
                  zoomPoint: { 
                    x: Number(e.target.value), 
                    y: nodeForm.zoomPoint?.y || 50 
                  } 
                })}
                style={{
                  width: '50%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
              <input
                type="number"
                placeholder="Y %"
                value={nodeForm.zoomPoint?.y || ''}
                onChange={(e) => handleNodeFormChange({ 
                  zoomPoint: { 
                    x: nodeForm.zoomPoint?.x || 50, 
                    y: Number(e.target.value) 
                  } 
                })}
                style={{
                  width: '50%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
              Enter values between 0-100 to set the zoom center point
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Min Zoom Level:</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Default: 1"
                value={nodeForm.minZoom || ''}
                onChange={(e) => handleNodeFormChange({ minZoom: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Max Zoom Level:</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Default: 4"
                value={nodeForm.maxZoom || ''}
                onChange={(e) => handleNodeFormChange({ maxZoom: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Zoom In Gesture:</label>
              <select
                value={nodeForm.zoomInGesture || ''}
                onChange={(e) => handleNodeFormChange({ zoomInGesture: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a gesture...</option>
                {AVAILABLE_GESTURES.map(gesture => (
                  <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Zoom Out Gesture:</label>
              <select
                value={nodeForm.zoomOutGesture || ''}
                onChange={(e) => handleNodeFormChange({ zoomOutGesture: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a gesture...</option>
                {AVAILABLE_GESTURES.map(gesture => (
                  <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </FormSection>

          <FormSection title="Pointer Settings">
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Pointer Mode:</label>
              <select
                value={nodeForm.pointerMode || 'laser'}
                onChange={(e) => handleNodeFormChange({ pointerMode: e.target.value as "laser" | "canvas" })}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="laser">Laser (Red Dot)</option>
                <option value="canvas">Canvas (Writing)</option>
              </select>
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Pointer Color:</label>
              <input
                type="color"
                value={nodeForm.pointerColor || '#ff0000'}
                onChange={(e) => handleNodeFormChange({ pointerColor: e.target.value })}
                style={{
                  width: '100%',
                  padding: '2px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Pointer Size:</label>
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                placeholder="Default: 10"
                value={nodeForm.pointerSize || ''}
                onChange={(e) => handleNodeFormChange({ pointerSize: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Pointer Start Gesture:</label>
              <select
                value={nodeForm.pointerStartGesture || ''}
                onChange={(e) => handleNodeFormChange({ pointerStartGesture: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a gesture...</option>
                {AVAILABLE_GESTURES.map(gesture => (
                  <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Pointer Stop Gesture:</label>
              <select
                value={nodeForm.pointerStopGesture || ''}
                onChange={(e) => handleNodeFormChange({ pointerStopGesture: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a gesture...</option>
                {AVAILABLE_GESTURES.map(gesture => (
                  <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </FormSection>

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => {
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
              style={{
                padding: '8px 16px',
                background: '#ff0072',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Delete Node
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowEditor;
