import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Trailguide } from './Trailguide'
import type { Trail } from '@trailguide/core'

const mockInstance = {
  start: vi.fn(),
  stop: vi.fn(),
  next: vi.fn(),
  prev: vi.fn(),
  skip: vi.fn(),
  goToStep: vi.fn(),
}

vi.mock('@trailguide/core', async (orig) => {
  const actual = await orig<typeof import('@trailguide/core')>()
  return {
    ...actual,
    Trailguide: vi.fn(() => mockInstance),
  }
})

const trail1: Trail = {
  id: 'trail-a',
  title: 'Trail A',
  version: '1.0.0',
  steps: [{ id: 's0', target: '#a', placement: 'bottom', title: 'S0', content: 'c0' }],
}

const trail2: Trail = {
  id: 'trail-b',
  title: 'Trail B',
  version: '1.0.0',
  steps: [{ id: 's0', target: '#b', placement: 'top', title: 'S0', content: 'c0' }],
}

describe('<Trailguide />', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders null (no DOM output)', () => {
    const { container } = render(<Trailguide trail={trail1} />)
    expect(container.firstChild).toBeNull()
  })

  it('calls instance.start on mount', () => {
    render(<Trailguide trail={trail1} />)
    expect(mockInstance.start).toHaveBeenCalledWith(trail1)
  })

  it('calls instance.stop on unmount', () => {
    const { unmount } = render(<Trailguide trail={trail1} />)
    unmount()
    expect(mockInstance.stop).toHaveBeenCalled()
  })

  it('starts new instance when trail prop changes', () => {
    const { rerender } = render(<Trailguide trail={trail1} />)
    expect(mockInstance.start).toHaveBeenCalledWith(trail1)

    rerender(<Trailguide trail={trail2} />)
    expect(mockInstance.start).toHaveBeenCalledWith(trail2)
  })
})
