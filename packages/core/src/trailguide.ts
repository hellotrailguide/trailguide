import { computePosition, offset, flip, shift, arrow } from '@floating-ui/dom';
import type { Trail, Step, TrailguideOptions, Placement, FeedbackConfig } from './types';
import { findElement, scrollToElement, createElement, escapeHtml } from './dom';
import { sendEvent } from './analytics';
import { activeTrailSession } from './storage';

export class Trailguide {
  private trail: Trail | null = null;
  private currentStepIndex = 0;
  private isActive = false;
  private options: TrailguideOptions = {};

  // DOM elements
  private overlay: HTMLElement | null = null;
  private tooltip: HTMLElement | null = null;
  private arrowEl: HTMLElement | null = null;

  // Cleanup functions
  private cleanupFns: (() => void)[] = [];
  private stepCleanupFns: (() => void)[] = [];
  private instanceId = `trailguide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Bug fix: cancel pending step transition timers to prevent stale callbacks
  private stepTimerId: ReturnType<typeof setTimeout> | null = null;

  constructor(options: TrailguideOptions = {}) {
    this.options = options;
  }

  start(trail: Trail, startAtIndex = 0): void {
    if (trail.mode === 'test') return;
    this.trail = trail;
    this.currentStepIndex = startAtIndex;
    this.isActive = true;
    activeTrailSession.save(trail, startAtIndex);
    this.createOverlay();
    this.showStep();
    this.bindKeyboard();
    this.emitAnalytics('trail_started');
  }

  stop(): void {
    activeTrailSession.clear();
    if (this.isActive) {
      this.emitAnalytics('trail_abandoned');
      this.isActive = false;
      this.cleanup();
      this.options.onAbandoned?.();
    } else {
      this.cleanup();
    }
  }

  next(): void {
    if (!this.trail || !this.isActive) return;

    this.emitAnalytics('step_completed');

    if (this.currentStepIndex < this.trail.steps.length - 1) {
      this.currentStepIndex++;
      activeTrailSession.update(this.currentStepIndex);
      this.showStep();
    } else {
      this.complete();
    }
  }

  prev(): void {
    if (!this.trail || !this.isActive) return;

    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      activeTrailSession.update(this.currentStepIndex);
      this.showStep();
    }
  }

  skip(): void {
    activeTrailSession.clear();
    this.emitAnalytics('trail_skipped');
    this.isActive = false;
    this.cleanup();
    this.options.onSkip?.();
  }

  goToStep(index: number): void {
    if (!this.trail || !this.isActive) return;
    if (index >= 0 && index < this.trail.steps.length) {
      this.currentStepIndex = index;
      activeTrailSession.update(index);
      this.showStep();
    }
  }

  private complete(): void {
    activeTrailSession.clear();
    this.emitAnalytics('trail_completed');
    this.isActive = false;
    this.cleanup();
    this.options.onComplete?.();
  }

  /** Waits up to `timeout`ms for an element matching `selector` to appear in the DOM */
  private waitForElement(selector: string, timeout = 3000): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      const el = findElement(selector);
      if (el) { resolve(el); return; }

      let settled = false;
      const finish = (result: HTMLElement | null) => {
        if (settled) return;
        settled = true;
        observer.disconnect();
        resolve(result);
      };

      const observer = new MutationObserver(() => {
        const found = findElement(selector);
        if (found) finish(found);
      });

      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      setTimeout(() => finish(findElement(selector)), timeout);
    });
  }

  private createOverlay(): void {
    this.overlay = createElement('div', 'trailguide-overlay');
    document.body.appendChild(this.overlay);

    const spotlight = createElement('div', 'trailguide-spotlight', this.overlay);
    const maskId = `${this.instanceId}-mask`;
    spotlight.innerHTML = `
      <svg width="100%" height="100%">
        <defs>
          <mask id="${maskId}">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect class="trailguide-cutout" rx="4" fill="black" />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" mask="url(#${maskId})" />
      </svg>
    `;

    createElement('div', 'trailguide-highlight', this.overlay);

    this.tooltip = createElement('div', this.options.theme === 'dark' ? 'trailguide-tooltip dark' : 'trailguide-tooltip');
    this.tooltip.innerHTML = `
      <div class="trailguide-tooltip-content">
        <div class="trailguide-tooltip-header">
          <h3 class="trailguide-tooltip-title"></h3>
          <button class="trailguide-tooltip-close" aria-label="Skip tour">&times;</button>
        </div>
        <div class="trailguide-tooltip-body"></div>
        <div class="trailguide-tooltip-footer">
          <span class="trailguide-tooltip-progress"></span>
          <div class="trailguide-tooltip-nav">
            <button class="trailguide-btn trailguide-btn-secondary trailguide-btn-prev">Back</button>
            <button class="trailguide-btn trailguide-btn-primary trailguide-btn-next">Next</button>
          </div>
        </div>
        <div class="trailguide-tooltip-arrow"></div>
      </div>
    `;
    document.body.appendChild(this.tooltip);

    this.arrowEl = this.tooltip.querySelector('.trailguide-tooltip-arrow');

    this.tooltip.querySelector('.trailguide-tooltip-close')?.addEventListener('click', () => this.skip());
    this.tooltip.querySelector('.trailguide-btn-prev')?.addEventListener('click', () => this.prev());
    this.tooltip.querySelector('.trailguide-btn-next')?.addEventListener('click', () => this.next());
  }

  private showCelebrationStep(step: Step): void {
    if (!this.overlay || !this.tooltip) return;
    this.overlay.style.display = 'none';
    this.tooltip.style.display = 'none';

    const cfg = step.celebration ?? {};
    const emoji = cfg.emoji ?? '🎉';
    const showConfetti = cfg.showConfetti !== false;
    const isLast = this.currentStepIndex === (this.trail?.steps.length ?? 1) - 1;
    const ctaLabel = cfg.ctaLabel ?? (isLast ? 'Done' : 'Next');

    const el = createElement('div', 'trailguide-celebration');
    const card = createElement('div', 'trailguide-celebration-card', el);

    const emojiEl = createElement('p', 'trailguide-celebration-emoji', card);
    emojiEl.textContent = emoji;

    const title = createElement('h3', 'trailguide-celebration-title', card);
    title.textContent = step.title;

    const body = createElement('p', 'trailguide-celebration-body', card);
    body.textContent = step.content;

    const btn = createElement('button', 'trailguide-btn trailguide-btn-primary', card) as HTMLButtonElement;
    btn.textContent = ctaLabel;
    btn.addEventListener('click', () => this.next());

    if (showConfetti) {
      const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b', '#cc5de8', '#f06595'];
      for (let i = 0; i < 28; i++) {
        const p = createElement('div', 'trailguide-confetti-particle', card);
        p.style.left = `${Math.random() * 100}%`;
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.animationDelay = `${Math.random() * 0.6}s`;
        p.style.animationDuration = `${1.4 + Math.random() * 1.2}s`;
        p.style.width = `${6 + Math.random() * 7}px`;
        p.style.height = `${6 + Math.random() * 7}px`;
        if (Math.random() > 0.5) p.style.borderRadius = '50%';
      }
    }

    document.body.appendChild(el);
    this.stepCleanupFns.push(() => {
      el.remove();
      if (this.overlay) this.overlay.style.display = '';
      if (this.tooltip) this.tooltip.style.display = '';
    });
  }

  private showFeedbackStep(step: Step): void {
    if (!this.overlay || !this.tooltip) return;
    this.overlay.style.display = 'none';
    this.tooltip.style.display = 'none';

    const cfg: FeedbackConfig = step.feedback ?? { type: 'stars' };
    const question = cfg.question ?? 'How would you rate your experience?';
    const isLast = this.currentStepIndex === (this.trail?.steps.length ?? 1) - 1;
    const ctaLabel = cfg.ctaLabel ?? (isLast ? 'Submit' : 'Submit & Continue');

    let selectedRating: number | null = null;
    let commentText = '';

    const el = createElement('div', 'trailguide-feedback');
    const card = createElement('div', 'trailguide-feedback-card', el);

    const q = createElement('p', 'trailguide-feedback-question', card);
    q.textContent = question;

    // Rating widget
    if (cfg.type === 'stars') {
      const row = createElement('div', 'trailguide-star-row', card);
      const stars: HTMLElement[] = [];
      for (let i = 1; i <= 5; i++) {
        const star = createElement('button', 'trailguide-star', row) as HTMLButtonElement;
        star.textContent = '★';
        star.dataset.val = String(i);
        stars.push(star);
        star.addEventListener('click', () => {
          selectedRating = i;
          stars.forEach((s, idx) => s.classList.toggle('active', idx < i));
        });
        star.addEventListener('mouseover', () => {
          stars.forEach((s, idx) => s.classList.toggle('active', idx < i));
        });
      }
      row.addEventListener('mouseleave', () => {
        const r = selectedRating ?? 0;
        stars.forEach((s, idx) => s.classList.toggle('active', idx < r));
      });
    } else if (cfg.type === 'thumbs') {
      const row = createElement('div', 'trailguide-thumbs-row', card);
      const up = createElement('button', 'trailguide-thumb', row) as HTMLButtonElement;
      up.textContent = '👍';
      const down = createElement('button', 'trailguide-thumb', row) as HTMLButtonElement;
      down.textContent = '👎';
      up.addEventListener('click', () => { selectedRating = 1; up.classList.add('active'); down.classList.remove('active'); });
      down.addEventListener('click', () => { selectedRating = 0; down.classList.add('active'); up.classList.remove('active'); });
    } else {
      // NPS 0-10
      const row = createElement('div', 'trailguide-nps-row', card);
      for (let i = 0; i <= 10; i++) {
        const btn = createElement('button', 'trailguide-nps-btn', row) as HTMLButtonElement;
        btn.textContent = String(i);
        btn.addEventListener('click', () => {
          selectedRating = i;
          row.querySelectorAll('.trailguide-nps-btn').forEach((b, idx) => b.classList.toggle('active', idx === i));
        });
      }
    }

    // Optional comment
    if (cfg.allowComment) {
      const textarea = createElement('textarea', 'trailguide-feedback-comment', card) as HTMLTextAreaElement;
      textarea.placeholder = cfg.commentPlaceholder ?? 'Any other thoughts? (optional)';
      textarea.addEventListener('input', () => { commentText = textarea.value; });
    }

    const footer = createElement('div', 'trailguide-feedback-footer', card);
    const submitBtn = createElement('button', 'trailguide-btn trailguide-btn-primary', footer) as HTMLButtonElement;
    submitBtn.textContent = ctaLabel;
    submitBtn.addEventListener('click', async () => {
      if (cfg.webhook && selectedRating !== null) {
        try {
          await fetch(cfg.webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rating: selectedRating,
              comment: commentText || undefined,
              trailId: this.trail?.id,
              stepId: step.id,
            }),
          });
        } catch {
          // Non-blocking — proceed regardless
        }
      }
      this.next();
    });

    document.body.appendChild(el);
    this.stepCleanupFns.push(() => {
      el.remove();
      if (this.overlay) this.overlay.style.display = '';
      if (this.tooltip) this.tooltip.style.display = '';
    });
  }

  private showStep(): void {
    if (!this.trail || !this.overlay || !this.tooltip) return;

    // Cancel any pending transition from a previous showStep call
    if (this.stepTimerId !== null) {
      clearTimeout(this.stepTimerId);
      this.stepTimerId = null;
    }

    // Clean up per-step listeners from previous step
    this.stepCleanupFns.forEach(fn => fn());
    this.stepCleanupFns = [];

    // Reset any error state styles
    this.tooltip.style.transform = '';
    const spotlight = this.overlay.querySelector<HTMLElement>('.trailguide-spotlight');
    const highlight = this.overlay.querySelector<HTMLElement>('.trailguide-highlight');
    if (spotlight) spotlight.style.display = '';
    if (highlight) highlight.style.display = '';

    const step = this.trail.steps[this.currentStepIndex];
    if (!step) return;

    this.emitAnalytics('step_viewed');

    if (step.stepType === 'celebration') { this.showCelebrationStep(step); return; }
    if (step.stepType === 'feedback') { this.showFeedbackStep(step); return; }

    // If the step has a URL and we're on the wrong page, prompt navigation
    if (step.url) {
      const stepPath = new URL(step.url, window.location.origin).pathname;
      if (window.location.pathname !== stepPath) {
        this.showNavigateState(step);
        return;
      }
    }

    // Fast path: element is already in the DOM
    const immediateTarget = findElement(step.target);
    if (immediateTarget) {
      scrollToElement(immediateTarget);
      this.stepTimerId = setTimeout(() => {
        this.stepTimerId = null;
        if (!this.isActive) return;
        this.updateSpotlight(immediateTarget);
        this.updateTooltip(step, immediateTarget);
        this.options.onStepChange?.(step, this.currentStepIndex);
      }, 100);
      return;
    }

    // Element not immediately in DOM
    if (step.optional) {
      if (this.currentStepIndex < this.trail.steps.length - 1) {
        this.currentStepIndex++;
        activeTrailSession.update(this.currentStepIndex);
        this.showStep();
      } else {
        this.complete();
      }
      return;
    }

    // Show error immediately so there's no blank delay
    this.options.onError?.(step, 'element_not_found');
    console.warn(`[Trailguide] Target not found: ${step.target}`);
    this.showErrorState(step);

    // Also wait in background — if element appears (SPA lazy load), auto-recover
    this.waitForElement(step.target).then(target => {
      if (!this.isActive || !target) return;
      // Element appeared — clear error state and show the step properly
      if (this.tooltip) this.tooltip.style.transform = '';
      if (spotlight) spotlight.style.display = '';
      if (highlight) highlight.style.display = '';
      scrollToElement(target);
      this.stepTimerId = setTimeout(() => {
        this.stepTimerId = null;
        if (!this.isActive) return;
        this.updateSpotlight(target);
        this.updateTooltip(step, target);
        this.options.onStepChange?.(step, this.currentStepIndex);
      }, 100);
    });
  }

  private showErrorState(step: Step): void {
    if (!this.tooltip || !this.trail) return;

    const spotlight = this.overlay?.querySelector<HTMLElement>('.trailguide-spotlight');
    const highlight = this.overlay?.querySelector<HTMLElement>('.trailguide-highlight');
    if (spotlight) spotlight.style.display = 'none';
    if (highlight) highlight.style.display = 'none';

    const title = this.tooltip.querySelector('.trailguide-tooltip-title');
    const body = this.tooltip.querySelector('.trailguide-tooltip-body');
    const progress = this.tooltip.querySelector('.trailguide-tooltip-progress');
    const prevBtn = this.tooltip.querySelector<HTMLElement>('.trailguide-btn-prev');
    const nextBtn = this.tooltip.querySelector('.trailguide-btn-next');

    const isFirst = this.currentStepIndex === 0;
    const isLast = this.currentStepIndex === this.trail.steps.length - 1;

    if (title) title.textContent = 'Element Not Found';
    if (body) {
      body.innerHTML = `
        <p style="color: #ef4444; margin: 0 0 8px 0;">Could not find: <code style="background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${escapeHtml(step.target)}</code></p>
        <p style="margin: 0; font-size: 13px; color: #6b7280;">The target element doesn't exist on this page. Press <kbd style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 11px;">Esc</kbd> to close or skip to the next step.</p>
      `;
    }
    if (progress) progress.textContent = `${this.currentStepIndex + 1} of ${this.trail.steps.length}`;
    if (prevBtn) prevBtn.style.display = isFirst ? 'none' : 'block';
    if (nextBtn) nextBtn.textContent = isLast ? 'Close' : 'Skip Step';

    this.tooltip.style.left = '50%';
    this.tooltip.style.top = '50%';
    this.tooltip.style.transform = 'translate(-50%, -50%)';
  }

  private showNavigateState(step: Step): void {
    if (!this.tooltip || !this.trail) return;

    const spotlight = this.overlay?.querySelector<HTMLElement>('.trailguide-spotlight');
    const highlight = this.overlay?.querySelector<HTMLElement>('.trailguide-highlight');
    if (spotlight) spotlight.style.display = 'none';
    if (highlight) highlight.style.display = 'none';

    const title = this.tooltip.querySelector('.trailguide-tooltip-title');
    const body = this.tooltip.querySelector('.trailguide-tooltip-body');
    const progress = this.tooltip.querySelector('.trailguide-tooltip-progress');
    const prevBtn = this.tooltip.querySelector<HTMLElement>('.trailguide-btn-prev');
    const nextBtn = this.tooltip.querySelector<HTMLElement>('.trailguide-btn-next');

    const isFirst = this.currentStepIndex === 0;
    const destination = step.url!;

    if (title) title.textContent = step.title;
    if (body) {
      body.innerHTML = `
        <p style="margin: 0 0 8px 0;">This step is on a different page.</p>
        <p style="margin: 0; font-size: 13px; color: #6b7280;">Navigate to continue the tour.</p>
      `;
    }
    if (progress) progress.textContent = `${this.currentStepIndex + 1} of ${this.trail.steps.length}`;
    if (prevBtn) prevBtn.style.display = isFirst ? 'none' : 'block';
    if (nextBtn) {
      nextBtn.textContent = 'Go There';
      const navHandler = (e: Event) => { e.stopImmediatePropagation(); window.location.href = destination; };
      nextBtn.addEventListener('click', navHandler, true);
      this.stepCleanupFns.push(() => nextBtn.removeEventListener('click', navHandler, true));
    }

    this.tooltip.style.left = '50%';
    this.tooltip.style.top = '50%';
    this.tooltip.style.transform = 'translate(-50%, -50%)';
  }

  private updateSpotlight(target: HTMLElement): void {
    if (!this.overlay) return;

    const rect = target.getBoundingClientRect();
    const padding = 8;

    const cutout = this.overlay.querySelector('.trailguide-cutout');
    if (cutout) {
      cutout.setAttribute('x', String(rect.left - padding));
      cutout.setAttribute('y', String(rect.top - padding));
      cutout.setAttribute('width', String(rect.width + padding * 2));
      cutout.setAttribute('height', String(rect.height + padding * 2));
    }

    const highlight = this.overlay.querySelector<HTMLElement>('.trailguide-highlight');
    if (highlight) {
      highlight.style.top = `${rect.top - padding}px`;
      highlight.style.left = `${rect.left - padding}px`;
      highlight.style.width = `${rect.width + padding * 2}px`;
      highlight.style.height = `${rect.height + padding * 2}px`;
    }

    const updatePosition = () => {
      if (!this.isActive) return;
      const newRect = target.getBoundingClientRect();
      if (cutout) {
        cutout.setAttribute('x', String(newRect.left - padding));
        cutout.setAttribute('y', String(newRect.top - padding));
        cutout.setAttribute('width', String(newRect.width + padding * 2));
        cutout.setAttribute('height', String(newRect.height + padding * 2));
      }
      if (highlight) {
        highlight.style.top = `${newRect.top - padding}px`;
        highlight.style.left = `${newRect.left - padding}px`;
        highlight.style.width = `${newRect.width + padding * 2}px`;
        highlight.style.height = `${newRect.height + padding * 2}px`;
      }
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    this.stepCleanupFns.push(() => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    });
  }

  private async updateTooltip(step: Step, target: HTMLElement): Promise<void> {
    if (!this.tooltip || !this.trail || !this.arrowEl) return;

    const isFirst = this.currentStepIndex === 0;
    const isLast = this.currentStepIndex === this.trail.steps.length - 1;

    const title = this.tooltip.querySelector('.trailguide-tooltip-title');
    const body = this.tooltip.querySelector('.trailguide-tooltip-body');
    const progress = this.tooltip.querySelector('.trailguide-tooltip-progress');
    const prevBtn = this.tooltip.querySelector<HTMLElement>('.trailguide-btn-prev');
    const nextBtn = this.tooltip.querySelector('.trailguide-btn-next');

    if (title) title.textContent = step.title;
    if (body) body.textContent = step.content;
    if (progress) progress.textContent = `${this.currentStepIndex + 1} of ${this.trail.steps.length}`;
    if (prevBtn) prevBtn.style.display = isFirst ? 'none' : 'block';
    if (nextBtn) nextBtn.textContent = isLast ? 'Finish' : 'Next';

    const { x, y, placement, middlewareData } = await computePosition(target, this.tooltip, {
      placement: step.placement as Placement,
      strategy: 'fixed',
      middleware: [
        offset(12),
        flip(),
        shift({ padding: 8 }),
        arrow({ element: this.arrowEl }),
      ],
    });

    // Guard against tour being stopped or stepped away during async computation
    if (!this.tooltip || !this.isActive) return;

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
    this.tooltip.dataset.placement = placement;

    if (middlewareData.arrow && this.arrowEl) {
      const { x: arrowX, y: arrowY } = middlewareData.arrow;
      this.arrowEl.style.left = arrowX != null ? `${arrowX}px` : '';
      this.arrowEl.style.top = arrowY != null ? `${arrowY}px` : '';
    }
  }

  private bindKeyboard(): void {
    const handler = (e: KeyboardEvent) => {
      if (!this.isActive) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          this.next();
          break;
        case 'ArrowLeft':
          this.prev();
          break;
        case 'Escape':
          this.skip();
          break;
      }
    };

    window.addEventListener('keydown', handler);
    this.cleanupFns.push(() => window.removeEventListener('keydown', handler));
  }

  private cleanup(): void {
    // Cancel any pending step transition
    if (this.stepTimerId !== null) {
      clearTimeout(this.stepTimerId);
      this.stepTimerId = null;
    }

    this.stepCleanupFns.forEach(fn => fn());
    this.stepCleanupFns = [];
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];

    this.overlay?.remove();
    this.tooltip?.remove();
    this.overlay = null;
    this.tooltip = null;
    this.arrowEl = null;
  }

  private emitAnalytics(
    eventType: 'trail_started' | 'step_viewed' | 'step_completed' | 'trail_completed' | 'trail_skipped' | 'trail_abandoned'
  ): void {
    if (!this.options.analytics || !this.trail) return;

    const step = this.trail.steps[this.currentStepIndex];
    const trailId = this.options.analytics.trailId || this.trail.id;

    sendEvent(this.options.analytics, {
      event_type: eventType,
      trail_id: trailId,
      step_id: step?.id,
      step_index: this.currentStepIndex,
    });
  }
}

// Static instance for simple API
let defaultInstance: Trailguide | null = null;

export function start(trail: Trail, options?: TrailguideOptions): Trailguide {
  if (defaultInstance) {
    defaultInstance.stop();
  }
  defaultInstance = new Trailguide(options);
  defaultInstance.start(trail);
  return defaultInstance;
}

export function stop(): void {
  defaultInstance?.stop();
  defaultInstance = null;
}

export function next(): void {
  defaultInstance?.next();
}

export function prev(): void {
  defaultInstance?.prev();
}

export function skip(): void {
  defaultInstance?.skip();
  defaultInstance = null;
}

export function resume(options?: TrailguideOptions): Trailguide | null {
  const saved = activeTrailSession.get();
  if (!saved) return null;
  if (defaultInstance) {
    defaultInstance.stop();
  }
  defaultInstance = new Trailguide(options ?? {});
  defaultInstance.start(saved.trail, saved.stepIndex);
  return defaultInstance;
}
