import React, { useState, useRef, useEffect } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Line, PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import './CADEditor.css';

type Point = [number, number, number];
type Line3D = {
  id: string;
  points: Point[];
};

interface CADEditorProps {
  isActive: boolean;
  gestureData?: {
    handPosition: { x: number; y: number; z: number };
    isGrabbing: boolean;
    gesture?: string;
  };
}

const CADEditor: React.FC<CADEditorProps> = ({ isActive, gestureData }) => {
  const [lines, setLines] = useState<Line3D[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<Point[]>([]);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [lastGestureTime, setLastGestureTime] = useState<number>(0);
  const orbitControlsRef = useRef<any>(null);

  // Debug log for gesture data
  useEffect(() => {
    if (gestureData) {
      const now = Date.now();
      setLastGestureTime(now);
      console.log('CADEditor received gesture data:', {
        gesture: gestureData.gesture,
        position: gestureData.handPosition,
        isGrabbing: gestureData.isGrabbing,
        timestamp: now
      });
    }
  }, [gestureData]);

  // Handle gesture-based interactions
  useEffect(() => {
    if (!gestureData || !isActive) {
      return;
    }

    const { gesture, handPosition, isGrabbing } = gestureData;

    // Scale and invert Y coordinate for better mapping
    const scaleFactor = 0.005; // Reduced for more precise control
    const handPos: Point = [
      (handPosition.x - window.innerWidth / 2) * scaleFactor,
      -(handPosition.y - window.innerHeight / 2) * scaleFactor,
      handPosition.z * scaleFactor
    ];

    // Handle different gestures
    if (isGrabbing || gesture === 'Closed_Fist') {
      console.log('Drawing mode active');
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentLine([handPos]);
      } else {
        setCurrentLine(prev => {
          // Only add point if it's significantly different from the last point
          const lastPoint = prev[prev.length - 1];
          const distance = Math.sqrt(
            Math.pow(lastPoint[0] - handPos[0], 2) +
            Math.pow(lastPoint[1] - handPos[1], 2) +
            Math.pow(lastPoint[2] - handPos[2], 2)
          );
          return distance > 0.1 ? [...prev, handPos] : prev;
        });
      }
    } else if (gesture === 'Victory') {
      if (lines.length > 0) {
        const nearestLine = findNearestLine(handPos, lines);
        setSelectedLine(nearestLine.id);
      }
    } else if (gesture === 'Pointing_Up') {
      if (selectedLine) {
        setLines(prev => prev.filter(line => line.id !== selectedLine));
        setSelectedLine(null);
      }
    } else if (gesture === 'Open_Palm') {
      if (orbitControlsRef.current) {
        const camera = orbitControlsRef.current.object;
        camera.position.x += handPos[0];
        camera.position.y += handPos[1];
        camera.position.z += handPos[2];
      }
    } else {
      // No recognized gesture
      if (isDrawing) {
        if (currentLine.length > 1) {
          const newLine: Line3D = {
            id: Math.random().toString(36).substr(2, 9),
            points: currentLine,
          };
          setLines(prev => [...prev, newLine]);
        }
        setIsDrawing(false);
        setCurrentLine([]);
      }
    }
  }, [gestureData, isActive]);

  // Helper function to find the nearest line to a point
  const findNearestLine = (point: Point, lines: Line3D[]) => {
    let nearestLine = lines[0];
    let minDistance = Infinity;

    lines.forEach(line => {
      const distance = line.points.reduce((min, linePoint) => {
        const d = Math.sqrt(
          Math.pow(point[0] - linePoint[0], 2) +
          Math.pow(point[1] - linePoint[1], 2) +
          Math.pow(point[2] - linePoint[2], 2)
        );
        return Math.min(min, d);
      }, Infinity);

      if (distance < minDistance) {
        minDistance = distance;
        nearestLine = line;
      }
    });

    return nearestLine;
  };

  if (!isActive) return null;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />

        {/* Grid helper */}
        <Grid
          args={[10, 10]}
          cellSize={1}
          cellThickness={1}
          cellColor="#6f6f6f"
          sectionSize={3}
          sectionThickness={1.5}
          sectionColor="#9d4b4b"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />

        {/* Drawing plane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial />
        </mesh>

        {/* Existing lines */}
        {lines.map((line) => (
          <group key={line.id}>
            <Line
              points={line.points}
              color={selectedLine === line.id ? "#ff0000" : "#000000"}
              lineWidth={2}
              onClick={() => setSelectedLine(line.id)}
            />
            {selectedLine === line.id && (
              <PivotControls
                scale={0.75}
                anchor={[0, 0, 0]}
                onDrag={(matrix) => {
                  setLines((prev) =>
                    prev.map((l) =>
                      l.id === line.id
                        ? {
                          ...l,
                          points: l.points.map((point) => {
                            const vector = new THREE.Vector3(...point);
                            vector.applyMatrix4(matrix);
                            return [vector.x, vector.y, vector.z] as Point;
                          }),
                        }
                        : l
                    )
                  );
                }}
              />
            )}
          </group>
        ))}

        {/* Current drawing line */}
        {isDrawing && currentLine.length > 0 && (
          <Line points={currentLine} color="#ff0000" lineWidth={2} />
        )}

        <OrbitControls ref={orbitControlsRef} makeDefault />
      </Canvas>

      {/* Enhanced Debug display */}
      <div className="debug-info">
        <div>Active: {isActive ? 'Yes' : 'No'}</div>
        <div>Drawing: {isDrawing ? 'Yes' : 'No'}</div>
        <div>Current Gesture: {gestureData?.gesture || 'None'}</div>
        <div>Selected Line: {selectedLine || 'None'}</div>
        <div>Last Gesture: {Date.now() - lastGestureTime < 1000 ? 'Active' : 'Inactive'}</div>
        <div>Hand Position: {gestureData ?
          `X: ${gestureData.handPosition.x.toFixed(1)}, 
           Y: ${gestureData.handPosition.y.toFixed(1)}, 
           Z: ${gestureData.handPosition.z.toFixed(1)}`
          : 'No Data'}</div>
      </div>

      {/* Active Gesture Indicator */}
      {gestureData && Date.now() - lastGestureTime < 1000 && (
        <div className="active-gesture-indicator">
          <div className="gesture-name">{gestureData.gesture}</div>
          <div className="gesture-action">
            {gestureData.gesture === 'Closed_Fist' && 'Drawing Mode'}
            {gestureData.gesture === 'Victory' && 'Selection Mode'}
            {gestureData.gesture === 'Pointing_Up' && 'Delete Mode'}
            {gestureData.gesture === 'Open_Palm' && 'Camera Control'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CADEditor; 