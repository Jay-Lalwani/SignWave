import React, { useState, useEffect } from 'react';
import CADEditor from './CADEditor';
import './CADEditor.css';

interface CADControllerProps {
  isActive: boolean;
  gestureData?: {
    handPosition: { x: number; y: number; z: number };
    isGrabbing: boolean;
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
    console.log('CADController state:', { isActive, isCADMode, hasGestureData: !!gestureData });
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
        <div className="cad-mode-indicator">
          CAD Mode Active
        </div>
        {gestureData && (
          <div className="gesture-status">
            Hand Position: ({gestureData.handPosition.x.toFixed(2)},
            {gestureData.handPosition.y.toFixed(2)},
            {gestureData.handPosition.z.toFixed(2)})
            {gestureData.isGrabbing && <span className="grabbing-indicator">Grabbing</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default CADController; 