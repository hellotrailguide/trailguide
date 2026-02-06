export function generateSelector(element: HTMLElement): string {
  // Priority 1: ID
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Priority 2: data-testid or data-tour-target
  const testId = element.getAttribute('data-testid');
  if (testId) {
    return `[data-testid="${CSS.escape(testId)}"]`;
  }

  const tourTarget = element.getAttribute('data-tour-target');
  if (tourTarget) {
    return `[data-tour-target="${CSS.escape(tourTarget)}"]`;
  }

  // Priority 3: Unique class combination
  const uniqueClassSelector = getUniqueClassSelector(element);
  if (uniqueClassSelector) {
    return uniqueClassSelector;
  }

  // Priority 4: Build path-based selector
  return buildPathSelector(element);
}

function getUniqueClassSelector(element: HTMLElement): string | null {
  if (!element.className || typeof element.className !== 'string') {
    return null;
  }

  const classes = element.className.split(/\s+/).filter(Boolean);
  if (classes.length === 0) return null;

  // Try each class individually first
  for (const cls of classes) {
    const selector = `.${CSS.escape(cls)}`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  // Try combining classes
  if (classes.length > 1) {
    const combinedSelector = classes.map(c => `.${CSS.escape(c)}`).join('');
    if (document.querySelectorAll(combinedSelector).length === 1) {
      return combinedSelector;
    }
  }

  return null;
}

function buildPathSelector(element: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    }

    // Add nth-child if needed for uniqueness
    const parent: HTMLElement | null = current.parentElement;
    if (parent) {
      const currentTag = current.tagName;
      const siblings = Array.from(parent.children).filter(
        (child): child is Element => child.tagName === currentTag
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = parent;
  }

  return path.join(' > ');
}

export function validateSelector(selector: string): boolean {
  try {
    const element = document.querySelector(selector);
    return element !== null;
  } catch {
    return false;
  }
}

export function highlightElement(element: HTMLElement): () => void {
  const originalOutline = element.style.outline;
  const originalOutlineOffset = element.style.outlineOffset;

  element.style.outline = '2px solid #3b82f6';
  element.style.outlineOffset = '2px';

  return () => {
    element.style.outline = originalOutline;
    element.style.outlineOffset = originalOutlineOffset;
  };
}
