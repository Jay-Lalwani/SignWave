// src/components/PresentationMode/PresentationMode.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import GestureRecognizer from '../GestureRecognizer';
import { GestureResult, GestureThresholds } from '../../types/gestures';
import SettingsModal from './SettingsModal';
import GestureList from './GestureList';

const THRESHOLDS_STORAGE_KEY = 'gesture_calibration_thresholds';
const SCRUB_AMOUNT = 5; // seconds
const PLAY_PAUSE_DELAY = 1000;

type Props = {
  workflow: {
    nodes: Node[];
    edges: Edge[];
  };
};

const PresentationMode: React.FC<Props> = ({ workflow }) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>('1');
  const [showSettings, setShowSettings] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [showGestures, setShowGestures] = useState(true);
  const [showWebcam, setShowWebcam] = useState(true);

  // Zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPoint, setZoomPoint] = useState<{ x: number; y: number } | null>(null);
  const zoomAnimationRef = useRef<number>();
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const ZOOM_SPEED = 0.05;

  // Thresholds
  const [thresholds, setThresholds] = useState<GestureThresholds>(() => {
    try {
      const saved = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasAllGestures = [
          'Thumb_Up',
          'Thumb_Down',
          'Open_Palm',
          'Closed_Fist',
          'Victory',
          'Pointing_Up'
        ].every((g) => typeof parsed[g] === 'number');
        if (hasAllGestures) {
          // If we have all gestures, skip calibration
          setIsCalibrating(false);
          return parsed;
        }
      }
      return {};
    } catch {
      return {};
    }
  });

  // API
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastPlayPauseTime = useRef<number>(0);

  const currentNode = workflow.nodes.find((n) => n.id === currentNodeId);

  // Clean up zoom animation
  useEffect(() => {
    return () => {
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
    };
  }, []);

  const handleZoom = useCallback(
    (direction: 'in' | 'out') => {
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
      const animate = () => {
        setZoomLevel((current) => {
          const newZoom =
            direction === 'in'
              ? Math.min(current + ZOOM_SPEED, MAX_ZOOM)
              : Math.max(current - ZOOM_SPEED, MIN_ZOOM);

          if (
            (direction === 'in' && newZoom < MAX_ZOOM) ||
            (direction === 'out' && newZoom > MIN_ZOOM)
          ) {
            zoomAnimationRef.current = requestAnimationFrame(animate);
          }
          return newZoom;
        });
      };
      zoomAnimationRef.current = requestAnimationFrame(animate);
    },
    [MAX_ZOOM, MIN_ZOOM, ZOOM_SPEED]
  );

  const handleGesture = useCallback(
    (result: GestureResult) => {
      // Find edges that start from current node
      const possibleTransitions = workflow.edges.filter(
        (e) => e.source === currentNodeId && e.data?.gesture === result.gesture
      );

      // Handle video control gestures
      if (currentNode?.data?.type === 'video' && videoRef.current) {
        if (result.gesture === currentNode.data.playPauseGesture) {
          const now = Date.now();
          if (now - lastPlayPauseTime.current >= PLAY_PAUSE_DELAY) {
            if (videoRef.current.paused) {
              videoRef.current.play();
            } else {
              videoRef.current.pause();
            }
            lastPlayPauseTime.current = now;
          }
          return;
        } else if (result.gesture === currentNode.data.scrubForwardGesture) {
          videoRef.current.currentTime = Math.min(
            videoRef.current.currentTime + SCRUB_AMOUNT,
            videoRef.current.duration
          );
          return;
        } else if (result.gesture === currentNode.data.scrubBackwardGesture) {
          videoRef.current.currentTime = Math.max(
            videoRef.current.currentTime - SCRUB_AMOUNT,
            0
          );
          return;
        }
      }

      // Handle zoom gestures
      if (currentNode?.data.zoomPoint) {
        if (result.gesture === currentNode.data.zoomInGesture) {
          setZoomPoint(currentNode.data.zoomPoint);
          handleZoom('in');
          return;
        } else if (result.gesture === currentNode.data.zoomOutGesture) {
          setZoomPoint(currentNode.data.zoomPoint);
          handleZoom('out');
          return;
        }
      }

      // Handle transitions
      if (possibleTransitions.length > 0) {
        setZoomLevel(1);
        setZoomPoint(null);
        setCurrentNodeId(possibleTransitions[0].target);
      }
    },
    [currentNodeId, workflow.edges, currentNode, handleZoom]
  );

  const handleCalibrationComplete = useCallback(() => {
    setIsCalibrating(false);
  }, []);

  const handleThresholdsUpdate = useCallback((newThresholds: GestureThresholds) => {
    setThresholds(newThresholds);
    try {
      localStorage.setItem(THRESHOLDS_STORAGE_KEY, JSON.stringify(newThresholds));
    } catch (e) {
      console.error('Failed to save thresholds:', e);
    }
  }, []);

  // Execute API calls automatically if node is "API"
  useEffect(() => {
    const executeApiCall = async () => {
      if (currentNode?.data?.type === 'api') {
        try {
          setApiError(null);
          setApiResponse(null);

          // Note: For production use, CORS should be handled by:
          // 1. Configuring CORS headers on your API server
          // 2. Using a controlled proxy server in your infrastructure
          // 3. Or using environment-specific API endpoints
          const apiUrl = currentNode.data.apiEndpoint!;

          const response = await fetch(apiUrl, {
            method: currentNode.data.apiMethod || 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Only include necessary headers - avoid security risks
              ...(currentNode.data.apiHeaders || {})
            },
            // Include credentials only if needed and the API supports it
            credentials: currentNode.data.withCredentials ? 'include' : 'same-origin',
            body: currentNode.data.apiPayload
              ? JSON.stringify(JSON.parse(currentNode.data.apiPayload))
              : undefined
          });

          if (!response.ok) {
            if (response.status === 403) {
              throw new Error('Access forbidden. Please check API permissions and CORS configuration.');
            } else if (response.status === 401) {
              throw new Error('Unauthorized. Authentication may be required.');
            } else {
              throw new Error(`API call failed: ${response.statusText}`);
            }
          }

          const data = await response.json();
          setApiResponse(data);
        } catch (error) {
          let errorMessage = error instanceof Error ? error.message : 'Failed to execute API call';

          // Provide more helpful error messages for common CORS issues
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            errorMessage = 'Unable to connect to API. This may be due to CORS restrictions. Please ensure the API allows requests from this origin.';
          }

          setApiError(errorMessage);
          console.error('API call error:', error);
        }
      }
    };

    executeApiCall();
  }, [currentNode]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!isCalibrating && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '150px',
            zIndex: 10,
            background: '#f8f8f8',
            borderRadius: '0 0 0 8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <GestureRecognizer
            onGestureDetected={handleGesture}
            showWebcam={showWebcam}
            startCalibration={false}
            onThresholdsUpdate={handleThresholdsUpdate}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -40,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <button
              onClick={() => setIsCalibrating(true)}
              style={{
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Recalibrate
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '8px 16px',
                background: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Settings
            </button>
          </div>
        </div>
      )}

      {isCalibrating && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 100
          }}
        >
          <GestureRecognizer
            onGestureDetected={handleGesture}
            startCalibration={true}
            onCalibrationComplete={handleCalibrationComplete}
            onThresholdsUpdate={handleThresholdsUpdate}
          />
        </div>
      )}

      {showSettings && !isCalibrating && (
        <SettingsModal
          showGestures={showGestures}
          onShowGesturesChange={setShowGestures}
          showWebcam={showWebcam}
          onShowWebcamChange={setShowWebcam}
          thresholds={thresholds}
          onClose={() => setShowSettings(false)}
        />
      )}

      {!isCalibrating && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              fontSize: '2em',
              marginBottom: '20px',
              transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
              transformOrigin: zoomPoint
                ? `${zoomPoint.x}% ${zoomPoint.y}%`
                : 'center center',
              transition: 'transform 0.1s ease-out'
            }}
          >
            {currentNode?.data?.label || 'No content'}
          </div>

          {currentNode?.data?.type === 'image' ? (
            <div
              style={{
                maxWidth: '800px',
                width: '100%',
                marginBottom: '20px',
                transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
                transformOrigin: zoomPoint
                  ? `${zoomPoint.x}% ${zoomPoint.y}%`
                  : 'center center',
                transition: 'transform 0.1s ease-out'
              }}
            >
              <img
                src={currentNode.data.url}
                alt={currentNode.data.label}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            </div>
          ) : currentNode?.data?.type === 'video' ? (
            <div
              style={{
                maxWidth: '800px',
                width: '100%',
                marginBottom: '20px',
                transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
                transformOrigin: zoomPoint
                  ? `${zoomPoint.x}% ${zoomPoint.y}%`
                  : 'center center',
                transition: 'transform 0.1s ease-out'
              }}
            >
              <video
                ref={videoRef}
                src={currentNode.data.videoUrl}
                controls
                autoPlay={currentNode.data.autoplay}
                loop={currentNode.data.loop}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
            </div>
          ) : currentNode?.data?.type === 'api' ? (
            <>
              {apiError && (
                <div
                  style={{
                    color: '#ff0072',
                    padding: '10px',
                    background: '#fff0f4',
                    borderRadius: '4px',
                    marginTop: '10px',
                    maxWidth: '800px',
                    width: '100%'
                  }}
                >
                  <strong>Error:</strong> {apiError}
                </div>
              )}
              {apiResponse && (
                <div
                  style={{
                    marginTop: '20px',
                    maxWidth: '800px',
                    width: '100%'
                  }}
                >
                  <div
                    style={{ fontWeight: 'bold', marginBottom: '10px' }}
                  >
                    API Response:
                  </div>
                  <pre
                    style={{
                      background: '#f8f8f8',
                      padding: '15px',
                      borderRadius: '8px',
                      overflow: 'auto',
                      maxHeight: '300px'
                    }}
                  >
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                fontSize: '1.2em',
                marginBottom: '20px',
                whiteSpace: 'pre-wrap',
                maxWidth: '800px',
                textAlign: 'left'
              }}
            >
              {currentNode?.data?.content}
            </div>
          )}

          {showGestures && (
            <GestureList
              edges={workflow.edges}
              currentNodeId={currentNodeId}
              nodes={workflow.nodes}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PresentationMode;
