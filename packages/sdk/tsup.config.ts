import { defineConfig } from 'tsup';
import { cpSync } from 'node:fs';

export default defineConfig({
  entry: { index: 'src/index.ts', errors: 'src/errors.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2022',
  outDir: 'dist',
  noExternal: ['@web3mcp/protocol'],
  onSuccess: () => cpSync('../../protocol/schema', 'schema', { recursive: true }),
});
