import React, { useState } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
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
  };
}

const CADEditor: React.FC<CADEditorProps> = ({ isActive, gestureData }) => {
  const [lines, setLines] = useState<Line3D[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<Point[]>([]);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  // Handle gesture-based interactions
  React.useEffect(() => {
    if (!gestureData || !isActive) return;

    if (gestureData.isGrabbing && selectedLine) {
      const scaleFactor = 0.01;
      const handPos: Point = [
        gestureData.handPosition.x * scaleFactor,
        gestureData.handPosition.y * scaleFactor,
        gestureData.handPosition.z * scaleFactor
      ];

      setLines(prev =>
        prev.map(line =>
          line.id === selectedLine
            ? {
              ...line,
              points: line.points.map(point => [
                point[0] + handPos[0],
                point[1] + handPos[1],
                point[2] + handPos[2]
              ])
            }
            : line
        )
      );
    }
  }, [gestureData, isActive, selectedLine]);

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!isDrawing) {
      setIsDrawing(true);
      const point: Point = [
        event.point.x,
        event.point.y,
        event.point.z
      ];
      setCurrentLine([point]);
    }
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (isDrawing) {
      const point: Point = [
        event.point.x,
        event.point.y,
        event.point.z
      ];
      setCurrentLine((prev) => [...prev.slice(0, -1), point]);
    }
  };

  const handlePointerUp = () => {
    if (isDrawing && currentLine.length > 1) {
      const newLine: Line3D = {
        id: Math.random().toString(36).substr(2, 9),
        points: currentLine,
      };
      setLines((prev) => [...prev, newLine]);
    }
    setIsDrawing(false);
    setCurrentLine([]);
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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

export default CADEditor; 