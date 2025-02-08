import { GestureType } from '../types/gestures';

export const CALIBRATION_GESTURES: GestureType[] = [
  'Thumb_Up',
  'Thumb_Down',
  'Open_Palm',
  'Closed_Fist',
  'Victory',
  'Pointing_Up'
];

export const SAMPLES_NEEDED = 10;
export const DEFAULT_GESTURE_THRESHOLD = 0.7; // 70% confidence threshold

export const GESTURE_LABELS: Record<GestureType, string> = {
  Thumb_Up: '👍 Thumb Up',
  Thumb_Down: '👎 Thumb Down',
  Open_Palm: '✋ Open Palm',
  Closed_Fist: '✊ Closed Fist',
  Victory: '✌️ Victory',
  Pointing_Up: '☝️ Pointing Up'
}; 