import { Web3McpHostError } from '@web3mcp/sdk/errors';

export class LlmError extends Web3McpHostError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'LlmError';
  }
}
