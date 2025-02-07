import React, { forwardRef } from 'react';
import { SlideNodeData } from '../../types/workflow';

type Props = {
  data: SlideNodeData;
  zoomLevel: number;
  zoomPoint: { x: number; y: number } | null;
};

export const VideoSlide = forwardRef<HTMLVideoElement, Props>(({ data, zoomLevel, zoomPoint }, ref) => {
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
      <video
        ref={ref}
        src={data.videoUrl}
        controls
        autoPlay={data.autoplay}
        loop={data.loop}
        style={{
          width: '100%',
          height: 'auto',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );
}); 