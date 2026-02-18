import { theme } from '@trailguide/core';
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
            background: theme.shadowOverlay,
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
          background: theme.bgBase,
          borderRadius: '12px',
          boxShadow: theme.shadowMedium,
          border: `1px solid ${theme.borderPanel}`,
          overflow: 'hidden',
          width: '300px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            background: isRecording ? theme.errorLight : theme.bgCard,
            borderBottom: `1px solid ${theme.borderSubtle}`,
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
                background: isRecording ? theme.error : theme.disabled,
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
              }}
            />
            <span style={{ fontWeight: 600, fontSize: '14px', color: theme.textPrimary }}>
              Trail Recording
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
              background: isRecording ? theme.error : theme.accent,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            {isRecording ? 'Pause' : 'Record'}
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
                color: theme.textMuted,
                fontSize: '13px',
              }}
            >
              {isRecording
                ? 'Click any element to add it to the trail'
                : 'Click "Record" to start'}
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  style={{
                    padding: '10px 16px',
                    borderBottom: `1px solid ${theme.borderSubtle}`,
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
                      background: theme.borderControl,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: theme.textTertiary,
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
                        color: theme.textPrimary,
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
                        color: theme.textMuted,
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
                      color: theme.textFaint,
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
              borderTop: `1px solid ${theme.borderSubtle}`,
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
                border: `1px solid ${theme.borderControl}`,
                borderRadius: '6px',
                background: theme.bgGlass,
                color: theme.textSecondary,
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
                background: theme.success,
                color: 'white',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Save Trail
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
