// src/components/WorkflowEditor/EdgeForm.tsx

import React from 'react';
import { Node, Edge, MarkerType } from 'reactflow';
import { AVAILABLE_GESTURES } from './WorkflowEditor';

interface EdgeFormProps {
  edge: Edge;
  nodes: Node[];
  selectedGesture: string;
  onGestureChange: (gesture: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

const EdgeForm: React.FC<EdgeFormProps> = ({
  edge,
  nodes,
  selectedGesture,
  onGestureChange,
  onDelete,
  onClose
}) => {
  const sourceLabel = nodes.find((n) => n.id === edge.source)?.data.label;
  const targetLabel = nodes.find((n) => n.id === edge.target)?.data.label;

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
          From: {sourceLabel}
        </div>
        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
          To: {targetLabel}
        </div>
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '5px' }}>Gesture:</label>
        <select
          value={selectedGesture}
          onChange={(e) => onGestureChange(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="">Select a gesture...</option>
          {AVAILABLE_GESTURES.map((gesture) => (
            <option key={gesture} value={gesture}>
              {gesture.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={onDelete}
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

export default EdgeForm;
