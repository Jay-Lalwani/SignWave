import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_SPEED = 0.05;

export const useZoom = () => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPoint, setZoomPoint] = useState<{ x: number; y: number } | null>(null);
  const zoomAnimationRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
    };
  }, []);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current);
    }

    const animate = () => {
      setZoomLevel(current => {
        const newZoom = direction === 'in' 
          ? Math.min(current + ZOOM_SPEED, MAX_ZOOM)
          : Math.max(current - ZOOM_SPEED, MIN_ZOOM);
        
        if ((direction === 'in' && newZoom < MAX_ZOOM) || 
            (direction === 'out' && newZoom > MIN_ZOOM)) {
          zoomAnimationRef.current = requestAnimationFrame(animate);
        }
        
        return newZoom;
      });
    };

    zoomAnimationRef.current = requestAnimationFrame(animate);
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setZoomPoint(null);
  }, []);

  return {
    zoomLevel,
    zoomPoint,
    setZoomPoint,
    handleZoom,
    resetZoom
  };
}; 