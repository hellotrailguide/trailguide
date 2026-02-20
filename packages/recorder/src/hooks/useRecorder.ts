import { useState, useCallback, useEffect, useRef } from 'react';
import type { Trail, Step, Placement } from '@trailguide/core';
import { generateSelector, highlightElement } from '../utils/selectorGenerator';

export interface UseRecorderOptions {
  trailId?: string;
  trailTitle?: string;
}

export interface PendingStep {
  selector: string;
  element: HTMLElement;
}

export interface UseRecorderReturn {
  isRecording: boolean;
  steps: Step[];
  pendingStep: PendingStep | null;
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  addStep: (step: Omit<Step, 'id'>) => void;
  removeStep: (index: number) => void;
  updateStep: (index: number, updates: Partial<Step>) => void;
  clearSteps: () => void;
  confirmPendingStep: (details: { title: string; content: string; placement: Placement }) => void;
  cancelPendingStep: () => void;
  exportTrail: () => Trail;
  downloadTrail: (filename?: string) => void;
}

export function useRecorder({
  trailId = 'new-trail',
  trailTitle = 'New Trail',
}: UseRecorderOptions = {}): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [pendingStep, setPendingStep] = useState<PendingStep | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Handle click events while recording
  useEffect(() => {
    if (!isRecording) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Ignore clicks on recorder UI
      if (target.closest('[data-recorder-ui]')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Clean up previous highlight
      cleanupRef.current?.();

      // Generate selector and highlight element
      const selector = generateSelector(target);
      const cleanup = highlightElement(target);
      cleanupRef.current = cleanup;

      setPendingStep({
        selector,
        element: target,
      });
    };

    // Use capture phase to intercept before app handlers
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [isRecording]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setPendingStep(null);
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const addStep = useCallback((step: Omit<Step, 'id'>) => {
    const newStep: Step = {
      ...step,
      id: `step-${Date.now()}`,
    };
    setSteps(prev => [...prev, newStep]);
  }, []);

  const removeStep = useCallback((index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateStep = useCallback((index: number, updates: Partial<Step>) => {
    setSteps(prev =>
      prev.map((step, i) => (i === index ? { ...step, ...updates } : step))
    );
  }, []);

  const clearSteps = useCallback(() => {
    setSteps([]);
  }, []);

  const confirmPendingStep = useCallback(
    (details: { title: string; content: string; placement: Placement }) => {
      if (!pendingStep) return;

      addStep({
        target: pendingStep.selector,
        ...details,
      });

      cleanupRef.current?.();
      cleanupRef.current = null;
      setPendingStep(null);
    },
    [pendingStep, addStep]
  );

  const cancelPendingStep = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setPendingStep(null);
  }, []);

  const exportTrail = useCallback((): Trail => {
    return {
      id: trailId,
      title: trailTitle,
      version: '1.0.0',
      steps,
    };
  }, [trailId, trailTitle, steps]);

  const downloadTrail = useCallback(
    (filename = 'trail.json') => {
      const trail = exportTrail();
      const json = JSON.stringify(trail, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);
    },
    [exportTrail]
  );

  return {
    isRecording,
    steps,
    pendingStep,
    startRecording,
    stopRecording,
    toggleRecording,
    addStep,
    removeStep,
    updateStep,
    clearSteps,
    confirmPendingStep,
    cancelPendingStep,
    exportTrail,
    downloadTrail,
  };
}
