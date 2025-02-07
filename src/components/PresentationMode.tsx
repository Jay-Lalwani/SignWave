import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import GestureRecognizer, { GestureResult } from './GestureRecognizer';
import { TextSlide } from './slides/TextSlide';
import { ImageSlide } from './slides/ImageSlide';
import { VideoSlide } from './slides/VideoSlide';
import { ApiSlide } from './slides/ApiSlide';
import { SettingsPanel } from './SettingsPanel';
import { GesturesList } from './GesturesList';
import { useZoom } from '../hooks/useZoom';
import { useVideoControls } from '../hooks/useVideoControls';
import { GestureThresholds, SlideNodeData } from '../types/workflow';

type Props = {
  workflow: {
    nodes: Node<SlideNodeData>[];
    edges: Edge[];
  };
};

const THRESHOLDS_STORAGE_KEY = 'gesture_calibration_thresholds';

const PresentationMode: React.FC<Props> = ({ workflow }) => {
  const [currentNodeId, setCurrentNodeId] = useState<string>('1');
  const [showSettings, setShowSettings] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [showGestures, setShowGestures] = useState(true);
  const [showWebcam, setShowWebcam] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  const currentNode = workflow.nodes.find(n => n.id === currentNodeId);
  const { zoomLevel, zoomPoint, setZoomPoint, handleZoom, resetZoom } = useZoom();
  const { handlePlayPause, handleScrubForward, handleScrubBackward } = useVideoControls();

  const handleGesture = useCallback((result: GestureResult) => {
    // Find edges that start from current node
    const possibleTransitions = workflow.edges.filter(e => 
      e.source === currentNodeId && 
      e.data?.gesture === result.gesture
    );
    
    // Handle video control gestures
    if (currentNode?.data?.type === 'video' && videoRef.current) {
      if (result.gesture === currentNode.data.playPauseGesture) {
        handlePlayPause(videoRef.current);
        return;
      } else if (result.gesture === currentNode.data.scrubForwardGesture) {
        handleScrubForward(videoRef.current);
        return;
      } else if (result.gesture === currentNode.data.scrubBackwardGesture) {
        handleScrubBackward(videoRef.current);
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
      resetZoom();
      setCurrentNodeId(possibleTransitions[0].target);
    }
  }, [currentNodeId, workflow.edges, currentNode, handleZoom, setZoomPoint, resetZoom, handlePlayPause, handleScrubForward, handleScrubBackward]);

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
        <SettingsPanel
          showGestures={showGestures}
          showWebcam={showWebcam}
          thresholds={thresholds}
          onShowGesturesChange={setShowGestures}
          onShowWebcamChange={setShowWebcam}
          onClose={() => setShowSettings(false)}
        />
      )}

      {!isCalibrating && currentNode && (
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
            {currentNode.data.label}
          </div>

          {currentNode.data.type === 'text' && (
            <TextSlide data={currentNode.data} zoomLevel={zoomLevel} zoomPoint={zoomPoint} />
          )}

          {currentNode.data.type === 'image' && (
            <ImageSlide data={currentNode.data} zoomLevel={zoomLevel} zoomPoint={zoomPoint} />
          )}

          {currentNode.data.type === 'video' && (
            <VideoSlide ref={videoRef} data={currentNode.data} zoomLevel={zoomLevel} zoomPoint={zoomPoint} />
          )}

          {currentNode.data.type === 'api' && (
            <ApiSlide data={currentNode.data} />
          )}

          {showGestures && (
            <GesturesList
              currentNodeId={currentNodeId}
              edges={workflow.edges}
              nodes={workflow.nodes}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PresentationMode; 