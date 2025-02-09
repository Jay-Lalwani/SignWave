import React, { useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// Helper function for linear interpolation (smoothing)
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

type Props = {
  color?: string;
  size?: number;
};

const CanvasPointer: React.FC<Props> = ({ color = '#ff0000', size = 10 }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handLandmarker, setHandLandmarker] = React.useState<HandLandmarker | null>(null);
  // We'll store the last smoothed pointer position here.
  const smoothedPosRef = useRef<{ x: number; y: number } | null>(null);
  // Adjust the smoothing factor (0 to 1). Lower values produce smoother (but slower) movement.
  const smoothingFactor = 0.2;

  // Initialize the hand landmarker in IMAGE mode.
  useEffect(() => {
    const initLandmarker = async () => {
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

    initLandmarker();

    return () => {
      handLandmarker?.close();
    };
  }, []);

  // Update the canvas size when the window is resized.
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Draw loop: detect the hand and smoothly draw strokes on the canvas.
  useEffect(() => {
    let animationFrameId: number;
    const drawLoop = async () => {
      if (
        webcamRef.current?.video &&
        handLandmarker &&
        webcamRef.current.video.readyState === 4 &&
        canvasRef.current
      ) {
        const video = webcamRef.current.video;
        const results = await handLandmarker.detect(video);
        const ctx = canvasRef.current.getContext('2d');
        if (results && results.landmarks && results.landmarks.length > 0 && ctx) {
          const landmarks = results.landmarks[0];
          const indexTip = landmarks[8];
          // Compute raw screen coordinates; flip x because the webcam is mirrored.
          const x = (1 - indexTip.x) * window.innerWidth;
          const y = indexTip.y * window.innerHeight;
          if (!smoothedPosRef.current) {
            // If this is the first detection, initialize smoothed position and draw a starting dot.
            smoothedPosRef.current = { x, y };
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          } else {
            // Smoothly interpolate between the previous smoothed position and the new raw position.
            const prev = smoothedPosRef.current;
            const smoothedX = lerp(prev.x, x, smoothingFactor);
            const smoothedY = lerp(prev.y, y, smoothingFactor);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(smoothedX, smoothedY);
            ctx.stroke();
            smoothedPosRef.current = { x: smoothedX, y: smoothedY };
          }
        } else {
          // No hand detected: reset the smoothed position so that new strokes start fresh.
          smoothedPosRef.current = null;
        }
      }
      animationFrameId = requestAnimationFrame(drawLoop);
    };

    drawLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [handLandmarker, color, size]);

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
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "0px",
          height: "0px",
          opacity: 0,
        }}
      />
      {/* Fullscreen canvas for drawing */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      />
    </>
  );
};

export default CanvasPointer;
