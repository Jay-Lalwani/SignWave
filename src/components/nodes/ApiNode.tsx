import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { SlideNodeData } from '../../types/workflow';

const BaseNodeStyle = {
  padding: '15px',
  borderRadius: '8px',
  background: 'white',
  minWidth: '200px',
  border: '2px solid #777'
};

export const ApiNode: React.FC<NodeProps<SlideNodeData>> = ({ data, selected }) => {
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