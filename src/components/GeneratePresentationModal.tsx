import React, { useState } from 'react';

type Props = {
  onGenerate: (prompt: string) => void;
  onClose: () => void;
};

const GeneratePresentationModal: React.FC<Props> = ({ onGenerate, onClose }) => {
  const [prompt, setPrompt] = useState("");

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
        }}
      >
        <h3>Generate Presentation</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Topic..."
          style={{ width: "100%", height: "100px", marginBottom: "10px" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onGenerate(prompt)}>Generate</button>
        </div>
      </div>
    </div>
  );
};

export default GeneratePresentationModal;
