import { useState, useCallback } from 'react';
import { GestureType, GestureThresholds, CalibrationData } from '../types/gestures';
import { CALIBRATION_GESTURES, SAMPLES_NEEDED } from '../constants/gestures';

interface CalibrationConfig {
  startCalibration: boolean;
  onCalibrationComplete?: (thresholds: GestureThresholds) => void;
  onThresholdsUpdate?: (thresholds: GestureThresholds) => void;
}

export const useGestureCalibration = (config?: CalibrationConfig) => {
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [calibrationData, setCalibrationData] = useState<CalibrationData[]>([]);
  const [thresholds, setThresholds] = useState<GestureThresholds>({});
  const [isPaused, setIsPaused] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(config?.startCalibration ?? false);
  const [samplesCollected, setSamplesCollected] = useState(0);

  const calibrationGesture = CALIBRATION_GESTURES[calibrationStep];
  const gestureThresholds = thresholds;

  const handleCalibrationSample = useCallback((confidence: number) => {
    if (isPaused || !isCalibrating) return;

    setCalibrationData(prev => {
      const existingGestureIndex = prev.findIndex(d => d.gesture === calibrationGesture);
      const updated = [...prev];
      
      if (existingGestureIndex >= 0) {
        updated[existingGestureIndex] = {
          ...updated[existingGestureIndex],
          samples: [...updated[existingGestureIndex].samples, confidence]
        };
      } else {
        updated.push({ gesture: calibrationGesture, samples: [confidence] });
      }

      setSamplesCollected(prev => prev + 1);
      
      if (samplesCollected + 1 >= SAMPLES_NEEDED) {
        nextCalibrationStep();
      }

      return updated;
    });
  }, [calibrationGesture, isPaused, isCalibrating, samplesCollected]);

  const nextCalibrationStep = useCallback(() => {
    setSamplesCollected(0);
    
    if (calibrationStep < CALIBRATION_GESTURES.length - 1) {
      setCalibrationStep(prev => prev + 1);
    } else {
      // Calculate thresholds based on collected samples
      const newThresholds: GestureThresholds = {};
      
      calibrationData.forEach(data => {
        const average = data.samples.reduce((a, b) => a + b, 0) / data.samples.length;
        newThresholds[data.gesture] = average * 0.9; // Set threshold at 90% of average
      });
      
      setThresholds(newThresholds);
      setIsCalibrating(false);
      config?.onCalibrationComplete?.(newThresholds);
      config?.onThresholdsUpdate?.(newThresholds);
    }
  }, [calibrationStep, calibrationData, config]);

  const getCurrentGesture = useCallback((): GestureType => {
    return CALIBRATION_GESTURES[calibrationStep];
  }, [calibrationStep]);

  const getSamplesCount = useCallback((gesture: GestureType): number => {
    const data = calibrationData.find(d => d.gesture === gesture);
    return data?.samples.length || 0;
  }, [calibrationData]);

  const isCalibrationComplete = useCallback((): boolean => {
    return calibrationStep >= CALIBRATION_GESTURES.length;
  }, [calibrationStep]);

  return {
    isCalibrating,
    calibrationStep,
    calibrationGesture,
    gestureThresholds,
    samplesCollected,
    isPaused,
    handleCalibrationSample,
    getCurrentGesture,
    getSamplesCount,
    addCalibrationSample: handleCalibrationSample,
    nextCalibrationStep,
    isCalibrationComplete,
    thresholds
  };
}; 