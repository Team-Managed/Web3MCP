import { Web3McpHostError } from '../errors.js';

export class LlmError extends Web3McpHostError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'LlmError';
  }
}
