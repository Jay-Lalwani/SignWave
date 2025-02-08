// src/components/PresentationMode/SettingsModal.tsx

import React from 'react';
import { GestureThresholds } from '../../types/gestures';

interface SettingsModalProps {
  showGestures: boolean;
  onShowGesturesChange: (value: boolean) => void;
  showWebcam: boolean;
  onShowWebcamChange: (value: boolean) => void;
  thresholds: GestureThresholds;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  showGestures,
  onShowGesturesChange,
  showWebcam,
  onShowWebcamChange,
  thresholds,
  onClose
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 100,
        minWidth: '300px'
      }}
    >
      <h3 style={{ marginTop: 0 }}>Settings</h3>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showGestures}
            onChange={(e) => onShowGesturesChange(e.target.checked)}
            style={{ marginRight: '10px' }}
          />
          Show Available Gestures
        </label>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showWebcam}
            onChange={(e) => onShowWebcamChange(e.target.checked)}
            style={{ marginRight: '10px' }}
          />
          Show Webcam Preview
        </label>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
          Gesture Thresholds:
        </div>
        <div
          style={{
            maxHeight: '150px',
            overflowY: 'auto',
            background: '#f5f5f5',
            borderRadius: '4px',
            padding: '10px'
          }}
        >
          {Object.entries(thresholds).map(([gesture, threshold]) => (
            <div
              key={gesture}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px 0'
              }}
            >
              <span>{gesture.replace('_', ' ')}</span>
              <span
                style={{
                  color: '#666',
                  background: '#fff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.9em'
                }}
              >
                {(threshold * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          padding: '8px 16px',
          background: '#ff0072',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Close
      </button>
    </div>
  );
};

export default SettingsModal;
