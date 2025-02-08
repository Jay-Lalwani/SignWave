// src/components/GestureRecognizer/GestureRecognizer.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { GestureResult, GestureThresholds, GestureType } from '../../types/gestures';
import { useGestureRecognition } from '../../hooks/useGestureRecognition';
import { useGestureCalibration } from '../../hooks/useGestureCalibration';
import CalibrationOverlay from './CalibrationOverlay';
import { DEFAULT_GESTURE_THRESHOLD } from '../../constants/gestures';

export type GestureRecognizerProps = {
  onGestureDetected?: (result: GestureResult) => void;
  className?: string;
  showWebcam?: boolean;
  onCalibrationComplete?: () => void;
  startCalibration?: boolean;
  onThresholdsUpdate?: (thresholds: GestureThresholds) => void;
};

const GestureRecognizerComponent: React.FC<GestureRecognizerProps> = ({
  onGestureDetected,
  className,
  showWebcam = true,
  onCalibrationComplete,
  startCalibration = true,
  onThresholdsUpdate
}) => {
  const webcamRef = useRef<Webcam>(null);
  const {
    isLoading,
    gestureRecognizerRef
  } = useGestureRecognition();

  // Calibration state
  const {
    isCalibrating,
    calibrationStep,
    calibrationGesture,
    gestureThresholds,
    samplesCollected,
    isPaused,
    handleCalibrationSample
  } = useGestureCalibration({
    startCalibration,
    onCalibrationComplete,
    onThresholdsUpdate
  });

  // Main gesture detection loop
  useEffect(() => {
    let animationFrameId: number;
    let lastVideoTime = -1;

    const detectGestures = async () => {
      if (
        webcamRef.current?.video &&
        gestureRecognizerRef &&
        !isLoading &&
        !isPaused
      ) {
        const video = webcamRef.current.video;

        if (video.readyState === 4 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          try {
            const recognizer = gestureRecognizerRef.current;
            if (!recognizer) return;

            const result = recognizer.recognizeForVideo(
              video,
              performance.now()
            );

            if (result.gestures && result.gestures.length > 0) {
              const topGesture = result.gestures[0];

              // Calibration mode
              if (isCalibrating) {
                handleCalibrationSample(topGesture.score);
              }
              // Normal detection mode
              else if (topGesture.categoryName !== 'None') {
                onGestureDetected?.({
                  gesture: topGesture.categoryName as GestureType,
                  confidence: topGesture.score,
                  timestamp: Date.now()
                });
              }
            }
          } catch (error) {
            console.error('Error during gesture recognition:', error);
          }
        }
      }

      animationFrameId = requestAnimationFrame(detectGestures);
    };

    detectGestures();

    return () => {
      animationFrameId && cancelAnimationFrame(animationFrameId);
    };
  }, [
    isLoading,
    isPaused,
    isCalibrating,
    calibrationStep,
    handleCalibrationSample,
    gestureThresholds,
    onGestureDetected,
    gestureRecognizerRef
  ]);

  if (!showWebcam && !isCalibrating) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: isCalibrating ? '100vw' : '100%',
        height: isCalibrating ? '100vh' : '100%'
      }}
    >
      {isLoading ? (
        <div>Loading gesture recognizer...</div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Webcam
            ref={webcamRef}
            mirrored
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            videoConstraints={{
              facingMode: 'user',
              width: 1280,
              height: 720
            }}
          />
          {isCalibrating && (
            <CalibrationOverlay
              calibrationStep={calibrationStep}
              samplesCollected={samplesCollected}
              isPaused={isPaused}
              calibrationGesture={calibrationGesture}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default GestureRecognizerComponent;
