import React from 'react';
import { SlideNodeData } from '../../types/workflow';

type Props = {
  data: SlideNodeData;
  zoomLevel: number;
  zoomPoint: { x: number; y: number } | null;
};

export const TextSlide: React.FC<Props> = ({ data, zoomLevel, zoomPoint }) => {
  return (
    <div style={{ 
      fontSize: '1.2em',
      marginBottom: '20px',
      whiteSpace: 'pre-wrap',
      maxWidth: '800px',
      textAlign: 'left',
      transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
      transformOrigin: zoomPoint 
        ? `${zoomPoint.x}% ${zoomPoint.y}%` 
        : 'center center',
      transition: 'transform 0.1s ease-out'
    }}>
      {data.content}
    </div>
  );
}; 