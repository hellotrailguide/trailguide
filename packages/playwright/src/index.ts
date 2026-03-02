import { expect, type Page } from '@playwright/test';
import type { Trail } from '@trailguide/core';

export interface RunTrailOptions {
  baseUrl?: string;
  /** Per-step timeout in ms. Default: 8000 */
  timeout?: number;
}

export async function runTrail(page: Page, trail: Trail, options: RunTrailOptions = {}): Promise<void> {
  const { baseUrl = '', timeout = 8000 } = options;

  for (const step of trail.steps) {
    // Navigate if step specifies a URL and we're not already there
    if (step.url) {
      const target = step.url.startsWith('http') ? step.url : `${baseUrl}${step.url}`;
      if (!page.url().endsWith(step.url)) await page.goto(target);
    }

    const locator = page.locator(step.target);

    // Execute action
    if (step.action) {
      await locator.waitFor({ state: 'visible', timeout });
      switch (step.action) {
        case 'click':  await locator.click(); break;
        case 'fill':   await locator.fill(step.value ?? ''); break;
        case 'select': await locator.selectOption(step.value ?? ''); break;
        case 'check':  await locator.check(); break;
        case 'hover':  await locator.hover(); break;
      }
    }

    // Run explicit assertion
    if (step.assert) {
      const { type, expected = '' } = step.assert;
      switch (type) {
        case 'visible': await expect(locator).toBeVisible({ timeout }); break;
        case 'hidden':  await expect(locator).toBeHidden({ timeout }); break;
        case 'text':    await expect(locator).toHaveText(expected, { timeout }); break;
        case 'value':   await expect(locator).toHaveValue(expected, { timeout }); break;
        case 'url':     await expect(page).toHaveURL(expected, { timeout }); break;
      }
    } else if (!step.action && !step.optional) {
      // Tour steps with no action: verify element is at least present
      await locator.waitFor({ state: 'attached', timeout });
    }
  }
}
