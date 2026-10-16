import { Web3McpHostError } from '../errors.js';

export class LlmError extends Web3McpHostError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'LlmError';
  }
}
