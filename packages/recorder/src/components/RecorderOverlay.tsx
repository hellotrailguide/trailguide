import type { UseRecorderReturn } from '../hooks/useRecorder';
import { StepForm } from './StepForm';

interface RecorderOverlayProps {
  recorder: UseRecorderReturn;
}

export function RecorderOverlay({ recorder }: RecorderOverlayProps) {
  const {
    isRecording,
    steps,
    pendingStep,
    toggleRecording,
    removeStep,
    confirmPendingStep,
    cancelPendingStep,
    downloadTrail,
    clearSteps,
  } = recorder;

  return (
    <div
      data-recorder-ui
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 10000,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Step Form Modal */}
      {pendingStep && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
          }}
          onClick={e => {
            if (e.target === e.currentTarget) cancelPendingStep();
          }}
        >
          <div style={{ width: '360px' }}>
            <StepForm
              pendingStep={pendingStep}
              onConfirm={confirmPendingStep}
              onCancel={cancelPendingStep}
            />
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          width: '300px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            background: isRecording ? '#fef2f2' : '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isRecording ? '#ef4444' : '#9ca3af',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
              }}
            />
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
              Trailguide Recorder
            </span>
          </div>
          <button
            onClick={toggleRecording}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '6px',
              background: isRecording ? '#ef4444' : '#3b82f6',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {isRecording ? 'Stop' : 'Record'}
          </button>
        </div>

        {/* Steps List */}
        <div
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {steps.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '13px',
              }}
            >
              {isRecording
                ? 'Click on elements to capture steps'
                : 'Click "Record" to start capturing'}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#374151',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {step.title}
                    </div>
                    <code
                      style={{
                        fontSize: '10px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                      }}
                    >
                      {step.target}
                    </code>
                  </div>
                  <button
                    onClick={() => removeStep(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '16px',
                      lineHeight: 1,
                    }}
                    aria-label="Remove step"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {steps.length > 0 && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              gap: '8px',
            }}
          >
            <button
              onClick={clearSteps}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              onClick={() => downloadTrail()}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '12px',
                border: 'none',
                borderRadius: '6px',
                background: '#10b981',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Export JSON
            </button>
          </div>
        )}
      </div>

      {/* Pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}
