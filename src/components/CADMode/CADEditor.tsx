import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './CADEditor.css';

interface CADEditorProps {
  isActive: boolean;
  gestureData?: {
    handPosition: { x: number; y: number; z: number };
    isGrabbing: boolean;
  };
}

const CADEditor: React.FC<CADEditorProps> = ({ isActive, gestureData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const selectedObjectRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current || !isActive) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Set up camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Set up renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controlsRef.current = controls;

    // Add some basic shapes
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Animation loop
    const animate = () => {
      if (!isActive) return;

      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (cameraRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }

      if (rendererRef.current) {
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [isActive]);

  // Handle gesture data updates
  useEffect(() => {
    if (!gestureData || !isActive) return;

    // Update selected object position based on hand position
    if (selectedObjectRef.current && gestureData.isGrabbing) {
      const scaleFactor = 0.01; // Adjust this value to control sensitivity
      selectedObjectRef.current.position.set(
        gestureData.handPosition.x * scaleFactor,
        gestureData.handPosition.y * scaleFactor,
        gestureData.handPosition.z * scaleFactor
      );
    }
  }, [gestureData, isActive]);

  return <div ref={containerRef} className="cad-editor-container" />;
};

export default CADEditor; 