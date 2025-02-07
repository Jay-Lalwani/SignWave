import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

export type GestureResult = {
  gesture: string;
  confidence: number;
  timestamp: number;
};

type Props = {
  onGestureDetected?: (result: GestureResult) => void;
  className?: string;
  showWebcam?: boolean;
  onCalibrationComplete?: () => void;
  startCalibration?: boolean;
  onThresholdsUpdate?: (thresholds: GestureThresholds) => void;
};

// All available gestures that need calibration
const CALIBRATION_GESTURES = [
  'Thumb_Up',
  'Thumb_Down',
  'Open_Palm',
  'Closed_Fist',
  'Victory',
  'Pointing_Up'
];

type GestureThresholds = {
  [key: string]: number;
};

const SAMPLES_NEEDED = 30;
const PAUSE_DURATION = 1000; // 1 second pause between gestures

const GestureRecognizerComponent: React.FC<Props> = ({ 
  onGestureDetected, 
  className, 
  showWebcam = true,
  onCalibrationComplete,
  startCalibration = true,
  onThresholdsUpdate
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(startCalibration);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [calibrationGesture, setCalibrationGesture] = useState<string | null>(null);
  const [gestureThresholds, setGestureThresholds] = useState<GestureThresholds>({});
  const [samplesCollected, setSamplesCollected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const confidenceSum = useRef(0);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);

  // Reset calibration
  useEffect(() => {
    if (startCalibration) {
      setIsCalibrating(true);
      setCalibrationStep(0);
      setSamplesCollected(0);
      setCalibrationGesture(null);
      setIsPaused(false);
      confidenceSum.current = 0;
    }
  }, [startCalibration]);

  // Initialize MediaPipe
  useEffect(() => {
    const initGestureRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        
        gestureRecognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.3,
          minHandPresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize gesture recognizer:', error);
        setIsLoading(false);
      }
    };

    initGestureRecognizer();

    return () => {
      if (gestureRecognizerRef.current) {
        gestureRecognizerRef.current.close();
      }
    };
  }, []);

  // Main gesture detection loop
  useEffect(() => {
    let animationFrameId: number;
    let lastVideoTime = -1;
    
    const detectGestures = async () => {
      if (
        webcamRef.current?.video &&
        gestureRecognizerRef.current &&
        !isLoading &&
        !isPaused
      ) {
        const video = webcamRef.current.video;
        
        if (video.readyState === 4 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          try {
            const gestureRecognitionResult = gestureRecognizerRef.current.recognizeForVideo(video, performance.now());
            
            if (gestureRecognitionResult.gestures?.length && gestureRecognitionResult.gestures[0]?.length) {
              const topGesture = gestureRecognitionResult.gestures[0][0];

              if (isCalibrating && calibrationStep < CALIBRATION_GESTURES.length) {
                const expectedGesture = CALIBRATION_GESTURES[calibrationStep];
                
                if (topGesture.categoryName === expectedGesture) {
                  confidenceSum.current += topGesture.score;
                  setCalibrationGesture(expectedGesture);
                  setSamplesCollected(prev => {
                    const newCount = prev + 1;
                    if (newCount === SAMPLES_NEEDED) {
                      const avgConfidence = confidenceSum.current / SAMPLES_NEEDED;
                      setGestureThresholds(prev => {
                        const updated = {
                          ...prev,
                          [expectedGesture]: Math.min(avgConfidence * 0.6, 0.6)
                        };
                        onThresholdsUpdate?.(updated);
                        return updated;
                      });
                      
                      setTimeout(() => {
                        setIsPaused(true);
                        setTimeout(() => {
                          if (calibrationStep < CALIBRATION_GESTURES.length - 1) {
                            confidenceSum.current = 0;
                            setSamplesCollected(0);
                            setCalibrationGesture(null);
                            setCalibrationStep(calibrationStep + 1);
                            setIsPaused(false);
                          } else {
                            setIsCalibrating(false);
                            onCalibrationComplete?.();
                          }
                        }, PAUSE_DURATION);
                      }, 500);
                    }
                    return newCount;
                  });
                }
              } else if (!isCalibrating && topGesture.categoryName !== "None") {
                const threshold = gestureThresholds[topGesture.categoryName] || 0.7;
                if (topGesture.score >= threshold) {
                  onGestureDetected?.({
                    gesture: topGesture.categoryName,
                    confidence: topGesture.score,
                    timestamp: Date.now()
                  });
                }
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
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isLoading, onGestureDetected, isCalibrating, calibrationStep, onCalibrationComplete, isPaused]);

  if (!showWebcam && !isCalibrating) {
    return null;
  }

  const isLastGesture = calibrationStep === CALIBRATION_GESTURES.length - 1;

  return (
    <div className={className} style={{ 
      position: 'relative',
      width: isCalibrating ? '100vw' : '100%',
      height: isCalibrating ? '100vh' : '100%',
    }}>
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
              facingMode: "user",
              width: 1280,
              height: 720
            }}
          />
          {isCalibrating && (
            <div style={{
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
            }}>
              {isPaused ? (
                <div style={{ fontSize: '1.5em', color: '#4CAF50' }}>
                  {isLastGesture ? 'Calibration complete!' : 'Great! Moving to next gesture...'}
                </div>
              ) : (
                <>
                  <h2>Calibration Step {calibrationStep + 1}/{CALIBRATION_GESTURES.length}</h2>
                  <div style={{ fontSize: '1.5em', margin: '20px 0' }}>
                    Please show the gesture: {CALIBRATION_GESTURES[calibrationStep].replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '1.2em', color: '#666' }}>
                    Hold the gesture steady...
                  </div>
                  <div style={{ 
                    width: '200px', 
                    height: '20px', 
                    background: '#333',
                    borderRadius: '10px',
                    margin: '20px 0',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(samplesCollected / SAMPLES_NEEDED) * 100}%`,
                      height: '100%',
                      background: '#4CAF50',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  {calibrationGesture && (
                    <div style={{ 
                      marginTop: '10px',
                      color: calibrationGesture === CALIBRATION_GESTURES[calibrationStep] ? '#4CAF50' : '#ff0072'
                    }}>
                      Detected: {calibrationGesture.replace('_', ' ')}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GestureRecognizerComponent; 