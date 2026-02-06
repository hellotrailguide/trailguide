import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Trailguide',
      formats: ['es', 'umd'],
      fileName: (format) => format === 'es' ? 'trailguide.js' : 'trailguide.umd.js',
    },
    cssFileName: 'trailguide',
  },
});
