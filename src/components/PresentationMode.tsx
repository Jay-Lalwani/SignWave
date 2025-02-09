import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import GestureRecognizer, { GestureResult } from './GestureRecognizer';
import Spline from '@splinetool/react-spline';
import { Application } from '@splinetool/runtime';
import { VoiceControlButton } from './VoiceControlButton';
import { useVoiceNavigation } from '../hooks/useVoiceNavigation';
import { useTheme } from '../context/ThemeContext';
import FingerCursor from './FingerCursor';
import CanvasPointer from './CanvasPointer';

// Fix module declarations
declare module '@splinetool/react-spline' {
  interface SplineProps {
    scene: string;
    onLoad?: (app: Application) => void;
  }
  const Spline: React.FC<SplineProps>;
}

declare module '@splinetool/runtime' {
  interface Application {
    getAllObjects(): Array<{
      name: string;
      rotation: { x: number; y: number };
    }>;
    setZoom(zoom: number): void;
  }
}

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

interface Slide {
  title: string;
  // add other slide properties as needed
}

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
  const ZOOM_SPEED = 0.2; //for complex object
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
  const [splineApps, setSplineApps] = useState<{ [key: string]: Application }>({});
  const [currentZoom, setCurrentZoom] = useState(1.0);
  const lastGestureTime = useRef<number>(0);
  const GESTURE_COOLDOWN = 1000; // 1 second cooldown between transitions
  const [isFullscreen, setIsFullscreen] = useState(false);
  const FULLSCREEN_DELAY = 1000; // 1 second delay between fullscreen toggles
  const lastFullscreenTime = useRef<number>(0);
  
  const currentNode = workflow.nodes.find(n => n.id === currentNodeId);

  // Derive pointer mode from the current node; default to "laser"
  // Add this near other derived values
  const { fontFamily, setFontFamily } = useTheme();
  const [slides, setSlides] = useState<Slide[]>([]);

  const {
    isListening,
    startListening,
    stopListening,
    isSupported,
    error 
  } = useVoiceNavigation({
    nodes: workflow.nodes,
    currentNodeId,
    setCurrentNodeId,
    setFontFamily
  });

  // Log state changes
  useEffect(() => {
    console.log('Current node ID changed:', currentNodeId);
  }, [currentNodeId]);

  useEffect(() => {
    console.log('Font family changed:', fontFamily);
  }, [fontFamily]);

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

  const handleRotation = useCallback((direction: 'left' | 'right') => {
    
    if (!currentNode?.data?.rotationDegree?.[direction] || !currentNode.data.splineScene) {
      return;
    }
    
    const splineApp = splineApps[currentNode.data.splineScene];
    if (!splineApp) {
      return;
    } 
    const allObjects = splineApp.getAllObjects();

    //manually put the names of the spline objects :(
    const obj = allObjects.find((obj: { name: string }) => 
      obj.name === 'chips' || 
      obj.name === 'Scene' || 
      obj.name === 'Text' || 
      obj.name === 'group' || 
      obj.name === 'swing Scene'
    );
     
    if (obj) {
      const degrees = currentNode.data.rotationDegree[direction];      
      const xMultiplier = direction === 'left' ? -1 : 1;
      obj.rotation.x = obj.rotation.x + (degrees.x * Math.PI * xMultiplier) / 180;
      obj.rotation.y = obj.rotation.y + (degrees.y * Math.PI * xMultiplier) / 180;
    } else {
      console.log('No suitable object found for rotation');
    }
  }, [splineApps, currentNode]);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (zoomAnimationRef.current) {
      cancelAnimationFrame(zoomAnimationRef.current);
    }
    const {min, max} = getZoomLimits();

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

  const handleSplineZoom = useCallback((direction: 'in' | 'out') => {
    if (splineApps[currentNode?.data?.splineScene]) {
      // Cancel any existing zoom animation
      if (zoomAnimationRef.current) {
        cancelAnimationFrame(zoomAnimationRef.current);
      }
      const {min, max} = getZoomLimits();

      const animate = () => {
        // Swapped the zoom factor calculation
        const zoomFactor = direction === 'in' ? (1 + ZOOM_SPEED) : (1 - ZOOM_SPEED);
        const newZoom = currentZoom * zoomFactor;

        // Check zoom bounds
        if (direction === 'in' && newZoom >= max) {
          cancelAnimationFrame(zoomAnimationRef.current!);
          return max;
        } else if (direction === 'out' && newZoom <= min) {
          cancelAnimationFrame(zoomAnimationRef.current!);
          return min;
        }

        splineApps[currentNode?.data?.splineScene].setZoom(newZoom);
        setCurrentZoom(newZoom);

        zoomAnimationRef.current = requestAnimationFrame(animate);
      };

      zoomAnimationRef.current = requestAnimationFrame(animate);
    }
  }, [splineApps, currentNode?.data?.splineScene, currentZoom, getZoomLimits]);

  const handleGesture = useCallback((result: GestureResult) => {
    const now = Date.now();
    if (now - lastGestureTime.current < GESTURE_COOLDOWN) {
      return; // Skip if we're still in cooldown
    }

    // Toggle pointer mode based on configurable gestures
    if (currentNode?.data?.pointerStartGesture && result.gesture === currentNode.data.pointerStartGesture) {
      setCursorFollow(true);
      return;
    } else if (currentNode?.data?.pointerStopGesture && result.gesture === currentNode.data.pointerStopGesture) {
      setCursorFollow(false);
      return;
    }

    // Handle fullscreen toggle
    if (currentNode?.data?.fullscreenGesture && result.gesture === currentNode.data.fullscreenGesture) {
      const now = Date.now();
      if (now - lastFullscreenTime.current >= FULLSCREEN_DELAY) {
        console.log('Fullscreen toggle triggered:', !isFullscreen);
        setIsFullscreen(prev => !prev);
        lastFullscreenTime.current = now;
      }
      return;
    }

    // Find edges that start from current node
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

    // Handle zoom gestures
    if (currentNode?.data.zoomPoint && currentNode?.data?.type !== 'complexobject') {
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
    //Handle zoom gestures for the complex object zoom in and zoom out gesture
    if (currentNode?.data?.type === 'complexobject') {
      if (result.gesture === currentNode.data.zoomInGesture) {
        setZoomPoint(currentNode.data.zoomPoint);
        handleSplineZoom('in');
        return;
      } else if (result.gesture === currentNode.data.zoomOutGesture) {
        setZoomPoint(currentNode.data.zoomPoint);
        handleSplineZoom('out');
        return;
      }
    }

    if (currentNode?.data?.type === 'complexobject') {
      if (result.gesture === currentNode.data.rotationGesture?.left) {
        handleRotation('left');
        return;
      } else if (result.gesture === currentNode.data.rotationGesture?.right) {
        handleRotation('right');
        return;
      }
    }
    
    // Handle transitions
    if (possibleTransitions.length > 0) {
      lastGestureTime.current = now;
      setZoomLevel(1);
      setZoomPoint(null);
      setCurrentNodeId(possibleTransitions[0].target);
    }
  }, [currentNodeId, workflow.edges, currentNode, handleZoom, handleRotation, handleSplineZoom, getScrubAmount]);

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

  const handleNextSlide = () => {
    // Implement next slide logic
  };

  const handlePreviousSlide = () => {
    // Implement previous slide logic
  };

  const handleNavigateToTitle = (title: string) => {
    // Implement navigate to title logic
  };

  // Start listening automatically when component mounts
  useEffect(() => {
    if (isSupported && !isListening) {
      startListening();
    }
    
    // Cleanup: stop listening when component unmounts
    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isSupported, isListening, startListening, stopListening]);

  return (
    <div 
      className="presentation-mode"
      style={{ 
        fontFamily: fontFamily,
        height: '100vh',
        width: '100vw',
        position: 'relative'
      }}
    >
      <div 
        className="presentation-content"
        style={{ fontFamily: fontFamily }}
      >
        <div className="controls">
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
        </div>

        {!isCalibrating && (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            padding: isFullscreen ? 0 : '20px',
            overflow: 'hidden',
            background: isFullscreen ? 'black' : 'transparent',
            position: 'relative'
          }}>
            {!isFullscreen && (
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
            )}
            {currentNode?.data?.type === 'complexobject' ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '20px',
                width: '100%',
                height: isFullscreen ? '100vh' : 'auto'
              }}>
                <div style={{
                  maxWidth: isFullscreen ? '100%' : '800px',
                  width: '100%',
                  height: isFullscreen ? '100%' : '500px',
                  transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
                  transformOrigin: zoomPoint 
                    ? `${zoomPoint.x}% ${zoomPoint.y}%` 
                    : 'center center',
                  transition: 'transform 0.1s ease-out',
                  background: '#f0f0f0',
                  borderRadius: isFullscreen ? 0 : '8px',
                  overflow: 'hidden'
                }}>
                  {currentNode.data.splineScene && (
                    <Spline 
                      scene={currentNode.data.splineScene}
                      onLoad={(splineApp: Application) => {
                        setSplineApps(prev => ({
                          ...prev,
                          [currentNode.data.splineScene]: splineApp
                        }));
                      }}
                    />
                  )}
                </div>
                {!isFullscreen && (
                  <div style={{ 
                    fontSize: '1.5em',
                    maxWidth: '800px',
                    textAlign: 'center',
                    color: '#333'
                  }}>
                    {currentNode?.data?.label || 'No content'}
                  </div>
                )}
              </div>
            ) : currentNode?.data?.type === 'image' ? (
              <div style={{
                maxWidth: isFullscreen ? '100%' : '800px',
                width: '100%',
                height: isFullscreen ? '100vh' : 'auto',
                marginBottom: isFullscreen ? 0 : '20px',
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
                    height: '100%',
                    objectFit: isFullscreen ? 'contain' : 'cover',
                    borderRadius: isFullscreen ? 0 : '8px',
                    boxShadow: isFullscreen ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
            ) : currentNode?.data?.type === 'video' ? (
              <div style={{
                maxWidth: isFullscreen ? '100%' : '800px',
                width: '100%',
                height: isFullscreen ? '100vh' : 'auto',
                marginBottom: isFullscreen ? 0 : '20px',
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
                    height: '100%',
                    objectFit: isFullscreen ? 'contain' : 'cover',
                    borderRadius: isFullscreen ? 0 : '8px',
                    boxShadow: isFullscreen ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
            ) : currentNode?.data?.type === 'text' ? (
              <div style={{ 
                fontSize: isFullscreen ? '2em' : '1.2em',
                marginBottom: isFullscreen ? 0 : '20px',
                whiteSpace: 'pre-wrap',
                maxWidth: isFullscreen ? '90%' : '800px',
                width: '100%',
                height: isFullscreen ? '100vh' : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isFullscreen ? 'white' : 'inherit',
                textAlign: 'center'
              }}>
                {currentNode?.data?.content}
              </div>
            ) : null}
            {showGestures && (
              <div style={{ 
                marginTop: isFullscreen ? 0 : '20px', 
                padding: '15px',
                background: isFullscreen ? 'rgba(0,0,0,0.8)' : 'rgba(240,240,240,0.9)',
                borderRadius: '8px',
                maxWidth: '400px',
                width: '100%',
                position: isFullscreen ? 'fixed' : 'relative',
                bottom: isFullscreen ? '20px' : 'auto',
                right: isFullscreen ? '20px' : 'auto',
                zIndex: isFullscreen ? 1000 : 1,
                backdropFilter: 'blur(5px)',
                border: isFullscreen ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '10px', 
                  color: isFullscreen ? '#fff' : '#666' 
                }}>
                  Available Gestures:
                </div>
                {outgoingEdges.map(edge => (
                  <div key={edge.id} style={{ 
                    margin: '8px 0',
                    padding: '8px',
                    background: isFullscreen ? 'rgba(255,255,255,0.1)' : 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ color: '#ff0072', fontWeight: 'bold' }}>
                      {edge.data?.gesture}
                    </span>
                    <span style={{ color: isFullscreen ? '#fff' : '#666' }}>→</span>
                    <span style={{ color: isFullscreen ? '#fff' : 'inherit' }}>
                      {workflow.nodes.find(n => n.id === edge.target)?.data.label}
                    </span>
                  </div>
                ))}

                {currentNode?.data?.pointerStartGesture && (
                  <div style={{ 
                    margin: '8px 0',
                    padding: '8px',
                    background: isFullscreen ? 'rgba(255,255,255,0.1)' : 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {currentNode.data.pointerStartGesture}
                    </span>
                    <span style={{ color: isFullscreen ? '#fff' : '#666' }}>→</span>
                    <span style={{ color: isFullscreen ? '#fff' : 'inherit' }}>
                      Start {currentNode.data.pointerMode === 'laser' ? 'Laser' : 'Drawing'} Pointer
                    </span>
                  </div>
                )}
                {currentNode?.data?.pointerStopGesture && (
                  <div style={{ 
                    margin: '8px 0',
                    padding: '8px',
                    background: isFullscreen ? 'rgba(255,255,255,0.1)' : 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {currentNode.data.pointerStopGesture}
                    </span>
                    <span style={{ color: isFullscreen ? '#fff' : '#666' }}>→</span>
                    <span style={{ color: isFullscreen ? '#fff' : 'inherit' }}>
                      Stop {currentNode.data.pointerMode === 'laser' ? 'Laser' : 'Drawing'} Pointer
                    </span>
                  </div>
                )}

                {currentNode?.data?.zoomInGesture && (
                  <div style={{ 
                    margin: '8px 0',
                    padding: '8px',
                    background: isFullscreen ? 'rgba(255,255,255,0.1)' : 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ color: '#2196F3', fontWeight: 'bold' }}>
                      {currentNode.data.zoomInGesture}
                    </span>
                    <span style={{ color: isFullscreen ? '#fff' : '#666' }}>→</span>
                    <span style={{ color: isFullscreen ? '#fff' : 'inherit' }}>Zoom In</span>
                  </div>
                )}
                {currentNode?.data?.zoomOutGesture && (
                  <div style={{ 
                    margin: '8px 0',
                    padding: '8px',
                    background: isFullscreen ? 'rgba(255,255,255,0.1)' : 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ color: '#2196F3', fontWeight: 'bold' }}>
                      {currentNode.data.zoomOutGesture}
                    </span>
                    <span style={{ color: isFullscreen ? '#fff' : '#666' }}>→</span>
                    <span style={{ color: isFullscreen ? '#fff' : 'inherit' }}>Zoom Out</span>
                  </div>
                )}

                {currentNode?.data?.type === 'video' && (
                  <>
                    {currentNode.data.playPauseGesture && (
                      <div style={{ 
                        margin: '8px 0',
                        padding: '8px',
                        background: isFullscreen ? 'rgba(255,255,255,0.1)' : 'white',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ color: '#9C27B0', fontWeight: 'bold' }}>
                          {currentNode.data.playPauseGesture}
                        </span>
                        <span style={{ color: isFullscreen ? '#fff' : '#666' }}>→</span>
                        <span style={{ color: isFullscreen ? '#fff' : 'inherit' }}>Play/Pause Video</span>
                      </div>
                    )}
                    {currentNode.data.scrubForwardGesture && (
                      <div style={{ 
                        margin: '8px 0',
                        padding: '8px',
                        background: isFullscreen ? 'rgba(255,255,255,0.1)' : 'white',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ color: '#9C27B0', fontWeight: 'bold' }}>
                          {currentNode.data.scrubForwardGesture}
                        </span>
                        <span style={{ color: isFullscreen ? '#fff' : '#666' }}>→</span>
                        <span style={{ color: isFullscreen ? '#fff' : 'inherit' }}>Fast Forward</span>
                      </div>
                    )}
                    {currentNode.data.scrubBackwardGesture && (
                      <div style={{ 
                        margin: '8px 0',
                        padding: '8px',
                        background: isFullscreen ? 'rgba(255,255,255,0.1)' : 'white',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{ color: '#9C27B0', fontWeight: 'bold' }}>
                          {currentNode.data.scrubBackwardGesture}
                        </span>
                        <span style={{ color: isFullscreen ? '#fff' : '#666' }}>→</span>
                        <span style={{ color: isFullscreen ? '#fff' : 'inherit' }}>Rewind</span>
                      </div>
                    )}
                  </>
                )}

                {currentNode?.data?.fullscreenGesture && (
                  <div style={{ 
                    margin: '8px 0',
                    padding: '8px',
                    background: isFullscreen ? 'rgba(255,255,255,0.1)' : 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ color: '#673AB7', fontWeight: 'bold' }}>
                      {currentNode.data.fullscreenGesture}
                    </span>
                    <span style={{ color: isFullscreen ? '#fff' : '#666' }}>→</span>
                    <span style={{ color: isFullscreen ? '#fff' : 'inherit' }}>Toggle Fullscreen</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
    </div>
  );
};

export default PresentationMode;
