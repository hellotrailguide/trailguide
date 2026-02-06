import { useState } from 'react';
import type { Placement } from '@trailguide/runtime';
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
        background: 'white',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#374151',
          }}
        >
          Selector
        </label>
        <code
          style={{
            display: 'block',
            padding: '8px',
            background: '#f3f4f6',
            borderRadius: '4px',
            fontSize: '12px',
            wordBreak: 'break-all',
            color: '#1f2937',
          }}
        >
          {pendingStep.selector}
        </code>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label
          htmlFor="step-title"
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#374151',
          }}
        >
          Title *
        </label>
        <input
          id="step-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Click the Create button"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
          autoFocus
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label
          htmlFor="step-content"
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#374151',
          }}
        >
          Content
        </label>
        <textarea
          id="step-content"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Describe what the user should do..."
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '4px',
            color: '#374151',
          }}
        >
          Placement
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {placements.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPlacement(p)}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                border: placement === p ? '2px solid #3b82f6' : '1px solid #d1d5db',
                borderRadius: '6px',
                background: placement === p ? '#eff6ff' : 'white',
                color: placement === p ? '#1d4ed8' : '#374151',
                cursor: 'pointer',
                fontWeight: placement === p ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            border: 'none',
            borderRadius: '6px',
            background: title.trim() ? '#3b82f6' : '#9ca3af',
            color: 'white',
            cursor: title.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 500,
          }}
        >
          Add Step
        </button>
      </div>
    </form>
  );
}
