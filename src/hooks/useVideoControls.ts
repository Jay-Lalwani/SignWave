import { useRef } from 'react';

const SCRUB_AMOUNT = 5; // seconds
const PLAY_PAUSE_DELAY = 1000; // 1 second

export const useVideoControls = () => {
  const lastPlayPauseTime = useRef<number>(0);

  const handlePlayPause = (videoElement: HTMLVideoElement) => {
    const now = Date.now();
    if (now - lastPlayPauseTime.current >= PLAY_PAUSE_DELAY) {
      if (videoElement.paused) {
        videoElement.play();
      } else {
        videoElement.pause();
      }
      lastPlayPauseTime.current = now;
    }
  };

  const handleScrubForward = (videoElement: HTMLVideoElement) => {
    videoElement.currentTime = Math.min(
      videoElement.currentTime + SCRUB_AMOUNT,
      videoElement.duration
    );
  };

  const handleScrubBackward = (videoElement: HTMLVideoElement) => {
    videoElement.currentTime = Math.max(
      videoElement.currentTime - SCRUB_AMOUNT,
      0
    );
  };

  return {
    handlePlayPause,
    handleScrubForward,
    handleScrubBackward
  };
}; 