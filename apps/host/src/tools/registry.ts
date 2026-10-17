import { DiscoveryError, ToolNotFoundError } from '../errors.js';

/**
 * Retrieves registered tool descriptors across all discovered programs or for a specific programId.
 *
 * @param {Map<string, any>} programs In-memory map of discovered program contexts
 * @param {string} [programId] Optional programId to filter tools
 * @returns {any[]} Array of protocol-compliant tool descriptors
 */
export function queryTools(programs, programId) {
  if (programId) {
    const context = programs.get(programId);
    if (!context) {
      throw new DiscoveryError(`Program '${programId}' has not been discovered.`);
    }
    return context.tools;
  }

  const allTools = [];
  for (const context of programs.values()) {
    allTools.push(...context.tools);
  }
  return allTools;
}

/**
 * Retrieves a specific tool descriptor by name across discovered programs.
 *
 * @param {Map<string, any>} programs In-memory map of discovered program contexts
 * @param {string} name Tool name
 * @param {string} [programId] Optional programId to scope the search
 * @returns {any} Tool descriptor
 */
export function findTool(programs, name, programId) {
  const tools = queryTools(programs, programId);
  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    throw new ToolNotFoundError(
      programId
        ? `Tool '${name}' not found for program '${programId}'.`
        : `Tool '${name}' not found in registered tools.`
    );
  }
  return tool;
}
