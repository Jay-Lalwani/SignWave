import React, { useState, useRef, useEffect } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Line, PivotControls } from '@react-three/drei';
import * as THREE from 'three';
import './CADEditor.css';
import FingerCursor from '../FingerCursor';

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

// Helper function to snap a point to the nearest grid point
const snapToGrid = (point: Point, gridSize: number = 1): Point => {
  return [
    Math.round(point[0] / gridSize) * gridSize,
    Math.round(point[1] / gridSize) * gridSize,
    Math.round(point[2] / gridSize) * gridSize
  ];
};

const CADEditor: React.FC<CADEditorProps> = ({ isActive, gestureData }) => {
  const [lines, setLines] = useState<Line3D[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [lastGestureTime, setLastGestureTime] = useState<number>(0);
  const [lastGesture, setLastGesture] = useState<string | null>(null);
  const [isHoldingFist, setIsHoldingFist] = useState(false);
  const orbitControlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.Camera>();
  const lastFistPosition = useRef<Point | null>(null);

  // Handle finger cursor position updates
  const handleCursorPositionUpdate = (position: { x: number; y: number }) => {
    if (!cameraRef.current) {
      cameraRef.current = orbitControlsRef.current?.object;
      return;
    }

    // Convert screen coordinates to world coordinates
    const vector = new THREE.Vector3();
    vector.set(
      (position.x / window.innerWidth) * 2 - 1,
      -(position.y / window.innerHeight) * 2 + 1,
      0.5
    );

    vector.unproject(cameraRef.current);
    const dir = vector.sub(cameraRef.current.position).normalize();
    const distance = -cameraRef.current.position.z / dir.z;
    const pos = cameraRef.current.position.clone().add(dir.multiplyScalar(distance));

    // Snap to grid
    const snappedPos = snapToGrid([pos.x, pos.y, pos.z]);
    setPreviewPoint(snappedPos);
  };

  // Handle gesture-based interactions
  useEffect(() => {
    if (!gestureData || !isActive || !previewPoint) return;

    const now = Date.now();
    setLastGestureTime(now);

    // Handle fist gesture
    if (gestureData.gesture === 'Closed_Fist') {
      if (!isHoldingFist) {  // Just made a fist
        if (!startPoint) {
          // Set start point when making a fist for the first time
          console.log('Setting start point:', previewPoint);
          setStartPoint(previewPoint);
          lastFistPosition.current = previewPoint;
        } else {
          // Complete the line when making a fist again
          console.log('Creating line:', startPoint, previewPoint);
          const newLine: Line3D = {
            id: Math.random().toString(36).substr(2, 9),
            points: [startPoint, previewPoint]
          };
          setLines(prev => [...prev, newLine]);
          // Set current point as the start point for the next line
          setStartPoint(previewPoint);
          lastFistPosition.current = previewPoint;
        }
      }
      setIsHoldingFist(true);
    } else if (gestureData.gesture !== 'Closed_Fist' && isHoldingFist) {
      // Only update when transitioning from fist to non-fist
      setIsHoldingFist(false);
      lastFistPosition.current = null;
    }

    // Handle other gestures (only when the gesture changes)
    if (gestureData.gesture !== lastGesture) {
      setLastGesture(gestureData.gesture || null);

      if (gestureData.gesture === 'Pointing_Up') {
        // Cancel current line and reset
        setStartPoint(null);
        setIsHoldingFist(false);
        lastFistPosition.current = null;
        if (selectedLine) {
          setLines(prev => prev.filter(line => line.id !== selectedLine));
          setSelectedLine(null);
        }
      } else if (gestureData.gesture === 'Victory') {
        // Selection mode
        if (lines.length > 0 && previewPoint) {
          const nearestLine = findNearestLine(previewPoint, lines);
          setSelectedLine(nearestLine.id);
        }
      } else if (gestureData.gesture === 'Open_Palm') {
        // Camera control mode
        if (orbitControlsRef.current && previewPoint) {
          const camera = orbitControlsRef.current.object;
          camera.position.x += previewPoint[0] * 0.1;
          camera.position.y += previewPoint[1] * 0.1;
          camera.position.z += previewPoint[2] * 0.1;
        }
      }
    }
  }, [gestureData, isActive, startPoint, previewPoint, lines, selectedLine, lastGesture, isHoldingFist]);

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

        {/* XY Grid (Top View) */}
        <Grid
          args={[10, 10]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#4169e1"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
          rotation={[0, 0, 0]}
          position={[0, 0, 0]}
        />

        {/* XZ Grid (Front View) */}
        <Grid
          args={[10, 10]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#dc143c"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
        />

        {/* YZ Grid (Side View) */}
        <Grid
          args={[10, 10]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#32cd32"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
          rotation={[0, Math.PI / 2, 0]}
          position={[0, 0, 0]}
        />

        {/* Drawing plane - invisible but used for interactions */}
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

        {/* Preview line - now solid instead of dashed */}
        {startPoint && previewPoint && (
          <Line
            points={[startPoint, previewPoint]}
            color="#ff000088"
            lineWidth={1.5}
          />
        )}

        {/* Start point indicator */}
        {startPoint && (
          <mesh position={startPoint}>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        )}

        {/* Preview point indicator */}
        {previewPoint && !isHoldingFist && (
          <mesh position={previewPoint}>
            <sphereGeometry args={[0.1, 32, 32]} />
            <meshBasicMaterial color="#ff000088" />
          </mesh>
        )}

        {/* Add axis labels */}
        <group>
          <Line
            points={[[0, 0, 0], [1, 0, 0]]}
            color="red"
            lineWidth={2}
          />
          <Line
            points={[[0, 0, 0], [0, 1, 0]]}
            color="green"
            lineWidth={2}
          />
          <Line
            points={[[0, 0, 0], [0, 0, 1]]}
            color="blue"
            lineWidth={2}
          />
        </group>

        <OrbitControls ref={orbitControlsRef} makeDefault />
      </Canvas>

      <FingerCursor
        color="#ff0000"
        size={10}
        onPositionUpdate={handleCursorPositionUpdate}
      />

      {/* Debug info */}
      <div className="debug-info">
        <div>Active: {isActive ? 'Yes' : 'No'}</div>
        <div>Current Gesture: {gestureData?.gesture || 'None'}</div>
        <div>Holding Fist: {isHoldingFist ? 'Yes' : 'No'}</div>
        <div>Selected Line: {selectedLine || 'None'}</div>
        <div>Last Gesture: {Date.now() - lastGestureTime < 1000 ? 'Active' : 'Inactive'}</div>
        <div>Start Point: {startPoint ? `(${startPoint.map(n => n.toFixed(1)).join(', ')})` : 'None'}</div>
        <div>Preview Point: {previewPoint ? `(${previewPoint.map(n => n.toFixed(1)).join(', ')})` : 'None'}</div>
        <div>Number of Lines: {lines.length}</div>
      </div>
    </div>
  );
};

export default CADEditor; 