import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface VoiceControlButtonProps {
  onNavigateNext?: () => void;
  onNavigateBack?: () => void;
  onNavigateToTitle?: (title: string) => void;
  availableTitles?: string[];
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
}

export const VoiceControlButton: React.FC<VoiceControlButtonProps> = ({
  isListening,
  startListening,
  stopListening,
  isSupported,
  error
}) => {
  const { fontFamily, setFontFamily } = useTheme();

  if (!isSupported) {
    console.log('Voice navigation is not supported');
    return null;
  }

  console.log('Voice control state:', { isListening, isSupported, error });

  return (
    <div style={{ fontFamily }}>
      <button
        type="button"
        onClick={() => isListening ? stopListening() : startListening()}
        style={{
          padding: '10px 20px',
          borderRadius: '20px',
          border: 'none',
          backgroundColor: isListening ? '#ff4444' : '#4CAF50',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span role="img" aria-label="microphone">
          {isListening ? '🔴' : '🎤'}
        </span>
        {isListening ? 'Stop Voice Control' : 'Start Voice Control'}
      </button>
      {error && <div style={{ color: 'red', fontSize: '12px' }}>{error}</div>}
    </div>
  );
}; 