import { computePosition, offset, flip, shift, arrow } from '@floating-ui/dom';
import type { Trail, Step, TrailguideOptions, Placement } from './types';
import { findElement, isElementVisible, scrollToElement, createElement } from './dom';

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
  }

  stop(): void {
    this.isActive = false;
    this.cleanup();
  }

  next(): void {
    if (!this.trail || !this.isActive) return;

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
    this.isActive = false;
    this.cleanup();
    this.options.onComplete?.();
  }

  private createOverlay(): void {
    // Main overlay container
    this.overlay = createElement('div', 'trailguide-overlay');
    document.body.appendChild(this.overlay);

    // Spotlight with SVG mask
    const spotlight = createElement('div', 'trailguide-spotlight', this.overlay);
    spotlight.innerHTML = `
      <svg width="100%" height="100%">
        <defs>
          <mask id="trailguide-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect class="trailguide-cutout" rx="4" fill="black" />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#trailguide-mask)" />
      </svg>
    `;

    // Highlight border
    createElement('div', 'trailguide-highlight', this.overlay);

    // Tooltip
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

    // Bind tooltip buttons
    this.tooltip.querySelector('.trailguide-tooltip-close')?.addEventListener('click', () => this.skip());
    this.tooltip.querySelector('.trailguide-btn-prev')?.addEventListener('click', () => this.prev());
    this.tooltip.querySelector('.trailguide-btn-next')?.addEventListener('click', () => this.next());
  }

  private showStep(): void {
    if (!this.trail || !this.overlay || !this.tooltip) return;

    const step = this.trail.steps[this.currentStepIndex];
    if (!step) return;

    // Find target element
    const target = findElement(step.target);
    if (!target || !isElementVisible(target)) {
      console.warn(`[Trailguide] Target not found or not visible: ${step.target}`);
      return;
    }

    // Scroll to element
    scrollToElement(target);

    // Small delay for scroll to complete
    setTimeout(() => {
      this.updateSpotlight(target);
      this.updateTooltip(step, target);
      this.options.onStepChange?.(step, this.currentStepIndex);
    }, 100);
  }

  private updateSpotlight(target: HTMLElement): void {
    if (!this.overlay) return;

    const rect = target.getBoundingClientRect();
    const padding = 8;

    // Update SVG cutout
    const cutout = this.overlay.querySelector('.trailguide-cutout');
    if (cutout) {
      cutout.setAttribute('x', String(rect.left - padding));
      cutout.setAttribute('y', String(rect.top - padding));
      cutout.setAttribute('width', String(rect.width + padding * 2));
      cutout.setAttribute('height', String(rect.height + padding * 2));
    }

    // Update highlight border
    const highlight = this.overlay.querySelector<HTMLElement>('.trailguide-highlight');
    if (highlight) {
      highlight.style.top = `${rect.top - padding}px`;
      highlight.style.left = `${rect.left - padding}px`;
      highlight.style.width = `${rect.width + padding * 2}px`;
      highlight.style.height = `${rect.height + padding * 2}px`;
    }

    // Update on scroll/resize
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
    this.cleanupFns.push(() => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    });
  }

  private async updateTooltip(step: Step, target: HTMLElement): Promise<void> {
    if (!this.tooltip || !this.trail || !this.arrowEl) return;

    const isFirst = this.currentStepIndex === 0;
    const isLast = this.currentStepIndex === this.trail.steps.length - 1;

    // Update content
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

    // Position tooltip with Floating UI
    const { x, y, middlewareData } = await computePosition(target, this.tooltip, {
      placement: step.placement as Placement,
      middleware: [
        offset(12),
        flip(),
        shift({ padding: 8 }),
        arrow({ element: this.arrowEl }),
      ],
    });

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;

    // Position arrow
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
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];

    this.overlay?.remove();
    this.tooltip?.remove();
    this.overlay = null;
    this.tooltip = null;
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
}

export function next(): void {
  defaultInstance?.next();
}

export function prev(): void {
  defaultInstance?.prev();
}

export function skip(): void {
  defaultInstance?.skip();
}
