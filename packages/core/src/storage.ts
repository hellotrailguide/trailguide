const PREFIX = 'trailguide:';

function completionKey(id: string): string {
  return `${PREFIX}completed:${id}`;
}

function progressKey(id: string): string {
  return `${PREFIX}progress:${id}`;
}

function store(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * Utilities for persisting tour state across page loads.
 * Used internally by useTrailManager and available for custom integrations.
 */
export const tourStorage = {
  /** Returns true if the user has completed or skipped this tour */
  hasCompleted(trailId: string): boolean {
    return store()?.getItem(completionKey(trailId)) === 'true';
  },

  /** Marks the tour as completed so it won't auto-show again */
  markCompleted(trailId: string): void {
    store()?.setItem(completionKey(trailId), 'true');
  },

  /** Returns the last step index the user reached, or null if no progress saved */
  getProgress(trailId: string): number | null {
    const val = store()?.getItem(progressKey(trailId));
    if (val == null) return null;
    const n = parseInt(val, 10);
    return isNaN(n) ? null : n;
  },

  /** Saves the user's current step so they can resume later */
  saveProgress(trailId: string, stepIndex: number): void {
    store()?.setItem(progressKey(trailId), String(stepIndex));
  },

  /** Clears saved progress (but keeps the completion flag) */
  clearProgress(trailId: string): void {
    store()?.removeItem(progressKey(trailId));
  },

  /** Clears both completion and progress state for this tour */
  reset(trailId: string): void {
    const s = store();
    s?.removeItem(completionKey(trailId));
    s?.removeItem(progressKey(trailId));
  },

  /** Clears all Trailguide state from localStorage */
  resetAll(): void {
    const s = store();
    if (!s) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (key?.startsWith(PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach(key => s.removeItem(key));
  },
};
