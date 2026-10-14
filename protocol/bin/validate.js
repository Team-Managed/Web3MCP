#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateConfig } from '../src/validator.js';

const targetFile = process.argv[2];

if (!targetFile) {
  console.error('Usage: web3mcp-validate <path-to-config-file.json|.bin>');
  process.exit(1);
}

try {
  const filePath = resolve(process.cwd(), targetFile);
  const data = readFileSync(filePath);

  const result = validateConfig(data);

  if (!result.valid) {
    console.error(`❌ Validation failed for ${targetFile}:`);
    for (const err of result.errors || []) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  const toolCount = Array.isArray(result.config?.tools) ? result.config.tools.length : 0;
  console.log(`✅ Web3MCP configuration valid: ${targetFile}`);
  console.log(`   Standard: ${result.config?.standard} v${result.config?.version}`);
  console.log(`   Program ID: ${result.config?.programId}`);
  console.log(`   Tools discovered: ${toolCount}`);
  process.exit(0);
} catch (err) {
  console.error(`❌ Error reading or validating file: ${err.message}`);
  process.exit(1);
}
