import { computePosition, offset, flip, shift, arrow } from '@floating-ui/dom';
import type { Trail, Step, TrailguideOptions, Placement, FeedbackConfig, ChecklistItem } from './types';
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
    this.tooltip.style.visibility = 'hidden';
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

  private showAnnouncementStep(step: Step): void {
    if (!this.overlay || !this.tooltip) return;
    this.overlay.style.display = 'none';
    this.tooltip.style.display = 'none';

    const cfg = step.announcement ?? {};
    const primaryLabel = cfg.primaryCta ?? 'Got it';

    const el = createElement('div', 'trailguide-announcement');
    const card = createElement('div', 'trailguide-announcement-card', el);

    if (cfg.imageUrl) {
      const img = createElement('img', 'trailguide-announcement-image', card) as HTMLImageElement;
      img.src = cfg.imageUrl;
      img.alt = '';
    }

    const body = createElement('div', 'trailguide-announcement-body', card);

    if (cfg.badge) {
      const badge = createElement('span', 'trailguide-announcement-badge', body);
      badge.textContent = cfg.badge;
    }

    const title = createElement('h3', 'trailguide-announcement-title', body);
    title.textContent = step.title;

    const text = createElement('p', 'trailguide-announcement-text', body);
    text.textContent = step.content;

    const footer = createElement('div', 'trailguide-announcement-footer', body);

    if (cfg.secondaryCta) {
      const skipBtn = createElement('button', 'trailguide-btn trailguide-btn-secondary', footer) as HTMLButtonElement;
      skipBtn.textContent = cfg.secondaryCta;
      skipBtn.addEventListener('click', () => this.skip());
    }

    const primaryBtn = createElement('button', 'trailguide-btn trailguide-btn-primary', footer) as HTMLButtonElement;
    primaryBtn.textContent = primaryLabel;
    primaryBtn.addEventListener('click', () => this.next());

    document.body.appendChild(el);
    this.stepCleanupFns.push(() => {
      el.remove();
      if (this.overlay) this.overlay.style.display = '';
      if (this.tooltip) this.tooltip.style.display = '';
    });
  }

  private showChecklistStep(step: Step): void {
    if (!this.overlay || !this.tooltip) return;
    this.overlay.style.display = 'none';
    this.tooltip.style.display = 'none';

    const cfg = step.checklist ?? { items: [] };
    const ctaLabel = cfg.ctaLabel ?? 'Done';
    const checked = new Set<string>();

    const el = createElement('div', 'trailguide-checklist');
    const card = createElement('div', 'trailguide-checklist-card', el);

    const header = createElement('div', 'trailguide-checklist-header', card);
    const titleEl = createElement('h3', 'trailguide-checklist-title', header);
    titleEl.textContent = step.title || 'Getting Started';
    const closeBtn = createElement('button', 'trailguide-checklist-close', header) as HTMLButtonElement;
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.skip());

    const itemsEl = createElement('div', 'trailguide-checklist-items', card);

    const requiredItems = cfg.items.filter(i => i.required !== false);

    const updateFooter = () => {
      const completedRequired = requiredItems.filter(i => checked.has(i.id)).length;
      progressEl.textContent = `${completedRequired} of ${requiredItems.length} completed`;
      const allRequired = requiredItems.every(i => checked.has(i.id));
      doneBtn.disabled = !allRequired;
      doneBtn.style.opacity = allRequired ? '1' : '0.4';
    };

    cfg.items.forEach((item: ChecklistItem) => {
      const row = createElement('button', 'trailguide-checklist-item', itemsEl) as HTMLButtonElement;

      const checkEl = createElement('span', 'trailguide-checklist-check', row);
      checkEl.innerHTML = '';

      const labelEl = createElement('span', 'trailguide-checklist-label', row);
      labelEl.textContent = item.label;

      if (item.required === false) {
        const opt = createElement('span', 'trailguide-checklist-optional', row);
        opt.textContent = 'optional';
      }

      row.addEventListener('click', () => {
        if (checked.has(item.id)) {
          checked.delete(item.id);
          row.classList.remove('done');
          checkEl.innerHTML = '';
        } else {
          checked.add(item.id);
          row.classList.add('done');
          checkEl.innerHTML = '<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
          if (item.url) {
            setTimeout(() => { window.location.href = item.url!; }, 300);
          }
        }
        updateFooter();
      });
    });

    const footer = createElement('div', 'trailguide-checklist-footer', card);
    const progressEl = createElement('span', 'trailguide-checklist-progress', footer);

    const rightGroup = createElement('div', '', footer);
    rightGroup.style.display = 'flex';
    rightGroup.style.alignItems = 'center';
    rightGroup.style.gap = '12px';

    if (cfg.allowSkip) {
      const skipBtn = createElement('button', 'trailguide-checklist-skip', rightGroup) as HTMLButtonElement;
      skipBtn.textContent = 'Skip';
      skipBtn.addEventListener('click', () => this.next());
    }

    const doneBtn = createElement('button', 'trailguide-btn trailguide-btn-primary', rightGroup) as HTMLButtonElement;
    doneBtn.textContent = ctaLabel;
    doneBtn.addEventListener('click', () => this.next());

    updateFooter();

    document.body.appendChild(el);
    this.stepCleanupFns.push(() => {
      el.remove();
      if (this.overlay) this.overlay.style.display = '';
      if (this.tooltip) this.tooltip.style.display = '';
    });
  }

  private showNudgeStep(step: Step): void {
    if (!this.overlay || !this.tooltip) return;
    this.overlay.style.display = 'none';
    this.tooltip.style.display = 'none';

    const el = findElement(step.target);
    if (!el) { this.next(); return; }

    const cfg = step.nudge;
    const effect = cfg?.effect ?? 'pulse';
    const color = cfg?.color ?? '#1a91a2';
    const label = cfg?.label ?? 'New';
    const rect = el.getBoundingClientRect();
    const domCleanups: (() => void)[] = [];

    if (effect === 'pulse') {
      const styleId = 'trailguide-nudge-pulse-style';
      if (!document.getElementById(styleId)) {
        const s = document.createElement('style');
        s.id = styleId;
        s.textContent = '@keyframes trailguide-nudge-ping{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.9);opacity:0}}';
        document.head.appendChild(s);
      }
      const br = window.getComputedStyle(el).borderRadius;
      const ring = document.createElement('div');
      ring.style.cssText = [
        'position:fixed', 'pointer-events:none', 'z-index:2147483645',
        'border-radius:' + br, 'box-sizing:border-box',
        'top:' + (rect.top - 4) + 'px', 'left:' + (rect.left - 4) + 'px',
        'width:' + (rect.width + 8) + 'px', 'height:' + (rect.height + 8) + 'px',
        'border:2.5px solid ' + color,
        'animation:trailguide-nudge-ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
      ].join(';');
      document.body.appendChild(ring);
      domCleanups.push(() => ring.remove());

    } else if (effect === 'glow') {
      const prevBoxShadow = el.style.boxShadow;
      const prevTransition = el.style.transition;
      el.style.boxShadow = '0 0 0 3px ' + color + ', 0 0 20px 6px ' + color + '55';
      el.style.transition = 'box-shadow 0.3s ease';
      domCleanups.push(() => { el.style.boxShadow = prevBoxShadow; el.style.transition = prevTransition; });

    } else if (effect === 'sparkles') {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.min(Math.max(rect.width, rect.height) * 0.15 + 4, 14);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const endDx = Math.cos(angle) * dist;
        const endDy = Math.sin(angle) * dist;
        const sp = document.createElement('div');
        sp.textContent = '✦';
        sp.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483645;font-size:13px;line-height:1;color:' + color + ';top:' + (cy - 7) + 'px;left:' + (cx - 7) + 'px;transform-origin:center;';
        document.body.appendChild(sp);
        sp.animate([
          { opacity: 0, transform: 'translate(0,0) scale(0.3)' },
          { opacity: 1, transform: `translate(${endDx * 0.55}px,${endDy * 0.55}px) scale(1)`, offset: 0.35 },
          { opacity: 0.9, transform: `translate(${endDx}px,${endDy}px) scale(0.7)`, offset: 0.65 },
          { opacity: 0, transform: `translate(${endDx * 1.35}px,${endDy * 1.35}px) scale(0)` },
        ], { duration: 1400, delay: i * 170, iterations: Infinity, easing: 'ease-out' });
        domCleanups.push(() => sp.remove());
      }

    } else if (effect === 'badge') {
      const badge = document.createElement('div');
      badge.textContent = label;
      badge.style.cssText = [
        'position:fixed', 'pointer-events:none', 'z-index:2147483645',
        'top:' + (rect.top - 10) + 'px', 'left:' + (rect.right - 10) + 'px',
        'background:' + color, 'color:#fff',
        'font-size:10px', 'font-weight:700', 'font-family:system-ui,sans-serif',
        'padding:2px 7px', 'border-radius:999px', 'white-space:nowrap', 'line-height:18px',
      ].join(';');
      document.body.appendChild(badge);
      domCleanups.push(() => badge.remove());
    }

    const clickHandler = () => {
      domCleanups.forEach(fn => fn());
      el.removeEventListener('click', clickHandler, true);
      this.next();
    };
    el.addEventListener('click', clickHandler, true);

    this.stepCleanupFns.push(() => {
      domCleanups.forEach(fn => fn());
      el.removeEventListener('click', clickHandler, true);
      if (this.overlay) this.overlay.style.display = '';
      if (this.tooltip) this.tooltip.style.display = '';
    });
  }

  private showRedirectStep(step: Step): void {
    if (!this.overlay || !this.tooltip) return;
    this.overlay.style.display = 'none';
    this.tooltip.style.display = 'none';

    const cfg = step.redirect;
    if (!cfg?.url) { this.next(); return; }

    const message = cfg.message || step.content || 'Taking you there...';
    const delay = cfg.delay ?? 1200;

    const el = createElement('div', 'trailguide-redirect');
    const card = createElement('div', 'trailguide-redirect-card', el);

    const icon = createElement('div', 'trailguide-redirect-icon', card);
    icon.textContent = '→';

    const msg = createElement('p', 'trailguide-redirect-message', card);
    msg.textContent = message;

    const urlEl = createElement('p', 'trailguide-redirect-url', card);
    urlEl.textContent = cfg.url;

    document.body.appendChild(el);
    this.stepCleanupFns.push(() => {
      el.remove();
      if (this.overlay) this.overlay.style.display = '';
      if (this.tooltip) this.tooltip.style.display = '';
    });

    setTimeout(() => {
      window.location.href = cfg.url;
    }, delay);
  }

  private showDelayStep(step: Step): void {
    const ms = step.delayMs ?? 1000;
    setTimeout(() => {
      if (this.isActive) this.next();
    }, ms);
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

    if (step.stepType === 'nudge') { this.showNudgeStep(step); return; }
    if (step.stepType === 'celebration') { this.showCelebrationStep(step); return; }
    if (step.stepType === 'feedback') { this.showFeedbackStep(step); return; }
    if (step.stepType === 'announcement') { this.showAnnouncementStep(step); return; }
    if (step.stepType === 'checklist') { this.showChecklistStep(step); return; }
    if (step.stepType === 'redirect') { this.showRedirectStep(step); return; }
    if (step.stepType === 'delay') { this.showDelayStep(step); return; }

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
      if (this.tooltip) this.tooltip.style.visibility = 'hidden';
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
      if (this.tooltip) { this.tooltip.style.transform = ''; this.tooltip.style.visibility = 'hidden'; }
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
    this.tooltip.style.visibility = '';
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
    this.tooltip.style.visibility = '';
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
    this.tooltip.style.visibility = '';
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
