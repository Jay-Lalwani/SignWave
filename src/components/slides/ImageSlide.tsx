import React from 'react';
import { SlideNodeData } from '../../types/workflow';

type Props = {
  data: SlideNodeData;
  zoomLevel: number;
  zoomPoint: { x: number; y: number } | null;
};

export const ImageSlide: React.FC<Props> = ({ data, zoomLevel, zoomPoint }) => {
  return (
    <div style={{
      maxWidth: '800px',
      width: '100%',
      marginBottom: '20px',
      transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
      transformOrigin: zoomPoint 
        ? `${zoomPoint.x}% ${zoomPoint.y}%` 
        : 'center center',
      transition: 'transform 0.1s ease-out'
    }}>
      <img 
        src={data.url} 
        alt={data.label}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );
}; 