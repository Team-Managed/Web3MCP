import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const hook = new URL('../.agents/skills/git-guardrails-claude-code/scripts/block-dangerous-git.sh', import.meta.url);

for (const command of [
  'git push origin main',
  'git -C /workspace/repo push origin main',
  'git -C "/workspace/my repo" push origin main',
  'git -c user.name=test push origin main',
  'git --git-dir=/workspace/repo/.git push origin main',
  'git --no-pager push origin main',
  'git clean -df',
  'git clean -d -f',
  'git clean --force -d',
  'git -C /workspace/repo clean -n -d -f',
  '/usr/bin/git push origin main',
  './git clean -df',
  '"/opt/git tools/git" push origin main',
]) {
  test(`git guardrail blocks ${command}`, () => {
    const result = spawnSync('bash', [hook.pathname], { input: JSON.stringify({ tool_input: { command } }), encoding: 'utf8' });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /BLOCKED/);
  });
}

test('git guardrail allows read-only commands with global options', () => {
  const result = spawnSync('bash', [hook.pathname], { input: JSON.stringify({ tool_input: { command: 'git -C /workspace/repo status' } }), encoding: 'utf8' });
  assert.equal(result.status, 0);
});

test('git guardrail fails closed when jq cannot parse the hook input', () => {
  const bin = mkdtempSync(join(tmpdir(), 'web3mcp-jq-'));
  try {
    writeFileSync(join(bin, 'jq'), '#!/bin/sh\nexit 127\n', { mode: 0o755 });
    const result = spawnSync('bash', [hook.pathname], {
      input: JSON.stringify({ tool_input: { command: 'git push origin main' } }),
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /BLOCKED|parse/i);
  } finally {
    rmSync(bin, { recursive: true, force: true });
  }
});
