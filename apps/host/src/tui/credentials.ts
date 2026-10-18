import { AsyncEntry } from '@napi-rs/keyring';
export interface CredentialStore {
  get(account: string): Promise<string>;
  set(account: string, key: string): Promise<void>;
}

const entry = (account: string) => new AsyncEntry('Web3MCP Compatible Host', account,
  { linux: { store: 'secret-service' } });

export const keychainCredentials: CredentialStore = {
  async get(provider) { return (await entry(provider).getPassword()) || ''; },
  async set(provider, key) { await entry(provider).setPassword(key); },
};
