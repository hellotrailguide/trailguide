/**
 * Selector Auto-Repair System
 *
 * When site redesigns happen, CSS selectors can break.
 * This module detects broken selectors and suggests fixes.
 */

export interface SelectorSuggestion {
  selector: string
  confidence: number // 0-1
  reason: string
  element?: HTMLElement
}

export interface SelectorContext {
  originalSelector: string
  tagName?: string
  textContent?: string
  ariaLabel?: string
  classes?: string[]
  dataAttributes?: Record<string, string>
  position?: { index: number; parentTag: string }
}

/**
 * Parse a CSS selector to extract context about what it was targeting
 */
export function parseSelector(selector: string): SelectorContext {
  const context: SelectorContext = {
    originalSelector: selector,
  }

  // Extract ID
  const idMatch = selector.match(/#([a-zA-Z0-9_-]+)/)
  if (idMatch) {
    context.dataAttributes = { id: idMatch[1] }
  }

  // Extract data attributes
  const dataRegex = /\[([a-z-]+)="([^"]+)"\]/gi
  let dataMatch: RegExpExecArray | null
  while ((dataMatch = dataRegex.exec(selector)) !== null) {
    if (!context.dataAttributes) context.dataAttributes = {}
    context.dataAttributes[dataMatch[1]] = dataMatch[2]
  }

  // Extract classes
  const classRegex = /\.([a-zA-Z0-9_-]+)/g
  const classes: string[] = []
  let classMatch: RegExpExecArray | null
  while ((classMatch = classRegex.exec(selector)) !== null) {
    classes.push(classMatch[1])
  }
  if (classes.length > 0) {
    context.classes = classes
  }

  // Extract tag name
  const tagMatch = selector.match(/^([a-z]+)/i)
  if (tagMatch) {
    context.tagName = tagMatch[1].toLowerCase()
  }

  // Extract aria-label
  const ariaMatch = selector.match(/\[aria-label="([^"]+)"\]/)
  if (ariaMatch) {
    context.ariaLabel = ariaMatch[1]
  }

  return context
}

/**
 * Find elements similar to the original target based on context
 */
