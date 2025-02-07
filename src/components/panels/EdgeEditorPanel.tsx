import React from 'react';
import { Edge, Node } from 'reactflow';
import { AVAILABLE_GESTURES, SlideNodeData } from '../../types/workflow';

type Props = {
  edge: Edge;
  nodes: Node<SlideNodeData>[];
  onGestureChange: (gesture: string) => void;
  onDeleteEdge: () => void;
  onClose: () => void;
};

export const EdgeEditorPanel: React.FC<Props> = ({
  edge,
  nodes,
  onGestureChange,
  onDeleteEdge,
  onClose
}) => {
  return (
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
        onClick={onClose}
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
          From: {nodes.find(n => n.id === edge.source)?.data.label}
        </div>
        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
          To: {nodes.find(n => n.id === edge.target)?.data.label}
        </div>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '5px' }}>Gesture:</label>
        <select
          value={edge.data?.gesture || ''}
          onChange={(e) => onGestureChange(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">Select a gesture...</option>
          {AVAILABLE_GESTURES.map(gesture => (
            <option key={gesture} value={gesture}>{gesture.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
      <button
        onClick={onDeleteEdge}
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
  );
}; 