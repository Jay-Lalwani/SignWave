// src/components/WorkflowEditor/NodeForm.tsx

import React from 'react';
import { Node } from 'reactflow';
import { SlideNodeData } from './WorkflowEditor';
import { AVAILABLE_GESTURES } from './WorkflowEditor';

interface NodeFormProps {
  node: Node<SlideNodeData>;
  nodeForm: SlideNodeData;
  onNodeFormChange: (updates: Partial<SlideNodeData>) => void;
  onClose: () => void;
  onDelete: () => void;
}

const NodeForm: React.FC<NodeFormProps> = ({
  node,
  nodeForm,
  onNodeFormChange,
  onClose,
  onDelete
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '300px',
        height: '100%',
        background: 'white',
        boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer'
        }}
      >
        ×
      </button>
      <h3 style={{ marginTop: 0 }}>Edit Node</h3>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Label:</label>
        <input
          type="text"
          value={nodeForm.label}
          onChange={(e) => onNodeFormChange({ label: e.target.value })}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* Text node content */}
      {nodeForm.type === 'text' && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Content:</label>
          <textarea
            value={nodeForm.content || ''}
            onChange={(e) => onNodeFormChange({ content: e.target.value })}
            style={{
              width: '100%',
              height: '200px',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {/* Image node content */}
      {nodeForm.type === 'image' && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Image URL:</label>
          <input
            type="text"
            value={nodeForm.url || ''}
            onChange={(e) => onNodeFormChange({ url: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          {nodeForm.url && (
            <img
              src={nodeForm.url}
              alt="Preview"
              style={{
                width: '100%',
                height: 'auto',
                marginTop: '10px',
                borderRadius: '4px'
              }}
            />
          )}
        </div>
      )}

      {/* Video node content */}
      {nodeForm.type === 'video' && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Video URL:</label>
          <input
            type="text"
            value={nodeForm.videoUrl || ''}
            onChange={(e) => onNodeFormChange({ videoUrl: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          {nodeForm.videoUrl && (
            <video
              src={nodeForm.videoUrl}
              controls
              style={{
                width: '100%',
                marginTop: '10px',
                borderRadius: '4px'
              }}
            />
          )}
          <div style={{ marginTop: '10px' }}>
            <label
              style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={nodeForm.autoplay || false}
                onChange={(e) => onNodeFormChange({ autoplay: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Autoplay
            </label>
            <label
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={nodeForm.loop || false}
                onChange={(e) => onNodeFormChange({ loop: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              Loop video
            </label>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '10px' }}>Video Control Gestures</h4>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Play/Pause Gesture:</label>
              <select
                value={nodeForm.playPauseGesture || ''}
                onChange={(e) => onNodeFormChange({ playPauseGesture: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a gesture...</option>
                {AVAILABLE_GESTURES.map((gesture) => (
                  <option key={gesture} value={gesture}>
                    {gesture.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Scrub Forward Gesture:</label>
              <select
                value={nodeForm.scrubForwardGesture || ''}
                onChange={(e) => onNodeFormChange({ scrubForwardGesture: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a gesture...</option>
                {AVAILABLE_GESTURES.map((gesture) => (
                  <option key={gesture} value={gesture}>
                    {gesture.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Scrub Backward Gesture:</label>
              <select
                value={nodeForm.scrubBackwardGesture || ''}
                onChange={(e) => onNodeFormChange({ scrubBackwardGesture: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a gesture...</option>
                {AVAILABLE_GESTURES.map((gesture) => (
                  <option key={gesture} value={gesture}>
                    {gesture.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* API node content */}
      {nodeForm.type === 'api' && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>API Endpoint:</label>
            <input
              type="text"
              value={nodeForm.apiEndpoint || ''}
              onChange={(e) => onNodeFormChange({ apiEndpoint: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Method:</label>
            <select
              value={nodeForm.apiMethod || 'GET'}
              onChange={(e) => onNodeFormChange({ apiMethod: e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE' })}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Payload (JSON):</label>
            <textarea
              value={nodeForm.apiPayload || ''}
              onChange={(e) => onNodeFormChange({ apiPayload: e.target.value })}
              style={{
                width: '100%',
                height: '150px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>
        </>
      )}

      {/* Zoom configuration */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Zoom Point:</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            placeholder="X %"
            value={nodeForm.zoomPoint?.x || ''}
            onChange={(e) =>
              onNodeFormChange({
                zoomPoint: {
                  x: Number(e.target.value),
                  y: nodeForm.zoomPoint?.y || 50
                }
              })
            }
            style={{
              width: '50%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <input
            type="number"
            placeholder="Y %"
            value={nodeForm.zoomPoint?.y || ''}
            onChange={(e) =>
              onNodeFormChange({
                zoomPoint: {
                  x: nodeForm.zoomPoint?.x || 50,
                  y: Number(e.target.value)
                }
              })
            }
            style={{
              width: '50%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div style={{ fontSize: '0.8em', color: '#666', marginTop: '5px' }}>
          Enter values between 0-100 to set the zoom center point
        </div>

        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Zoom In Gesture:</label>
          <select
            value={nodeForm.zoomInGesture || ''}
            onChange={(e) => onNodeFormChange({ zoomInGesture: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="">Select a gesture...</option>
            {AVAILABLE_GESTURES.map((gesture) => (
              <option key={gesture} value={gesture}>
                {gesture.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Zoom Out Gesture:</label>
          <select
            value={nodeForm.zoomOutGesture || ''}
            onChange={(e) => onNodeFormChange({ zoomOutGesture: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="">Select a gesture...</option>
            {AVAILABLE_GESTURES.map((gesture) => (
              <option key={gesture} value={gesture}>
                {gesture.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onDelete}
        style={{
          padding: '8px 16px',
          background: '#ff0072',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        Delete Node
      </button>
    </div>
  );
};

export default NodeForm;
