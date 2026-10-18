import { existsSync, readdirSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function discoverWalletPaths(home = os.homedir(), env = process.env): string[] {
  const root = path.join(home, '.config', 'solana');
  const paths = [env.SOLANA_KEYPAIR, env.SOLANA_KEYPAIR_PATH, env.ANCHOR_WALLET, path.join(root, 'id.json')];
  function scan(directory: string, depth: number) {
    try {
      for (const item of readdirSync(directory, { withFileTypes: true })) {
        const location = path.join(directory, item.name);
        if (item.isFile() && item.name.endsWith('.json')) paths.push(location);
        else if (item.isDirectory() && depth > 0) scan(location, depth - 1);
      }
    } catch { /* A missing or unreadable wallet directory is normal. */ }
  }
  scan(root, 1);
  return [...new Set(paths.filter((value): value is string => Boolean(value)).map(value =>
    path.resolve(value.startsWith('~/') ? path.join(home, value.slice(2)) : value)))].filter(value => {
      try { return existsSync(value) && statSync(value).isFile(); } catch { return false; }
    });
}
