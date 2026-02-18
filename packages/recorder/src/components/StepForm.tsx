import { useState } from 'react';
import type { Placement } from '@trailguide/core';
import { theme } from '@trailguide/core';
import type { PendingStep } from '../hooks/useRecorder';

interface StepFormProps {
  pendingStep: PendingStep;
  onConfirm: (details: { title: string; content: string; placement: Placement }) => void;
  onCancel: () => void;
}

const placements: Placement[] = ['top', 'bottom', 'left', 'right'];

export function StepForm({ pendingStep, onConfirm, onCancel }: StepFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [placement, setPlacement] = useState<Placement>('bottom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onConfirm({ title, content, placement });
    setTitle('');
    setContent('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      data-recorder-ui
      style={{
        background: theme.bgBase,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: theme.shadowMedium,
        border: `1px solid ${theme.borderPanel}`,
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: theme.textPrimary }}>
        Add Step to Trail
      </h3>

      <div style={{ marginBottom: '14px' }}>
        <label
          htmlFor="step-title"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '6px',
            color: theme.textTertiary,
          }}
        >
          What should the user do?
        </label>
        <input
          id="step-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Click New Project"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${theme.borderControl}`,
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
            background: theme.bgInput,
            color: theme.textPrimary,
          }}
          autoFocus
        />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label
          htmlFor="step-content"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '6px',
            color: theme.textTertiary,
          }}
        >
          What should they know?
        </label>
        <textarea
          id="step-content"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="This starts a new project from scratch."
          rows={2}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${theme.borderControl}`,
            borderRadius: '6px',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box',
            background: theme.bgInput,
            color: theme.textPrimary,
          }}
        />
      </div>

      <div style={{ marginBottom: '14px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '6px',
            color: theme.textTertiary,
          }}
        >
          Tooltip position
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {placements.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPlacement(p)}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '13px',
                border: placement === p ? `2px solid ${theme.accent}` : `1px solid ${theme.borderControl}`,
                borderRadius: '6px',
                background: placement === p ? theme.accentBg : theme.bgGlass,
                color: placement === p ? theme.accent : theme.textTertiary,
                cursor: 'pointer',
                fontWeight: placement === p ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Selector - collapsed by default */}
      <details style={{ marginBottom: '16px' }}>
        <summary
          style={{
            fontSize: '12px',
            color: theme.textMuted,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          Advanced: element selector
        </summary>
        <code
          style={{
            display: 'block',
            marginTop: '8px',
            padding: '8px',
            background: theme.bgGlass,
            borderRadius: '4px',
            fontSize: '11px',
            wordBreak: 'break-all',
            color: theme.textTertiary,
          }}
        >
          {pendingStep.selector}
        </code>
      </details>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            border: `1px solid ${theme.borderControl}`,
            borderRadius: '6px',
            background: theme.bgGlass,
            color: theme.textSecondary,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            border: 'none',
            borderRadius: '6px',
            background: title.trim() ? theme.accent : theme.disabledBg,
            color: 'white',
            cursor: title.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 500,
          }}
        >
          Add to Trail
        </button>
      </div>
    </form>
  );
}
