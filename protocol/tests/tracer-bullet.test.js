import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { validateConfigSchema } from '../src/validator.js';
import { deriveConfigPda } from '../src/pda.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('01: minimal valid config satisfies schema validation', () => {
  const fixturePath = join(__dirname, '../fixtures/valid/minimal.json');
  const fixtureJson = JSON.parse(readFileSync(fixturePath, 'utf8'));

  const result = validateConfigSchema(fixtureJson);
  assert.equal(result.valid, true, `Validation failed: ${JSON.stringify(result.errors)}`);
  assert.equal(result.errors, undefined);
});

test('01: deriveConfigPda produces deterministic PDA address and bump', () => {
  const vector1 = {
    programId: '11111111111111111111111111111111',
    expectedPda: 'AZZ2qxVL97rRZ8EPQZxoA6Mafb4Ya3N7pL8kkHXxEPRP',
    expectedBump: 253,
  };

  const vector2 = {
    programId: 'Vau1t11111111111111111111111111111111111111',
    expectedPda: '3KXsRFy9vStHfs24d6nbqhPPso2yCYyYqynZ5NzBEhUA',
    expectedBump: 254,
  };

  const res1 = deriveConfigPda(vector1.programId);
  assert.equal(res1.pda, vector1.expectedPda);
  assert.equal(res1.bump, vector1.expectedBump);

  const res2 = deriveConfigPda(vector2.programId);
  assert.equal(res2.pda, vector2.expectedPda);
  assert.equal(res2.bump, vector2.expectedBump);
});
