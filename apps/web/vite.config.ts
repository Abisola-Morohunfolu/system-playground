import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const workspaceEntry = (relativePath: string) =>
  fileURLToPath(new URL(relativePath, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@system-playground/engine': workspaceEntry(
        '../../packages/engine/src/index.ts',
      ),
      '@system-playground/shared': workspaceEntry(
        '../../packages/shared/src/index.ts',
      ),
      '@system-playground/simulations': workspaceEntry(
        '../../packages/simulations/src/index.ts',
      ),
      '@system-playground/ui': workspaceEntry('../../packages/ui/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
  build: {
    outDir: '../../public',
  }
});
