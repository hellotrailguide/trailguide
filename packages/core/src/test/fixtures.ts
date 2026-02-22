import type { Trail, Step } from '../types'

let stepCounter = 0
let trailCounter = 0

export function makeStep(overrides: Partial<Step> = {}): Step {
  const id = `step-${++stepCounter}`
  return {
    id,
    target: `#${id}`,
    placement: 'bottom',
    title: `Step ${stepCounter}`,
    content: `Content for step ${stepCounter}`,
    ...overrides,
  }
}

export function makeTrail(
  overrides: Partial<Omit<Trail, 'steps'>> & { steps?: Step[] } = {}
): Trail {
  const id = `trail-${++trailCounter}`
  return {
    id,
    title: `Trail ${trailCounter}`,
    version: '1.0.0',
    steps: overrides.steps ?? [makeStep()],
    ...overrides,
  }
}

/**
 * Append an element with a given id to document.body.
 * Overrides getBoundingClientRect so happy-dom elements appear visible.
 */
export function appendElement(id: string): HTMLElement {
  const el = document.createElement('div')
  el.id = id

  el.getBoundingClientRect = () => ({
    width: 100,
    height: 50,
    top: 100,
    left: 100,
    right: 200,
    bottom: 150,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  })

  document.body.appendChild(el)
  return el
}
