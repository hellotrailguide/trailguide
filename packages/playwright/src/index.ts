import { expect, type Page } from '@playwright/test';
import type { Trail } from '@trailguide/core';

export interface NotifyOptions {
  /** Slack incoming webhook URL */
  slack?: string;
  /** Generic webhook URL — receives a JSON POST */
  webhook?: string;
  /** Link back to the trail in the editor (included in the payload) */
  trailUrl?: string;
}

export interface RunTrailOptions {
  baseUrl?: string;
  /** Per-step timeout in ms. Default: 8000 */
  timeout?: number;
  /**
   * When provided, each step is wrapped in test.step() so the Playwright
   * reporter shows each step title in the test output.
   * Pass the `test` object from `@playwright/test`.
   */
  test?: { step: (name: string, fn: () => Promise<void>) => Promise<void> };
  /** Send failure notifications to Slack or a custom webhook */
  notify?: NotifyOptions;
  /**
   * POST run results to your Trailguide test health dashboard.
   * Requires an API key from Dashboard > Tests > API Key.
   */
  reportUrl?: string;
  apiKey?: string;
}

interface FailurePayload {
  trailId: string;
  trailTitle: string;
  stepIndex: number;
  stepTitle: string;
  error: string;
  trailUrl?: string;
}

async function sendFailureNotifications(notify: NotifyOptions, payload: FailurePayload): Promise<void> {
  const promises: Promise<unknown>[] = [];

  if (notify.webhook) {
    promises.push(
      fetch(notify.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {/* notification failure must not mask the original error */})
    );
  }

  if (notify.slack) {
    const trailLink = payload.trailUrl ? ` <${payload.trailUrl}|View trail>` : '';
    const slackBody = {
      text: `Trail test failed: *${payload.trailTitle}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Trail test failed:* ${payload.trailTitle}${trailLink}\n*Step ${payload.stepIndex + 1}:* ${payload.stepTitle}\n\`\`\`${payload.error}\`\`\``,
          },
        },
      ],
    };
    promises.push(
      fetch(notify.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackBody),
      }).catch(() => {})
    );
  }

  await Promise.all(promises);
}

