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

export const ImageNode: React.FC<NodeProps<SlideNodeData>> = ({ data, selected }) => {
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