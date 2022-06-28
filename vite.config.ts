import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      components: resolve(__dirname, 'src/components'),
      pages: resolve(__dirname, 'src/pages'),
      services: resolve(__dirname, 'src/services'),
      utilities: resolve(__dirname, 'src/utilities'),
      style: resolve(__dirname, 'src/style'),
      hooks: resolve(__dirname, 'src/hooks'),
      types: resolve(__dirname, 'src/types'),
    },
  },
});
