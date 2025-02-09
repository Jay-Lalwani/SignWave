import { Application } from '@splinetool/runtime';

declare module '@splinetool/react-spline' {
  interface SplineProps {
    scene: string;
    onLoad?: (app: Application) => void;
  }
}

declare module '@splinetool/runtime' {
  interface Application {
    getAllObjects(): SPEObject[];
    setZoom(zoom: number): void;
  }
}

export interface SPEObject {
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  // Add other properties as needed
} 