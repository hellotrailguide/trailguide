import { defineConfig } from 'vitest/config'
import path from 'path'
import { config } from 'dotenv'

config({ path: '.env.integration' })

export default defineConfig({
  test: {
    name: 'editor-integration',
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.integration.test.ts'],
    testTimeout: 30_000, // real API calls need more time
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