export async function runTrail(page: Page, trail: Trail, options: RunTrailOptions = {}): Promise<void> {
  if (trail.mode === 'tour') return;
  const { baseUrl = '', timeout = 8000, test: testObj, notify, reportUrl, apiKey } = options;
  const startTime = Date.now();

  // currentPage tracks active tab context — starts as the main page, switches on opensNewTab steps
  let currentPage = page;

  const postRunReport = async (passed: boolean, failedStepIndex?: number, failedStepTitle?: string, errorMessage?: string) => {
    if (!reportUrl || !apiKey) return;
    const payload = {
      trail_id: trail.id,
      trail_title: trail.title,
      passed,
      total_steps: trail.steps.length,
      failed_step_index: failedStepIndex ?? null,
      failed_step_title: failedStepTitle ?? null,
      error_message: errorMessage ?? null,
      duration_ms: Date.now() - startTime,
      base_url: baseUrl || null,
    };
    try {
      await fetch(reportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload),
      });
    } catch {
      // reporting failure must not mask the test result
    }
  };

  try {
    for (let stepIndex = 0; stepIndex < trail.steps.length; stepIndex++) {
      const step = trail.steps[stepIndex];

      const executeStep = async () => {
        try {
          await runStep(step);
        } catch (err) {
          if (notify) {
            await sendFailureNotifications(notify, {
              trailId: trail.id,
              trailTitle: trail.title,
              stepIndex,
              stepTitle: step.title || step.id,
              error: err instanceof Error ? err.message : String(err),
              trailUrl: notify.trailUrl,
            });
          }
          await postRunReport(false, stepIndex, step.title || step.id, err instanceof Error ? err.message : String(err));
          throw err;
        }
      };

      if (testObj) {
        await testObj.step(step.title || step.id, executeStep);
      } else {
        await executeStep();
      }
    }
  } catch (err) {
    // already reported in executeStep; just re-throw
    throw err;
  }

  await postRunReport(true);

  async function runStep(step: Trail['steps'][number]) {
    // Switch tab context if specified
    if (step.tabContext === 'main') {
      currentPage = page;
    } else if (step.tabContext === 'new') {
      const pages = page.context().pages();
      if (pages.length > 1) currentPage = pages[pages.length - 1];
    }

    // Navigate if step specifies a URL and we're not already there
    if (step.url) {
      const target = step.url.startsWith('http') ? step.url : `${baseUrl}${step.url}`;
      if (!currentPage.url().endsWith(step.url)) await currentPage.goto(target);
    }

    // Resolve the best locator using a 4-layer priority stack:
    // 1. CSS selectors (primary + fallbacks) — fast and precise for well-structured UIs
    // 2. Semantic locators by ARIA role + accessible name — stable across DOM changes
    // 3. Label, placeholder, and text content — covers form inputs and labelled elements
    // 4. Multi-signal fingerprint scoring — scans all interactive elements and picks the
    //    highest-scoring candidate when all other strategies have failed
    const resolveLocator = async (): Promise<ReturnType<typeof currentPage.locator>> => {
      // Layer 1: CSS selectors — also tried with pierce/ prefix for shadow DOM elements
      for (const selector of [step.target, ...(step.fallbackSelectors ?? [])]) {
        const ms = selector === step.target ? timeout : 2000;
        const attempts = [
          currentPage.locator(selector).waitFor({ state: 'attached', timeout: ms }).then(() => currentPage.locator(selector)),
        ];
        if (!selector.startsWith('pierce/')) {
          attempts.push(
            currentPage.locator('pierce/' + selector).waitFor({ state: 'attached', timeout: ms }).then(() => currentPage.locator('pierce/' + selector))
          );
        }
        try {
          return await Promise.any(attempts);
        } catch {
          // try next selector
        }
      }

      // Layer 2 & 3: semantic fallbacks using textHint
      if (step.textHint) {
        const hint = step.textHint.trim();
        const roles = ['button', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'option', 'link', 'treeitem'] as const;
        // Try each ARIA role with an exact name match
        for (const role of roles) {
          const candidate = currentPage.getByRole(role, { name: hint, exact: true });
          try {
            await candidate.first().waitFor({ state: 'attached', timeout: 2000 });
            return candidate.first();
          } catch {
            // try next role
          }
        }
        // Try label association (form inputs)
        try {
          const byLabel = currentPage.getByLabel(hint, { exact: true });
          await byLabel.first().waitFor({ state: 'attached', timeout: 2000 });
          return byLabel.first();
        } catch { /* continue */ }
        // Try placeholder (inputs)
        try {
          const byPlaceholder = currentPage.getByPlaceholder(hint, { exact: true });
          await byPlaceholder.first().waitFor({ state: 'attached', timeout: 2000 });
          return byPlaceholder.first();
        } catch { /* continue */ }
        // Try visible text — broadest match, use last
        try {
          const byText = currentPage.getByText(hint, { exact: true });
          await byText.first().waitFor({ state: 'attached', timeout: 2000 });
          return byText.first();
        } catch { /* continue */ }
      }

      // Layer 4: multi-signal fingerprint scoring with shadow DOM traversal,
      // type-aware weights, and positional tiebreaker.
      if (step.fingerprint) {
        const fp = step.fingerprint;
        const bestSelector = await currentPage.evaluate((fingerprint) => {
          const CANDIDATE_SEL = [
            'a', 'button', 'input', 'select', 'textarea',
            '[role="button"]', '[role="menuitem"]', '[role="menuitemcheckbox"]',
            '[role="menuitemradio"]', '[role="tab"]', '[role="option"]',
            '[role="link"]', '[role="treeitem"]', '[role="checkbox"]',
            '[role="radio"]', '[role="combobox"]', '[tabindex="0"]', '[onclick]',
          ].join(', ');

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const f = fingerprint as any;

          function querySelectorAllDeep(sel: string, root: Document | ShadowRoot = document): Element[] {
            const results: Element[] = [];
            try { results.push(...Array.from(root.querySelectorAll(sel))); } catch (_) {}
            root.querySelectorAll('*').forEach(el => {
              if ((el as Element & { shadowRoot?: ShadowRoot }).shadowRoot) {
                results.push(...querySelectorAllDeep(sel, (el as Element & { shadowRoot: ShadowRoot }).shadowRoot));
              }
            });
            return results;
          }

          function scoreEl(el: Element): number {
            const tag = el.tagName.toLowerCase();
            const isInput = tag === 'input' || tag === 'textarea' || tag === 'select';
            const isButton = tag === 'button' || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'menuitem';
            let score = 0;
            if (f.dataAttrs) {
              for (const [attr, val] of Object.entries(f.dataAttrs as Record<string, string>)) {
                if (el.getAttribute(attr) === val) score += 40;
              }
            }
            if (isInput) {
              if (f.name && el.getAttribute('name') === f.name) score += 35;
              if (f.placeholder && el.getAttribute('placeholder') === f.placeholder) score += 35;
              if (f.closestLabel) {
                const inp = el as HTMLInputElement;
                if (inp.labels && inp.labels[0]) {
                  const lt = (inp.labels[0].innerText || inp.labels[0].textContent || '').replace(/\s+/g, ' ').trim();
                  if (lt === f.closestLabel) score += 30;
                }
              }
              if (f.ariaLabel && el.getAttribute('aria-label') === f.ariaLabel) score += 25;
            } else if (isButton) {
              if (f.ariaLabel && el.getAttribute('aria-label') === f.ariaLabel) score += 35;
              if (f.innerText) {
                const text = ((el as HTMLElement).innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
                if (text === f.innerText) score += 30;
                else if (f.innerText.length > 3 && text.includes(f.innerText)) score += 12;
              }
            } else {
              if (f.ariaLabel && el.getAttribute('aria-label') === f.ariaLabel) score += 30;
              if (f.innerText) {
                const text = ((el as HTMLElement).innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
                if (text === f.innerText) score += 25;
                else if (f.innerText.length > 3 && text.includes(f.innerText)) score += 10;
              }
              if (f.name && el.getAttribute('name') === f.name) score += 20;
            }
            if (f.title && el.getAttribute('title') === f.title) score += 20;
            if (f.role && el.getAttribute('role') === f.role) score += 12;
            if (f.type && el.getAttribute('type') === f.type) score += 8;
            if (f.tag && tag === f.tag) score += 5;
            return score;
          }

          function uniqueSelectorFor(el: Element): string {
            if (el.id && !/\d{3,}/.test(el.id)) return '#' + CSS.escape(el.id);
            for (let a = 0; a < el.attributes.length; a++) {
              const attr = el.attributes[a];
              if (attr.name.startsWith('data-') && attr.value) {
                const sel = `[${attr.name}="${CSS.escape(attr.value)}"]`;
                if (querySelectorAllDeep(sel).length === 1) return sel;
              }
            }
            const path: string[] = [];
            let cur: Element | null = el;
            while (cur && cur !== document.body) {
              const tag = cur.tagName.toLowerCase();
              const parent: Element | null = cur.parentElement;
              const siblings = parent ? Array.from(parent.children).filter((c: Element) => c.tagName === cur!.tagName) : [];
              const idx = siblings.indexOf(cur) + 1;
              path.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${idx})` : tag);
              cur = parent;
              if (path.length >= 8) break;
            }
            return path.join(' > ');
          }

          const scored: Array<{ el: Element; score: number }> = [];
          querySelectorAllDeep(CANDIDATE_SEL).forEach(el => {
            const score = scoreEl(el);
            if (score >= 20) scored.push({ el, score });
          });
          if (scored.length === 0) return null;

          scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (f.viewportRatio) {
              const ra = a.el.getBoundingClientRect();
              const rb = b.el.getBoundingClientRect();
              const ax = (ra.left + ra.width / 2) / window.innerWidth - f.viewportRatio.x;
              const ay = (ra.top + ra.height / 2) / window.innerHeight - f.viewportRatio.y;
              const bx = (rb.left + rb.width / 2) / window.innerWidth - f.viewportRatio.x;
              const by = (rb.top + rb.height / 2) / window.innerHeight - f.viewportRatio.y;
              return (ax * ax + ay * ay) - (bx * bx + by * by);
            }
            return 0;
          });
          return uniqueSelectorFor(scored[0].el);
        }, fp);

        if (bestSelector) {
          const candidate = currentPage.locator(bestSelector);
          try {
            await candidate.waitFor({ state: 'attached', timeout: 2000 });
            return candidate;
          } catch { /* fall through to primary */ }
        }
      }

      // Nothing matched — return primary so Playwright reports the original selector in the error
      return currentPage.locator(step.target);
    };

    const locator = await resolveLocator();

    // Execute action
    if (step.action) {
      const noLocatorActions = ['evaluate', 'scroll', 'goto'];
      if (!noLocatorActions.includes(step.action)) {
        await locator.waitFor({ state: 'visible', timeout });
      }

      if (step.opensNewTab && step.action === 'click') {
        // Wait for the new tab to open alongside the click
        const [popup] = await Promise.all([
          page.context().waitForEvent('page'),
          locator.click(),
        ]);
        await popup.waitForLoadState();
        currentPage = popup;
      } else {
        switch (step.action) {
          case 'click':         await locator.click(); break;
          case 'rightClick':    await locator.click({ button: 'right' }); break;
          case 'dblclick':      await locator.dblclick(); break;
          case 'fill':          await locator.fill(step.value ?? ''); break;
          case 'type':          await locator.pressSequentially(step.value ?? ''); break;
          case 'select':        await locator.selectOption(step.value ?? ''); break;
          case 'check':         await locator.check(); break;
          case 'uncheck':       await locator.uncheck(); break;
          case 'hover':         await locator.hover(); break;
          case 'focus':         await locator.focus(); break;
          case 'press':         await locator.press(step.value ?? ''); break;
          case 'dragTo':        await locator.dragTo(currentPage.locator(step.value ?? '')); break;
          case 'setInputFiles': await locator.setInputFiles(step.value ?? ''); break;
          case 'goto':          await currentPage.goto(step.value ?? ''); break;
          case 'scroll': {
            const [dx, dy] = (step.value ?? '0,0').split(',').map(Number);
            if (step.target === 'body' || step.target === 'html') {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await currentPage.evaluate(([x, y]: [number, number]) => (globalThis as any).scrollBy(x, y), [dx, dy] as [number, number]);
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await locator.evaluate((el: any, [x, y]: [number, number]) => el.scrollBy(x, y), [dx, dy] as [number, number]);
            }
            break;
          }
          case 'evaluate':      await currentPage.evaluate(step.value ?? ''); break;
        }
      }
    }

    // Wait condition (runs after action, before assertion)
    if (step.wait) {
      switch (step.wait.type) {
        case 'networkIdle':      await currentPage.waitForLoadState('networkidle'); break;
        case 'load':             await currentPage.waitForLoadState('load'); break;
        case 'domcontentloaded': await currentPage.waitForLoadState('domcontentloaded'); break;
        case 'selector':         await currentPage.waitForSelector(step.wait.value!, { timeout }); break;
        case 'timeout':          await currentPage.waitForTimeout(parseInt(step.wait.value ?? '1000')); break;
      }
    }

    // Assertion
    if (step.assert) {
      const { type, expected = '', attribute } = step.assert;
      switch (type) {
        case 'visible':      await expect(locator).toBeVisible({ timeout }); break;
        case 'hidden':       await expect(locator).toBeHidden({ timeout }); break;
        case 'enabled':      await expect(locator).toBeEnabled({ timeout }); break;
        case 'disabled':     await expect(locator).toBeDisabled({ timeout }); break;
        case 'checked':      await expect(locator).toBeChecked({ timeout }); break;
        case 'empty':        await expect(locator).toBeEmpty({ timeout }); break;
        case 'text':         await expect(locator).toHaveText(expected, { timeout }); break;
        case 'containsText': await expect(locator).toContainText(expected, { timeout }); break;
        case 'value':        await expect(locator).toHaveValue(expected, { timeout }); break;
        case 'url':          await expect(currentPage).toHaveURL(expected, { timeout }); break;
        case 'title':        await expect(currentPage).toHaveTitle(expected, { timeout }); break;
        case 'attribute':    await expect(locator).toHaveAttribute(attribute!, expected, { timeout }); break;
        case 'hasClass':     await expect(locator).toHaveClass(expected, { timeout }); break;
        case 'count':        await expect(locator).toHaveCount(parseInt(expected), { timeout }); break;
        case 'screenshot':   await expect(currentPage).toHaveScreenshot(step.id + '.png'); break;
        case 'custom': {
          const result = await currentPage.evaluate(expected);
          if (!result) throw new Error(`Custom assertion failed: ${expected}`);
          break;
        }
      }
    } else if (!step.action && !step.optional) {
      // No action and no assertion: verify the element is at least present in the DOM
      await locator.waitFor({ state: 'attached', timeout });
    }
  }
}
