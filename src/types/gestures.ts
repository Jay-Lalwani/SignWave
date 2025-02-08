export type GestureType = 'Thumb_Up' | 'Thumb_Down' | 'Open_Palm' | 'Closed_Fist' | 'Victory' | 'Pointing_Up';

export interface GestureResult {
  gesture: GestureType;
  confidence: number;
  timestamp?: number; // Optional timestamp for gesture detection
}

export interface GestureThresholds {
  [key: string]: number;
}

export interface CalibrationData {
  gesture: GestureType;
  samples: number[];
} 