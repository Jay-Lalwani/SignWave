import { useRef, useEffect, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { GestureResult } from '../types/workflow';

export const useGestureRecognizer = (onGestureDetected?: (result: GestureResult) => void) => {
  const [isLoading, setIsLoading] = useState(true);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);

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

  return {
    isLoading,
    gestureRecognizer: gestureRecognizerRef.current
  };
}; 