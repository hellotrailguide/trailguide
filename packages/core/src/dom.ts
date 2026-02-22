export function findElement(selector: string): HTMLElement | null {
  try {
    return document.querySelector<HTMLElement>(selector);
  } catch {
    console.warn(`[Trailguide] Invalid selector: ${selector}`);
    return null;
  }
}

export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
}

export function scrollToElement(element: HTMLElement): void {
  // Temporarily override CSS scroll-behavior (e.g. `html { scroll-behavior: smooth }`)
  // with an inline style so the scroll is always instant. Inline styles win the cascade.
  const html = document.documentElement;
  html.style.scrollBehavior = 'auto';
  element.scrollIntoView({ block: 'center', inline: 'nearest' });
  requestAnimationFrame(() => { html.style.scrollBehavior = ''; });
}

export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  parent?: HTMLElement
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (parent) parent.appendChild(el);
  return el;
}
