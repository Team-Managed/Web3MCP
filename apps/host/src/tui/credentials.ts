import { AsyncEntry } from '@napi-rs/keyring';
import type { Provider } from './settings.js';

export interface CredentialStore {
  get(provider: Provider): Promise<string>;
  set(provider: Provider, key: string): Promise<void>;
}

const entry = (provider: Provider) => new AsyncEntry('Web3MCP Compatible Host', provider,
  { linux: { store: 'secret-service' } });

export const keychainCredentials: CredentialStore = {
  async get(provider) { return (await entry(provider).getPassword()) || ''; },
  async set(provider, key) { await entry(provider).setPassword(key); },
};
