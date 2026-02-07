export function generateSelector(element: HTMLElement): string {
  // Priority 1: ID
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  // Priority 2: data-trail-id, data-testid, or data-tour-target
  const trailId = element.getAttribute('data-trail-id');
  if (trailId) {
    return `[data-trail-id="${CSS.escape(trailId)}"]`;
  }

  const testId = element.getAttribute('data-testid');
  if (testId) {
    return `[data-testid="${CSS.escape(testId)}"]`;
  }

  const tourTarget = element.getAttribute('data-tour-target');
  if (tourTarget) {
    return `[data-tour-target="${CSS.escape(tourTarget)}"]`;
  }

  // Priority 3: aria-label (great for buttons/links)
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    const selector = `${element.tagName.toLowerCase()}[aria-label="${CSS.escape(ariaLabel)}"]`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  // Priority 4: name attribute (forms)
  const name = element.getAttribute('name');
  if (name) {
    const selector = `[name="${CSS.escape(name)}"]`;
    if (document.querySelectorAll(selector).length === 1) {
      return selector;
    }
  }

  // Priority 5: Button/link with unique text content
  const textSelector = getTextBasedSelector(element);
  if (textSelector) {
    return textSelector;
  }

  // Priority 6: Unique class combination
  const uniqueClassSelector = getUniqueClassSelector(element);
  if (uniqueClassSelector) {
    return uniqueClassSelector;
  }

  // Priority 7: Build path-based selector (least stable)
  return buildPathSelector(element);
}

function getTextBasedSelector(element: HTMLElement): string | null {
  const tag = element.tagName.toLowerCase();

  // Only for interactive elements where text is meaningful
  if (!['button', 'a', 'label'].includes(tag)) {
    return null;
  }

  const text = element.textContent?.trim();
  if (!text || text.length > 50) return null; // Skip long/empty text

  // Try tag + text content approach using a parent context
  // Find a stable parent (with id or data attribute) and use relative selector
  let parent = element.parentElement;
  let depth = 0;

  while (parent && depth < 5) {
    let parentSelector = '';

    if (parent.id) {
      parentSelector = `#${CSS.escape(parent.id)}`;
    } else if (parent.getAttribute('data-trail-id')) {
      parentSelector = `[data-trail-id="${CSS.escape(parent.getAttribute('data-trail-id')!)}"]`;
    }

    if (parentSelector) {
      // Find all matching tags under this parent
      const candidates = parent.querySelectorAll(tag);
      const matchingIndex = Array.from(candidates).findIndex(
        el => el.textContent?.trim() === text
      );

      if (matchingIndex !== -1) {
        // If there's only one button with this text under the stable parent
        const sameTextCount = Array.from(candidates).filter(
          el => el.textContent?.trim() === text
        ).length;

        if (sameTextCount === 1) {
          return `${parentSelector} ${tag}`;
        }
      }
    }

    parent = parent.parentElement;
    depth++;
  }

  return null;
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
