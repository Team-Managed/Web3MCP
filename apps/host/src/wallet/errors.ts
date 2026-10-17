import { Web3McpHostError } from '../errors.js';

export class WalletError extends Web3McpHostError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'WalletError';
  }
}
