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

export const VideoNode: React.FC<NodeProps<SlideNodeData>> = ({ data, selected }) => {
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