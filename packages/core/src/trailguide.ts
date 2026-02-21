import { computePosition, offset, flip, shift, arrow } from '@floating-ui/dom';
import type { Trail, Step, TrailguideOptions, Placement } from './types';
import { findElement, isElementVisible, scrollToElement, createElement, escapeHtml } from './dom';
import { sendEvent } from './analytics';

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

  start(trail: Trail): void {
    this.trail = trail;
    this.currentStepIndex = 0;
    this.isActive = true;
    this.createOverlay();
    this.showStep();
    this.bindKeyboard();
    this.emitAnalytics('trail_started');
  }

  stop(): void {
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
      this.showStep();
    } else {
      this.complete();
    }
  }

  prev(): void {
    if (!this.trail || !this.isActive) return;

    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.showStep();
    }
  }

  skip(): void {
    this.emitAnalytics('trail_skipped');
    this.isActive = false;
    this.cleanup();
    this.options.onSkip?.();
  }

  goToStep(index: number): void {
    if (!this.trail || !this.isActive) return;
    if (index >= 0 && index < this.trail.steps.length) {
      this.currentStepIndex = index;
      this.showStep();
    }
  }

  private complete(): void {
    this.emitAnalytics('trail_completed');
    this.isActive = false;
    this.cleanup();
    this.options.onComplete?.();
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

    this.tooltip = createElement('div', 'trailguide-tooltip');
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

    const target = findElement(step.target);
    const notFound = !target;
    const notVisible = target ? !isElementVisible(target) : false;

    if (notFound || notVisible) {
      // Optional steps are silently skipped
      if (step.optional) {
        if (this.currentStepIndex < this.trail.steps.length - 1) {
          this.currentStepIndex++;
          this.showStep();
        } else {
          this.complete();
        }
        return;
      }

      const errorType = notFound ? 'element_not_found' : 'element_not_visible';
      this.options.onError?.(step, errorType);
      console.warn(`[Trailguide] Target not found or not visible: ${step.target}`);
      this.showErrorState(step);
      return;
    }

    scrollToElement(target!);

    this.stepTimerId = setTimeout(() => {
      this.stepTimerId = null;
      if (!this.isActive) return; // Guard: tour may have been stopped during the delay
      this.updateSpotlight(target!);
      this.updateTooltip(step, target!);
      this.options.onStepChange?.(step, this.currentStepIndex);
    }, 100);
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
