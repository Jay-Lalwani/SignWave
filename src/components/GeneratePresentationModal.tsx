import React, { useState } from 'react';

type Props = {
  onGenerate: (prompt: string) => Promise<void>;
  onClose: () => void;
};

type LoadingState = 'idle' | 'generating-workflow' | 'generating-images';

const GeneratePresentationModal: React.FC<Props> = ({ onGenerate, onClose }) => {
  const [prompt, setPrompt] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');

  const handleGenerate = async () => {
    try {
      setLoadingState('generating-workflow');
      await new Promise(resolve => setTimeout(resolve, 100)); // Let the UI update
      await onGenerate(prompt);
    } finally {
      setLoadingState('idle');
    }
  };

  const LoadingOverlay = () => (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(255,255,255,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px',
        }} />
        <p style={{ color: '#333', fontWeight: 'bold' }}>
          {loadingState === 'generating-workflow' ? 'Generating Presentation Workflow...' : 'Generating Images...'}
        </p>
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "400px",
          position: "relative",
        }}
      >
        <h3>Generate Presentation</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Topic..."
          style={{ width: "100%", height: "100px", marginBottom: "10px" }}
          disabled={loadingState !== 'idle'}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} disabled={loadingState !== 'idle'}>Cancel</button>
          <button onClick={handleGenerate} disabled={loadingState !== 'idle'}>Generate</button>
        </div>
        {loadingState !== 'idle' && <LoadingOverlay />}
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default GeneratePresentationModal;
