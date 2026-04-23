import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // `server-only` is unreachable from test files under pnpm's strict
      // hoisting — stub it so server modules can be imported directly.
      'server-only': path.resolve(__dirname, './src/test/stubs/server-only.ts'),
    },
  },
});
