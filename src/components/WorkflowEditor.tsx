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
  type: 'text' | 'image' | 'video' | 'api';
  url?: string;
  videoUrl?: string;
  autoplay?: boolean;
  loop?: boolean;
  // Video control gestures
  playPauseGesture?: string;
  scrubForwardGesture?: string;
  scrubBackwardGesture?: string;
  apiEndpoint?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiPayload?: string;
  zoomPoint?: { x: number; y: number };
  zoomInGesture?: string;
  zoomOutGesture?: string;
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
  'Pointing_Up'
];

const NODE_TYPES = [
  { id: 'textNode', label: 'Text Slide', color: '#777' },
  { id: 'imageNode', label: 'Image Slide', color: '#4CAF50' },
  { id: 'videoNode', label: 'Video Slide', color: '#9C27B0' },
  { id: 'apiNode', label: 'API Action', color: '#2196F3' },
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

          {nodeForm.type === 'text' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Content:</label>
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
            </div>
          )}

          {nodeForm.type === 'image' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Image URL:</label>
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
            </div>
          )}

          {nodeForm.type === 'video' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Video URL:</label>
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
              />
              {nodeForm.videoUrl && (
                <video 
                  src={nodeForm.videoUrl}
                  controls
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    borderRadius: '4px'
                  }}
                />
              )}
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

              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>Video Control Gestures</h4>
                
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
              </div>
            </div>
          )}

          {nodeForm.type === 'api' && (
            <>
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
            </>
          )}

          <div style={{ marginBottom: '15px' }}>
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

            {/* New fields for pointer control gestures */}
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
            {/* New field for pointer mode */}
            <div style={{ marginTop: '15px' }}>
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
