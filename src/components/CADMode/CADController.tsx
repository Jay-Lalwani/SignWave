import React, { useState, useEffect } from 'react';
import CADEditor from './CADEditor';

interface CADControllerProps {
  isActive: boolean;
  gestureData?: any;
  onModeChange?: (isCADMode: boolean) => void;
}

const CADController: React.FC<CADControllerProps> = ({
  isActive,
  gestureData,
  onModeChange
}) => {
  const [isCADMode, setIsCADMode] = useState(false);

  // Handle keyboard shortcuts for mode switching
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'c' && event.ctrlKey) {
        setIsCADMode(prev => !prev);
        onModeChange?.(!isCADMode);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCADMode, onModeChange]);

  if (!isActive) return null;

  return (
    <div className="cad-controller">
      <CADEditor
        isActive={isCADMode}
        gestureData={gestureData}
      />
      {isCADMode && (
        <div className="cad-mode-indicator">
          CAD Mode Active (Ctrl+C to toggle)
        </div>
      )}
    </div>
  );
};

export default CADController; 