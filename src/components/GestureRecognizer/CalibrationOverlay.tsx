// src/components/GestureRecognizer/CalibrationOverlay.tsx

import React from 'react';
import { CALIBRATION_GESTURES, SAMPLES_NEEDED } from '../../constants/gestures';

interface CalibrationOverlayProps {
  calibrationStep: number;
  samplesCollected: number;
  isPaused: boolean;
  calibrationGesture: string | null;
}

/**
 * Overlay displayed during gesture calibration. 
 */
const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({
  calibrationStep,
  samplesCollected,
  isPaused,
  calibrationGesture
}) => {
  const isLastGesture = calibrationStep === CALIBRATION_GESTURES.length - 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        textAlign: 'center'
      }}
    >
      {isPaused ? (
        <div style={{ fontSize: '1.5em', color: '#4CAF50' }}>
          {isLastGesture ? 'Calibration complete!' : 'Great! Moving to next gesture...'}
        </div>
      ) : (
        <>
          <h2>
            Calibration Step {calibrationStep + 1}/{CALIBRATION_GESTURES.length}
          </h2>
          <div style={{ fontSize: '1.5em', margin: '20px 0' }}>
            Please show the gesture:{' '}
            {CALIBRATION_GESTURES[calibrationStep].replace('_', ' ')}
          </div>
          <div style={{ fontSize: '1.2em', color: '#666' }}>
            Hold the gesture steady...
          </div>
          <div
            style={{
              width: '200px',
              height: '20px',
              background: '#333',
              borderRadius: '10px',
              margin: '20px 0',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${(samplesCollected / SAMPLES_NEEDED) * 100}%`,
                height: '100%',
                background: '#4CAF50',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          {calibrationGesture && (
            <div
              style={{
                marginTop: '10px',
                color:
                  calibrationGesture ===
                  CALIBRATION_GESTURES[calibrationStep]
                    ? '#4CAF50'
                    : '#ff0072'
              }}
            >
              Detected: {calibrationGesture.replace('_', ' ')}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CalibrationOverlay;
