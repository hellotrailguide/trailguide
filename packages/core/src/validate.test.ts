import { describe, it, expect } from 'vitest'
import { validateTrail } from './validate'
import { appendElement, makeStep, makeTrail } from './test/fixtures'

describe('validateTrail', () => {
  describe('errors', () => {
    it('errors when trail.id is missing', () => {
      const el = appendElement('step-validate-1')
      const trail = makeTrail({ id: '', steps: [makeStep({ target: '#step-validate-1' })] })
      const result = validateTrail(trail)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('"id"'))).toBe(true)
    })

    it('errors when steps array is empty', () => {
      const trail = makeTrail({ steps: [] })
      const result = validateTrail(trail)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.message.includes('no steps'))).toBe(true)
    })

    it('errors when step is missing id', () => {
      appendElement('target-no-id')
      const trail = makeTrail({ steps: [makeStep({ id: '', target: '#target-no-id' })] })
      const result = validateTrail(trail)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'missing_required_field')).toBe(true)
    })

    it('errors when step is missing target', () => {
      const trail = makeTrail({ steps: [makeStep({ target: '' })] })
      const result = validateTrail(trail)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'missing_required_field')).toBe(true)
    })

    it('errors when target element is not found', () => {
      const trail = makeTrail({
        steps: [makeStep({ target: '#does-not-exist-at-all' })],
      })
      const result = validateTrail(trail)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.type === 'missing_target')).toBe(true)
    })
  })

  describe('warnings', () => {
    it('warns when element exists but is hidden (height=0)', () => {
      const el = document.createElement('div')
      el.id = 'hidden-validate'
      // Default getBoundingClientRect returns all zeros in happy-dom → hidden
      document.body.appendChild(el)

      const trail = makeTrail({ steps: [makeStep({ target: '#hidden-validate' })] })
      const result = validateTrail(trail)
      expect(result.warnings.some(w => w.type === 'hidden_target')).toBe(true)
    })

    it('warns for :nth-child selector (unstable)', () => {
      // Use a selector that doesn't start with # (which would short-circuit the check)
      const el = document.createElement('div')
      document.body.appendChild(el)
      const trail = makeTrail({
        steps: [makeStep({ target: 'body > div:nth-child(1)' })],
      })
      const result = validateTrail(trail)
      expect(result.warnings.some(w => w.type === 'unstable_selector')).toBe(true)
    })

    it('warns for :nth-of-type selector (unstable)', () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const trail = makeTrail({
        steps: [makeStep({ target: 'div:nth-of-type(1)' })],
      })
      const result = validateTrail(trail)
      expect(result.warnings.some(w => w.type === 'unstable_selector')).toBe(true)
    })

    it('warns for CSS-module class selectors', () => {
      const el = document.createElement('div')
      el.id = 'css-mod-el'
      el.className = 'MyComponent-header'
      el.getBoundingClientRect = () => ({
        width: 100, height: 50, top: 10, left: 10, right: 110, bottom: 60, x: 10, y: 10, toJSON: () => ({}),
      })
      document.body.appendChild(el)

      const trail = makeTrail({
        steps: [makeStep({ target: '.MyComponent-header' })],
      })
      const result = validateTrail(trail)
      expect(result.warnings.some(w => w.type === 'unstable_selector')).toBe(true)
    })

    it('no warnings for id selector', () => {
      const el = appendElement('stable-id')
      const trail = makeTrail({ steps: [makeStep({ target: '#stable-id' })] })
      const result = validateTrail(trail)
      expect(result.warnings.filter(w => w.type === 'unstable_selector')).toHaveLength(0)
    })

    it('no warnings for data-testid selector', () => {
      const el = document.createElement('div')
      el.id = 'stable-data'
      el.setAttribute('data-testid', 'my-button')
      el.getBoundingClientRect = () => ({
        width: 100, height: 50, top: 10, left: 10, right: 110, bottom: 60, x: 10, y: 10, toJSON: () => ({}),
      })
      document.body.appendChild(el)

      const trail = makeTrail({
        steps: [makeStep({ target: '[data-testid="my-button"]' })],
      })
      const result = validateTrail(trail)
      expect(result.warnings.filter(w => w.type === 'unstable_selector')).toHaveLength(0)
    })
  })

  describe('valid trail', () => {
    it('returns valid with no errors for well-formed trail', () => {
      const el = appendElement('good-target')
      const trail = makeTrail({ steps: [makeStep({ target: '#good-target' })] })
      const result = validateTrail(trail)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
})
