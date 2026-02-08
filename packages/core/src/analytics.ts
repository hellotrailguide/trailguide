import type { AnalyticsConfig } from './types';

export type AnalyticsEventType =
  | 'trail_started'
  | 'step_viewed'
  | 'step_completed'
  | 'trail_completed'
  | 'trail_skipped';

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  trail_id: string;
  user_id: string;
  session_id: string;
  step_id?: string;
  step_index?: number;
  timestamp: string;
}

// Generate unique session ID per page load
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Module-level session ID (one per page load)
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = generateSessionId();
  }
  return sessionId;
}

export type AnalyticsEventPayload = Omit<AnalyticsEvent, 'user_id' | 'session_id' | 'timestamp'>;

// Send event to analytics endpoint
export async function sendEvent(
  config: AnalyticsConfig,
  event: AnalyticsEventPayload
): Promise<void> {
  if (!config.endpoint) return;

  const payload: AnalyticsEvent = {
    ...event,
    user_id: config.userId,
    session_id: getSessionId(),
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (config.debug) {
      console.log('[Trailguide Analytics]', payload);
    }
  } catch (e) {
    if (config.debug) {
      console.error('[Trailguide Analytics] Failed:', e);
    }
  }
}

// Reset session ID (for testing)
export function resetSession(): void {
  sessionId = null;
}
