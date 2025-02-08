// src/components/WorkflowEditor/NodeTypes.tsx

import React from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { SlideNodeData } from './WorkflowEditor';

const BaseNodeStyle: React.CSSProperties = {
  padding: '15px',
  borderRadius: '8px',
  background: 'white',
  minWidth: '200px',
  border: '2px solid #777'
};

export const TextNode: React.FC<NodeProps<SlideNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ ...BaseNodeStyle, borderColor: selected ? '#ff0072' : '#777' }}>
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

export const ImageNode: React.FC<NodeProps<SlideNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ ...BaseNodeStyle, borderColor: selected ? '#ff0072' : '#4CAF50' }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: '12px', height: '12px', background: '#555' }}
      />
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.label}</div>
      {data.url && (
        <div
          style={{
            width: '100%',
            height: '100px',
            background: '#f0f0f0',
            marginBottom: '8px',
            backgroundImage: `url(${data.url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '4px'
          }}
        />
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

export const VideoNode: React.FC<NodeProps<SlideNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ ...BaseNodeStyle, borderColor: selected ? '#ff0072' : '#9C27B0' }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: '12px', height: '12px', background: '#555' }}
      />
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.label}</div>
      {data.videoUrl && (
        <div
          style={{
            width: '100%',
            height: '100px',
            background: '#f0f0f0',
            marginBottom: '8px',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <video
            src={data.videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '4px 8px',
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              fontSize: '0.8em'
            }}
          >
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

export const APINode: React.FC<NodeProps<SlideNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ ...BaseNodeStyle, borderColor: selected ? '#ff0072' : '#2196F3' }}>
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
