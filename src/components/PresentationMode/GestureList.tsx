// src/components/PresentationMode/GestureList.tsx

import React from 'react';
import { Node, Edge } from 'reactflow';

interface GestureListProps {
  edges: Edge[];
  currentNodeId: string;
  nodes: Node[];
}

const GestureList: React.FC<GestureListProps> = ({ edges, currentNodeId, nodes }) => {
  const outgoingEdges = edges.filter((e) => e.source === currentNodeId);

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(240,240,240,0.9)',
        borderRadius: '8px',
        maxWidth: '400px',
        width: '100%'
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          marginBottom: '10px',
          color: '#666'
        }}
      >
        Available Gestures:
      </div>
      {outgoingEdges.map((edge) => (
        <div
          key={edge.id}
          style={{
            margin: '8px 0',
            padding: '8px',
            background: 'white',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span style={{ color: '#ff0072', fontWeight: 'bold' }}>
            {edge.data?.gesture}
          </span>
          <span style={{ color: '#666' }}>→</span>
          <span>{nodes.find((n) => n.id === edge.target)?.data.label}</span>
        </div>
      ))}
    </div>
  );
};

export default GestureList;
