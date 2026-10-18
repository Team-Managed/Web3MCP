import test from 'node:test';
import assert from 'node:assert/strict';
import { extractProgramReference, resolveProgramReference } from '../dist/tui/program-ref.js';

const program = '9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD';
const otherAddress = 'Bp9Va3Qx9oFwme5uuXhDMdh2uUf3o8YHDBwcg4VYxc2L';

test('finds an explicit program ID even when a wallet address is also in the request', () => {
  assert.deepEqual(extractProgramReference(`Read vault ${otherAddress} using program ID ${program}`),
    { kind: 'program', value: program });
});

test('finds a single program ID or SNS name in natural language', () => {
  assert.deepEqual(extractProgramReference(`Deposit 1000 lamports into ${program}.`),
    { kind: 'program', value: program });
  assert.deepEqual(extractProgramReference('Use vault-demo.sns to read my vault'),
    { kind: 'domain', value: 'vault-demo.sns' });
});

test('rejects ambiguous addresses and unsupported legacy .sol resolution', async () => {
  assert.throws(() => extractProgramReference(`Use ${program} and ${otherAddress}`), /multiple addresses/i);
  await assert.rejects(resolveProgramReference({ kind: 'domain', value: 'vault-demo.sol' }), /\.sol.*not supported/i);
});

test('resolves an SNS name to a program ID before on-chain SDK discovery', async () => {
  const resolved = await resolveProgramReference({ kind: 'domain', value: 'vault-demo.sns' },
    async domain => {
      assert.equal(domain, 'vault-demo.sns');
      return program;
    });
  assert.equal(resolved, program);
});
