/**
 * Base error class for all Web3MCP Host operations.
 */
export class Web3McpHostError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'Web3McpHostError';
    if (cause) this.cause = cause;
  }
}

/**
 * Thrown when program discovery or Config PDA fetching fails.
 */
export class DiscoveryError extends Web3McpHostError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'DiscoveryError';
  }
}

/**
 * Thrown when the on-chain configuration fails schema or semantic validation.
 */
export class ConfigValidationError extends Web3McpHostError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Thrown when account resolution for an instruction or query fails.
 */
export class AccountResolutionError extends Web3McpHostError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'AccountResolutionError';
  }
}

/**
 * Thrown when an account violates ownership or authorization constraints.
 */
export class AccountSecurityError extends Web3McpHostError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'AccountSecurityError';
  }
}

/**
 * Thrown when an account's 8-byte Anchor discriminator does not match the expected type.
 */
export class AccountDiscriminatorMismatchError extends Web3McpHostError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'AccountDiscriminatorMismatchError';
  }
}

/**
 * Thrown when transaction simulation returns an error or failure log.
 */
export class SimulationError extends Web3McpHostError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'SimulationError';
  }
}

/**
 * Thrown when a requested tool is not found in the registry.
 */
export class ToolNotFoundError extends Web3McpHostError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'ToolNotFoundError';
  }
}

/**
 * Thrown when arguments fail validation against the tool's inputSchema.
 */
export class ValidationError extends Web3McpHostError {
  constructor(message, cause) {
    super(message, cause);
    this.name = 'ValidationError';
  }
}

