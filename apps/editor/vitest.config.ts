import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'editor',
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    env: {
      NODE_ENV: 'production',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
