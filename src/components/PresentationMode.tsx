import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import GestureRecognizer, { GestureResult } from './GestureRecognizer';
import FingerCursor from './FingerCursor';
import CanvasPointer from './CanvasPointer';

type Props = {
  workflow: {
    nodes: Node[];
    edges: Edge[];
  };
};

type GestureThresholds = {
  [key: string]: number;
};

const THRESHOLDS_STORAGE_KEY = 'gesture_calibration_thresholds';

const PresentationMode: React.FC<Props> = ({ workflow }) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>('1');
  const [showSettings, setShowSettings] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [showGestures, setShowGestures] = useState(true);
  const [showWebcam, setShowWebcam] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPoint, setZoomPoint] = useState<{ x: number; y: number } | null>(null);
  const zoomAnimationRef = useRef<number>();
  const [cursorFollow, setCursorFollow] = useState(false);
  const [thresholds, setThresholds] = useState<GestureThresholds>(() => {
    try {
      const saved = localStorage.getItem(THRESHOLDS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verify we have all required gestures
        const hasAllGestures = ['Thumb_Up', 'Thumb_Down', 'Open_Palm', 'Closed_Fist', 'Victory', 'Pointing_Up']
          .every(gesture => typeof parsed[gesture] === 'number');
        if (hasAllGestures) {
          setIsCalibrating(false);
          return parsed;
        }
      }
      return {};
    } catch (e) {
      console.error('Failed to load thresholds:', e);
      return {};
    }
  });
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const PLAY_PAUSE_DELAY = 1000; // 1 second delay between play/pause gestures
  const lastPlayPauseTime = useRef<number>(0);
  
  const currentNode = workflow.nodes.find(n => n.id === currentNodeId);

  // Derive pointer mode from the current node; default to "laser"
  const pointerMode = currentNode?.data?.pointerMode || "laser";

  // Get the current scrub amount or use default
  const getScrubAmount = useCallback(() => {
    return currentNode?.data?.scrubAmount || 5;
  }, [currentNode]);

  // Handle continuous zoom
  useEffect(() => {
    return () => {
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
    };
  }, []);

  const getZoomLimits = useCallback(() => {
    if (!currentNode?.data) return { min: 1, max: 4 };
    return {
      min: currentNode.data.minZoom || 1,
      max: currentNode.data.maxZoom || 4
    };
  }, [currentNode]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current);
    }

    const { min, max } = getZoomLimits();

    const animate = () => {
      setZoomLevel(current => {
        const newZoom = direction === 'in' 
          ? Math.min(current + 0.05, max)
          : Math.max(current - 0.05, min);
        
        if ((direction === 'in' && newZoom < max) || 
            (direction === 'out' && newZoom > min)) {
          zoomAnimationRef.current = requestAnimationFrame(animate);
        }
        
        return newZoom;
      });
    };

    zoomAnimationRef.current = requestAnimationFrame(animate);
  }, [getZoomLimits]);

  const handleGesture = useCallback((result: GestureResult) => {
    // Toggle pointer mode based on configurable gestures
    if (currentNode?.data?.pointerStartGesture && result.gesture === currentNode.data.pointerStartGesture) {
      setCursorFollow(true);
      return;
    } else if (currentNode?.data?.pointerStopGesture && result.gesture === currentNode.data.pointerStopGesture) {
      setCursorFollow(false);
      return;
    }
  
    // Existing logic for transitions and video controls…
    const possibleTransitions = workflow.edges.filter(e =>
      e.source === currentNodeId &&
      e.data?.gesture === result.gesture
    );
    
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
        const scrubAmount = getScrubAmount();
        videoRef.current.currentTime = Math.min(
          videoRef.current.currentTime + scrubAmount,
          videoRef.current.duration
        );
        return;
      } else if (result.gesture === currentNode.data.scrubBackwardGesture) {
        const scrubAmount = getScrubAmount();
        videoRef.current.currentTime = Math.max(
          videoRef.current.currentTime - scrubAmount,
          0
        );
        return;
      }
    }
    
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
  
    // Handle node transitions if a matching edge is found.
    if (possibleTransitions.length > 0) {
      setZoomLevel(1);
      setZoomPoint(null);
      setCurrentNodeId(possibleTransitions[0].target);
    }
  }, [currentNodeId, workflow.edges, currentNode, handleZoom, getScrubAmount]);

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

  useEffect(() => {
    const executeApiCall = async () => {
      if (currentNode?.data?.type === 'api') {
        try {
          setApiError(null);
          setApiResponse(null);
          
          // Add CORS proxy
          const corsProxy = 'https://cors-anywhere.herokuapp.com/';
          const apiUrl = currentNode.data.apiEndpoint!;
          const fullUrl = apiUrl.startsWith('http') ? corsProxy + apiUrl : apiUrl;

          const response = await fetch(fullUrl, {
            method: currentNode.data.apiMethod || 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Origin': window.location.origin,
            },
            body: currentNode.data.apiPayload ? JSON.parse(currentNode.data.apiPayload) : undefined,
          });

          if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
          }

          const data = await response.json();
          setApiResponse(data);
        } catch (error) {
          setApiError(error instanceof Error ? error.message : 'Failed to execute API call');
          console.error('API call error:', error);
        }
      }
    };

    executeApiCall();
  }, [currentNode]);

  const outgoingEdges = workflow.edges.filter(e => e.source === currentNodeId);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {!isCalibrating && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          width: '200px', 
          height: '150px', 
          zIndex: 10,
          background: '#f8f8f8',
          borderRadius: '0 0 0 8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <GestureRecognizer 
            onGestureDetected={handleGesture}
            showWebcam={showWebcam}
            startCalibration={false}
            onThresholdsUpdate={handleThresholdsUpdate}
          />
          <div style={{ 
            position: 'absolute', 
            bottom: -40, 
            left: 0, 
            right: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '10px' 
          }}>
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
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100 }}>
          <GestureRecognizer 
            onGestureDetected={handleGesture}
            startCalibration={true}
            onCalibrationComplete={handleCalibrationComplete}
            onThresholdsUpdate={handleThresholdsUpdate}
          />
        </div>
      )}

      {showSettings && !isCalibrating && (
        <div style={{
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
        }}>
          <h3 style={{ marginTop: 0 }}>Settings</h3>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showGestures}
                onChange={(e) => setShowGestures(e.target.checked)}
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
                onChange={(e) => setShowWebcam(e.target.checked)}
                style={{ marginRight: '10px' }}
              />
              Show Webcam Preview
            </label>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Gesture Thresholds:</div>
            <div style={{ 
              maxHeight: '150px', 
              overflowY: 'auto',
              background: '#f5f5f5',
              borderRadius: '4px',
              padding: '10px'
            }}>
              {Object.entries(thresholds).map(([gesture, threshold]) => (
                <div key={gesture} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '5px 0'
                }}>
                  <span>{gesture.replace('_', ' ')}</span>
                  <span style={{ 
                    color: '#666',
                    background: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }}>
                    {(threshold * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowSettings(false)}
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
      )}

      {!isCalibrating && (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            fontSize: '2em',
            marginBottom: '20px',
            transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
            transformOrigin: zoomPoint 
              ? `${zoomPoint.x}% ${zoomPoint.y}%` 
              : 'center center',
            transition: 'transform 0.1s ease-out'
          }}>
            {currentNode?.data?.label || 'No content'}
          </div>
          {currentNode?.data?.type === 'image' ? (
            <div style={{
              maxWidth: '800px',
              width: '100%',
              marginBottom: '20px',
              transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
              transformOrigin: zoomPoint 
                ? `${zoomPoint.x}% ${zoomPoint.y}%` 
                : 'center center',
              transition: 'transform 0.1s ease-out'
            }}>
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
            <div style={{
              maxWidth: '800px',
              width: '100%',
              marginBottom: '20px',
              transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
              transformOrigin: zoomPoint 
                ? `${zoomPoint.x}% ${zoomPoint.y}%` 
                : 'center center',
              transition: 'transform 0.1s ease-out'
            }}>
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
              {showGestures}
            </div>
          ) : currentNode?.data?.type === 'api' ? (
            <>
              {apiError && (
                <div style={{
                  color: '#ff0072',
                  padding: '10px',
                  background: '#fff0f4',
                  borderRadius: '4px',
                  marginTop: '10px',
                  maxWidth: '800px',
                  width: '100%'
                }}>
                  <strong>Error:</strong> {apiError}
                </div>
              )}
              {apiResponse && (
                <div style={{
                  marginTop: '20px',
                  maxWidth: '800px',
                  width: '100%'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>API Response:</div>
                  <pre style={{
                    background: '#f8f8f8',
                    padding: '15px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              fontSize: '1.2em',
              marginBottom: '20px',
              whiteSpace: 'pre-wrap',
              maxWidth: '800px',
              textAlign: 'left'
            }}>
              {currentNode?.data?.content}
            </div>
          )}
          {showGestures && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px',
              background: 'rgba(240,240,240,0.9)',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#666' }}>
                Available Gestures:
              </div>
              {outgoingEdges.map(edge => (
                <div key={edge.id} style={{ 
                  margin: '8px 0',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ color: '#ff0072', fontWeight: 'bold' }}>
                    {edge.data?.gesture}
                  </span>
                  <span style={{ color: '#666' }}>→</span>
                  <span>{workflow.nodes.find(n => n.id === edge.target)?.data.label}</span>
                </div>
              ))}

              {currentNode?.data?.pointerStartGesture && (
                <div style={{ 
                  margin: '8px 0',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    {currentNode.data.pointerStartGesture}
                  </span>
                  <span style={{ color: '#666' }}>→</span>
                  <span>Start {currentNode.data.pointerMode === 'laser' ? 'Laser' : 'Drawing'} Pointer</span>
                </div>
              )}
              {currentNode?.data?.pointerStopGesture && (
                <div style={{ 
                  margin: '8px 0',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    {currentNode.data.pointerStopGesture}
                  </span>
                  <span style={{ color: '#666' }}>→</span>
                  <span>Stop {currentNode.data.pointerMode === 'laser' ? 'Laser' : 'Drawing'} Pointer</span>
                </div>
              )}

              {currentNode?.data?.zoomInGesture && (
                <div style={{ 
                  margin: '8px 0',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ color: '#2196F3', fontWeight: 'bold' }}>
                    {currentNode.data.zoomInGesture}
                  </span>
                  <span style={{ color: '#666' }}>→</span>
                  <span>Zoom In</span>
                </div>
              )}
              {currentNode?.data?.zoomOutGesture && (
                <div style={{ 
                  margin: '8px 0',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{ color: '#2196F3', fontWeight: 'bold' }}>
                    {currentNode.data.zoomOutGesture}
                  </span>
                  <span style={{ color: '#666' }}>→</span>
                  <span>Zoom Out</span>
                </div>
              )}

              {currentNode?.data?.type === 'video' && (
                <>
                  {currentNode.data.playPauseGesture && (
                    <div style={{ 
                      margin: '8px 0',
                      padding: '8px',
                      background: 'white',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ color: '#9C27B0', fontWeight: 'bold' }}>
                        {currentNode.data.playPauseGesture}
                      </span>
                      <span style={{ color: '#666' }}>→</span>
                      <span>Play/Pause Video</span>
                    </div>
                  )}
                  {currentNode.data.scrubForwardGesture && (
                    <div style={{ 
                      margin: '8px 0',
                      padding: '8px',
                      background: 'white',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ color: '#9C27B0', fontWeight: 'bold' }}>
                        {currentNode.data.scrubForwardGesture}
                      </span>
                      <span style={{ color: '#666' }}>→</span>
                      <span>Fast Forward</span>
                    </div>
                  )}
                  {currentNode.data.scrubBackwardGesture && (
                    <div style={{ 
                      margin: '8px 0',
                      padding: '8px',
                      background: 'white',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ color: '#9C27B0', fontWeight: 'bold' }}>
                        {currentNode.data.scrubBackwardGesture}
                      </span>
                      <span style={{ color: '#666' }}>→</span>
                      <span>Rewind</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
      {/* Render the pointer overlay if enabled.
          Use the pointer mode from the current node: "laser" shows FingerCursor; "canvas" shows CanvasPointer */}
      {cursorFollow && (pointerMode === "laser" ? 
        <FingerCursor 
          color={currentNode?.data?.pointerColor || '#ff0000'} 
          size={currentNode?.data?.pointerSize || 10} 
        /> : 
        <CanvasPointer 
          color={currentNode?.data?.pointerColor || '#ff0000'} 
          size={currentNode?.data?.pointerSize || 10} 
        />
      )}
    </div>
  );
};

export default PresentationMode;
