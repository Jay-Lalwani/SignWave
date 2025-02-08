import React, { useState, useEffect } from 'react';
import CADEditor from './CADEditor';
import './CADEditor.css';

interface CADControllerProps {
  isActive: boolean;
  gestureData?: {
    handPosition: { x: number; y: number; z: number };
    isGrabbing: boolean;
    gesture: string;
  };
  onModeChange?: (isCADMode: boolean) => void;
}

const CADController: React.FC<CADControllerProps> = ({
  isActive,
  gestureData,
  onModeChange
}) => {
  // Always start in CAD mode when the component is mounted
  const [isCADMode, setIsCADMode] = useState(true);

  // Debug log for props and state changes
  useEffect(() => {
    console.log('CADController state:', {
      isActive,
      isCADMode,
      hasGestureData: !!gestureData,
      currentGesture: gestureData?.gesture
    });
  }, [isActive, isCADMode, gestureData]);

  // Handle keyboard shortcuts for mode switching
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'c' && event.ctrlKey) {
        const newMode = !isCADMode;
        console.log('Toggling CAD mode:', newMode);
        setIsCADMode(newMode);
        onModeChange?.(newMode);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCADMode, onModeChange]);

  if (!isActive) {
    console.log('CADController not active, returning null');
    return null;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <CADEditor
        isActive={isActive}
        gestureData={gestureData}
      />
      <div className="cad-mode-controls">
        {gestureData && (
          <div className="gesture-status">
            <div className="current-gesture">
              Current Gesture: {gestureData.gesture || 'None'}
            </div>
            <div className="hand-position">
              Hand Position: (
              {gestureData.handPosition.x.toFixed(2)},
              {gestureData.handPosition.y.toFixed(2)},
              {gestureData.handPosition.z.toFixed(2)}
              )
            </div>
            {gestureData.isGrabbing && (
              <div className="grabbing-indicator">Grabbing</div>
            )}
          </div>
        )}
        <div className="debug-info">
          <div>CAD Mode Status:</div>
          <div>Active: {isActive ? 'Yes' : 'No'}</div>
          <div>Has Gesture Data: {gestureData ? 'Yes' : 'No'}</div>
          <div>Last Gesture: {gestureData?.gesture || 'None'}</div>
          <div>Grabbing: {gestureData?.isGrabbing ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
};

export default CADController; 