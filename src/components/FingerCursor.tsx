import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// Helper for linear interpolation (smoothing)
const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;

const FingerCursor: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);
  // The cursor’s screen coordinates; initialized off-screen.
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number }>({ x: -100, y: -100 });

  // Initialize the hand landmarker in IMAGE mode.
  useEffect(() => {
    const initHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          minHandDetectionConfidence: 0.2,
          minTrackingConfidence: 0.2,
        });
        setHandLandmarker(landmarker);
      } catch (error) {
        console.error("Error initializing hand landmarker:", error);
      }
    };

    initHandLandmarker();

    return () => {
      handLandmarker?.close();
    };
  }, []);

  // Process video frames to detect the hand and update the cursor position with smoothing.
  useEffect(() => {
    let animationFrameId: number;
    const detectHand = async () => {
      if (
        webcamRef.current?.video &&
        handLandmarker &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const results = await handLandmarker.detect(video);
        if (results && results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const indexTip = landmarks[8];
          // Map normalized coordinates to screen coordinates (flip x).
          const screenX = (1 - indexTip.x) * window.innerWidth;
          const screenY = indexTip.y * window.innerHeight;
          setCursorPosition(prev => ({
            x: lerp(prev.x, screenX, 0.3),
            y: lerp(prev.y, screenY, 0.3)
          }));
        }
      }
      animationFrameId = requestAnimationFrame(detectHand);
    };

    detectHand();
    return () => cancelAnimationFrame(animationFrameId);
  }, [handLandmarker]);

  return (
    <>
      {/* Hidden webcam used only for processing */}
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={{
          facingMode: "user",
          width: 1280,
          height: 720,
        }}
        style={{ position: "absolute", top: 0, left: 0, width: "0px", height: "0px", opacity: 0 }}
      />
      {/* Render the laser pointer (red dot) with smoothed position */}
      <div
        style={{
          position: "fixed",
          left: cursorPosition.x,
          top: cursorPosition.y,
          width: "20px",
          height: "20px",
          background: "red",
          borderRadius: "50%",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
        }}
      />
    </>
  );
};

export default FingerCursor;
