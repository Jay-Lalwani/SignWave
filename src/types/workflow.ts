export type GestureResult = {
  gesture: string;
  confidence: number;
  timestamp: number;
};

export type GestureThresholds = {
  [key: string]: number;
};

export type SlideNodeData = {
  label: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'api';
  url?: string;
  videoUrl?: string;
  autoplay?: boolean;
  loop?: boolean;
  playPauseGesture?: string;
  scrubForwardGesture?: string;
  scrubBackwardGesture?: string;
  apiEndpoint?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiPayload?: string;
  zoomPoint?: { x: number; y: number };
  zoomInGesture?: string;
  zoomOutGesture?: string;
};

export const AVAILABLE_GESTURES = [
  'Thumb_Up',
  'Thumb_Down',
  'Open_Palm',
  'Closed_Fist',
  'Victory',
  'Pointing_Up'
] as const;

export const CALIBRATION_GESTURES = AVAILABLE_GESTURES; 