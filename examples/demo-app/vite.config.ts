import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@trailguide/core': path.resolve(__dirname, '../../packages/core/src'),
      '@trailguide/runtime': path.resolve(__dirname, '../../packages/runtime/src'),
      '@trailguide/recorder': path.resolve(__dirname, '../../packages/recorder/src'),
    },
  },
});