export function findSimilarElements(
  doc: Document,
  context: SelectorContext
): HTMLElement[] {
  const candidates: Array<{ element: HTMLElement; score: number }> = []

  // Get all elements to search
  const elements = context.tagName
    ? Array.from(doc.querySelectorAll(context.tagName))
    : Array.from(doc.querySelectorAll('*'))

  for (const el of elements) {
    if (!(el instanceof HTMLElement)) continue

    let score = 0
    const reasons: string[] = []

    // Match by data attributes (highest priority)
    if (context.dataAttributes) {
      for (const [attr, value] of Object.entries(context.dataAttributes)) {
        if (el.getAttribute(attr) === value) {
          score += 0.5
          reasons.push(`Matches ${attr}`)
        }
      }
    }

    // Match by aria-label
    if (context.ariaLabel) {
      if (el.getAttribute('aria-label') === context.ariaLabel) {
        score += 0.4
        reasons.push('Matches aria-label')
      }
    }

    // Match by classes
    if (context.classes && context.classes.length > 0) {
      const elClasses = Array.from(el.classList)
      const matchingClasses = context.classes.filter((c) => elClasses.includes(c))
      if (matchingClasses.length > 0) {
        score += (matchingClasses.length / context.classes.length) * 0.3
        reasons.push(`Matches ${matchingClasses.length} classes`)
      }
    }

    // Match by text content (for buttons/links)
    if (context.textContent) {
      const elText = el.textContent?.trim()
      if (elText === context.textContent) {
        score += 0.3
        reasons.push('Matches text')
      } else if (elText?.includes(context.textContent) || context.textContent.includes(elText || '')) {
        score += 0.15
        reasons.push('Similar text')
      }
    }

    if (score > 0.1) {
      candidates.push({ element: el, score })
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score)

  return candidates.slice(0, 5).map((c) => c.element)
}

/**
 * Generate a stable selector for an element
 */
export function generateStableSelector(element: HTMLElement): string {
  // Priority 1: ID
  if (element.id) {
    return `#${CSS.escape(element.id)}`
  }

  // Priority 2: Data attributes
  const dataAttrs = ['data-trail-id', 'data-testid', 'data-tour-target', 'data-cy']
  for (const attr of dataAttrs) {
    const value = element.getAttribute(attr)
    if (value) {
      return `[${attr}="${CSS.escape(value)}"]`
    }
  }

  // Priority 3: Aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) {
    const selector = `${element.tagName.toLowerCase()}[aria-label="${CSS.escape(ariaLabel)}"]`
    if (document.querySelectorAll(selector).length === 1) {
      return selector
    }
  }

  // Priority 4: Name attribute
  const name = element.getAttribute('name')
  if (name) {
    const selector = `${element.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`
    if (document.querySelectorAll(selector).length === 1) {
      return selector
    }
  }

  // Priority 5: Unique class combination
  const classes = Array.from(element.classList).filter(
    (c) => !c.match(/^(hover|active|focus|selected|open|closed|visible|hidden|\d)/i)
  )

  for (const cls of classes) {
    const selector = `.${CSS.escape(cls)}`
    if (document.querySelectorAll(selector).length === 1) {
      return selector
    }
  }

  if (classes.length >= 2) {
    const selector = classes
      .slice(0, 3)
      .map((c) => `.${CSS.escape(c)}`)
      .join('')
    if (document.querySelectorAll(selector).length === 1) {
      return selector
    }
  }

  // Priority 6: Path-based selector (fallback)
  const path: string[] = []
  let current: HTMLElement | null = element

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase()

    if (current.id) {
      path.unshift(`#${CSS.escape(current.id)}`)
      break
    }

    const parent: HTMLElement | null = current.parentElement
    if (parent) {
      const currentTagName = current.tagName
      const siblings = Array.from(parent.children).filter(
        (el): el is Element => el.tagName === currentTagName
      )
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1
        selector += `:nth-of-type(${index})`
      }
    }

    path.unshift(selector)
    current = parent as HTMLElement | null
  }

  return path.join(' > ')
}

/**
 * Calculate confidence score for a selector suggestion
 */
export function calculateConfidence(
  element: HTMLElement,
  context: SelectorContext
): number {
  let score = 0.3 // Base score

  // Same tag name
  if (context.tagName && element.tagName.toLowerCase() === context.tagName) {
    score += 0.1
  }

  // Matching data attributes
  if (context.dataAttributes) {
    for (const [attr, value] of Object.entries(context.dataAttributes)) {
      if (element.getAttribute(attr) === value) {
        score += 0.2
      }
    }
  }

  // Matching aria-label
  if (context.ariaLabel && element.getAttribute('aria-label') === context.ariaLabel) {
    score += 0.2
  }

  // Matching classes
  if (context.classes) {
    const elClasses = Array.from(element.classList)
    const matchingClasses = context.classes.filter((c) => elClasses.includes(c))
    score += (matchingClasses.length / context.classes.length) * 0.2
  }

  return Math.min(score, 1)
}

/**
 * Generate repair suggestions for a broken selector
 */
export function suggestRepairs(
  brokenSelector: string,
  doc: Document
): SelectorSuggestion[] {
  const context = parseSelector(brokenSelector)
  const candidates = findSimilarElements(doc, context)

  return candidates.map((element) => {
    const selector = generateStableSelector(element)
    const confidence = calculateConfidence(element, context)

    // Generate reason
    const reasons: string[] = []
    if (element.id) reasons.push('Has ID')
    if (element.getAttribute('data-testid')) reasons.push('Has data-testid')
    if (element.getAttribute('aria-label') === context.ariaLabel) reasons.push('Same aria-label')
    if (context.classes?.some((c) => element.classList.contains(c))) reasons.push('Similar classes')

    return {
      selector,
      confidence,
      reason: reasons.join(', ') || 'Similar structure',
      element,
    }
  })
}
