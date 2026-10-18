import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Settings } from './settings.js';

export type Preferences = Pick<Settings, 'provider' | 'model' | 'walletPath' | 'rpcUrl'>;

export const preferencesPath = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
  'web3mcp', 'settings.json');

export function loadPreferences(file = preferencesPath): Partial<Preferences> {
  if (!existsSync(file)) return {};
  const saved = JSON.parse(readFileSync(file, 'utf8'));
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('Invalid Web3MCP settings file.');
  const result: Partial<Preferences> = {};
  if (['openai', 'anthropic', 'gemini', 'groq', 'ollama'].includes(saved.provider)) result.provider = saved.provider;
  if (typeof saved.model === 'string') result.model = saved.model;
  if (typeof saved.walletPath === 'string') result.walletPath = saved.walletPath;
  if (typeof saved.rpcUrl === 'string' && ['http:', 'https:'].includes(new URL(saved.rpcUrl).protocol)) result.rpcUrl = saved.rpcUrl;
  return result;
}

export function savePreferences(settings: Preferences, file = preferencesPath): void {
  const directory = path.dirname(file);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
  const { provider, model, walletPath, rpcUrl } = settings;
  writeFileSync(file, JSON.stringify({ provider, model, walletPath, rpcUrl }, null, 2) + '\n', { mode: 0o600 });
  chmodSync(file, 0o600);
}
