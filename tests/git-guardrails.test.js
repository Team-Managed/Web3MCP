import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

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
