import { describe, it, expect, vi } from 'vitest'
import { findElement, isElementVisible, scrollToElement, escapeHtml, createElement } from './dom'
import { appendElement } from './test/fixtures'

describe('findElement', () => {
  it('returns element for valid selector', () => {
    const el = appendElement('find-test')
    expect(findElement('#find-test')).toBe(el)
  })

  it('returns null for invalid selector without throwing', () => {
    expect(() => findElement('!@#invalid')).not.toThrow()
    expect(findElement('!@#invalid')).toBeNull()
  })

  it('returns null for selector with no matching element', () => {
    expect(findElement('#does-not-exist')).toBeNull()
  })
})

describe('isElementVisible', () => {
  it('returns true for element with real dimensions', () => {
    const el = appendElement('visible-test')
    expect(isElementVisible(el)).toBe(true)
  })

  it('returns false for element with width=0', () => {
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({
      width: 0, height: 50, top: 0, left: 0, right: 0, bottom: 50, x: 0, y: 0, toJSON: () => ({}),
    })
    document.body.appendChild(el)
    expect(isElementVisible(el)).toBe(false)
  })

  it('returns false for element with height=0', () => {
    const el = document.createElement('div')
    el.getBoundingClientRect = () => ({
      width: 100, height: 0, top: 0, left: 0, right: 100, bottom: 0, x: 0, y: 0, toJSON: () => ({}),
    })
    document.body.appendChild(el)
    expect(isElementVisible(el)).toBe(false)
  })

  it('returns false for element with visibility:hidden', () => {
    const el = appendElement('hidden-test')
    el.style.visibility = 'hidden'
    expect(isElementVisible(el)).toBe(false)
  })

  it('returns false for element with display:none', () => {
    const el = appendElement('none-test')
    el.style.display = 'none'
    expect(isElementVisible(el)).toBe(false)
  })

  it('returns false for element with opacity:0', () => {
    const el = appendElement('opacity-test')
    el.style.opacity = '0'
    expect(isElementVisible(el)).toBe(false)
  })
})

describe('scrollToElement', () => {
  it('calls scrollIntoView with correct options', () => {
    const el = document.createElement('div')
    el.scrollIntoView = vi.fn()
    scrollToElement(el)
    expect(el.scrollIntoView).toHaveBeenCalledWith({
      block: 'center',
      inline: 'nearest',
    })
  })
})

describe('escapeHtml', () => {
  it('handles empty string safely', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('returns plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })

  it('returns a string for HTML input', () => {
    const result = escapeHtml('<script>alert(1)</script>')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns a string for XSS payloads', () => {
    const result = escapeHtml('<img src=x onerror=alert(1)>')
    expect(typeof result).toBe('string')
  })
})

describe('createElement', () => {
  it('creates element with correct tag', () => {
    const el = createElement('span')
    expect(el.tagName).toBe('SPAN')
  })

  it('sets className when provided', () => {
    const el = createElement('div', 'my-class')
    expect(el.className).toBe('my-class')
  })

  it('appends to parent when provided', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)
    const child = createElement('p', 'child', parent)
    expect(parent.contains(child)).toBe(true)
  })
})
