import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'playwright',
    environment: 'node',
    globals: true,
  },
})
