import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/core/vitest.config.ts',
  'packages/runtime/vitest.config.ts',
  'packages/playwright/vitest.config.ts',
])
