import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'js',
    emptyOutDir: false,
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(new URL('.', import.meta.url).pathname, 'src/bootstrap.ts'),
      output: {
        format: 'iife',
        entryFileNames: () => `bootstrap.iife.js`,
        assetFileNames: (asset) => `${asset.name}`,
        chunkFileNames: (chunk) => `${chunk.name}.js`,
      },
    },
    target: 'es2019',
  },
});
