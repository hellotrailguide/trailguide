import { vi, afterEach } from 'vitest'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
  cookies: vi.fn(() => ({
    get: vi.fn(() => undefined),
    set: vi.fn(),
    remove: vi.fn(),
  })),
}))

afterEach(() => {
  vi.clearAllMocks()
})
