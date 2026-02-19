import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['alpinejs', 'motion'],
  onSuccess: 'cp src/styles/theme.css dist/styles.css',
});
