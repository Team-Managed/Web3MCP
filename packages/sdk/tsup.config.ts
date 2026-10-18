import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', errors: 'src/errors.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
});
