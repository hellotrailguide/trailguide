import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateSelector, validateSelector, highlightElement } from './selectorGenerator'

function el(tag: string, attrs: Record<string, string> = {}, text?: string): HTMLElement {
  const element = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    element.setAttribute(k, v)
  }
  if (text) element.textContent = text
  document.body.appendChild(element)
  return element
}

describe('generateSelector', () => {
  describe('Priority 1: id', () => {
    it('returns #id when element has id', () => {
      const element = el('div', { id: 'my-element' })
      expect(generateSelector(element)).toBe('#my-element')
    })
  })

  describe('Priority 2: data-trail-id', () => {
    it('returns [data-trail-id="x"] when present', () => {
      const element = el('div', { 'data-trail-id': 'my-trail' })
      expect(generateSelector(element)).toBe('[data-trail-id="my-trail"]')
    })
  })

  describe('Priority 3: data-testid', () => {
    it('returns [data-testid="x"] when present', () => {
      const element = el('button', { 'data-testid': 'submit-btn' })
      expect(generateSelector(element)).toBe('[data-testid="submit-btn"]')
    })
  })

  describe('Priority 4: data-tour-target', () => {
    it('returns [data-tour-target="x"] when present', () => {
      const element = el('div', { 'data-tour-target': 'hero' })
      expect(generateSelector(element)).toBe('[data-tour-target="hero"]')
    })
  })

  describe('Priority 5: aria-label (unique)', () => {
    it('returns tag[aria-label="x"] when unique', () => {
      // Use an aria-label without spaces to avoid CSS.escape differences
      const element = el('button', { 'aria-label': 'submit' })
      const selector = generateSelector(element)
      expect(selector).toBe('button[aria-label="submit"]')
    })

    it('falls through when aria-label is not unique', () => {
      const e1 = el('button', { 'aria-label': 'Duplicate' })
      const e2 = el('button', { 'aria-label': 'Duplicate' })
      // Both have same label, so it should NOT return the aria-label selector for uniqueness
      const selector = generateSelector(e1)
      expect(selector).not.toBe('button[aria-label="Duplicate"]')
    })
  })

  describe('Priority 6: name attribute (unique)', () => {
    it('returns [name="x"] when unique', () => {
      const element = el('input', { name: 'email', type: 'email' })
      const selector = generateSelector(element)
      expect(selector).toBe('[name="email"]')
    })
  })

  describe('Priority 7: text + stable parent', () => {
    it('returns parent button selector when text is unique under stable parent', () => {
      const parent = el('div', { id: 'parent-nav' })
      const btn = document.createElement('button')
      btn.textContent = 'Get Started'
      parent.appendChild(btn)

      const selector = generateSelector(btn)
      expect(selector).toBe('#parent-nav button')
    })
  })

  describe('Priority 8: unique class', () => {
    it('returns .class when class is unique on page', () => {
      const element = el('div', { class: 'unique-sidebar-panel' })
      const selector = generateSelector(element)
      expect(selector).toContain('unique-sidebar-panel')
    })
  })

  describe('Priority 9: path fallback', () => {
    it('returns a path-based selector as fallback', () => {
      // Element with no id, no data attrs, no name, no unique class, no stable parent
      const element = document.createElement('span')
      document.body.appendChild(element)
      const selector = generateSelector(element)
      expect(selector.length).toBeGreaterThan(0)
      // Should be queryable
      expect(document.querySelector(selector)).not.toBeNull()
    })
  })
})

describe('validateSelector', () => {
  it('returns true for valid selector pointing to existing element', () => {
    const element = el('div', { id: 'validate-me' })
    expect(validateSelector('#validate-me')).toBe(true)
  })

  it('returns false for selector pointing to missing element', () => {
    expect(validateSelector('#totally-missing-element')).toBe(false)
  })

  it('returns false for invalid CSS selector', () => {
    expect(validateSelector('!@#$%invalid')).toBe(false)
  })
})

describe('highlightElement', () => {
  it('sets outline and outline-offset on element', () => {
    const element = el('div', { id: 'highlight-test' })
    highlightElement(element)
    expect(element.style.outline).toContain('solid')
    expect(element.style.outlineOffset).toBe('2px')
  })

  it('cleanup function restores original styles', () => {
    const element = el('div', { id: 'highlight-restore' })
    // Capture original style before highlighting
    const originalOutline = element.style.outline
    const originalOutlineOffset = element.style.outlineOffset

    const cleanup = highlightElement(element)
    // After highlighting, outline should contain the highlight style
    expect(element.style.outline).toContain('solid')

    cleanup()
    // After cleanup, outline should be restored to the original values
    expect(element.style.outline).toBe(originalOutline)
    expect(element.style.outlineOffset).toBe(originalOutlineOffset)
  })
})
