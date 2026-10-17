import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    errors: 'src/errors.ts',
    'llm/index': 'src/llm/index.ts',
    'wallet/index': 'src/wallet/index.ts',
    'agent/index': 'src/agent/index.ts',
    'ui/index': 'src/ui/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  outDir: 'dist',
  shims: true,
});
