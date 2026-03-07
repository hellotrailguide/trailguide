import { expect, type Page } from '@playwright/test';
import type { Trail } from '@trailguide/core';

export interface RunTrailOptions {
  baseUrl?: string;
  /** Per-step timeout in ms. Default: 8000 */
  timeout?: number;
}

export async function runTrail(page: Page, trail: Trail, options: RunTrailOptions = {}): Promise<void> {
  if (trail.mode === 'tour') return;
  const { baseUrl = '', timeout = 8000 } = options;

  // currentPage tracks active tab context — starts as the main page, switches on opensNewTab steps
  let currentPage = page;

  for (const step of trail.steps) {
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

    // When fallback selectors are available, try them in order if the primary times out.
    // Without fallbacks, use the primary directly so Playwright's native error messages are unaffected.
    let locator = currentPage.locator(step.target);
    if (step.fallbackSelectors?.length) {
      for (const selector of [step.target, ...step.fallbackSelectors]) {
        const candidate = currentPage.locator(selector);
        try {
          await candidate.waitFor({ state: 'attached', timeout: selector === step.target ? timeout : 2000 });
          locator = candidate;
          break;
        } catch {
          // try next
        }
      }
    }

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
