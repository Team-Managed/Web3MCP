/**
 * Converts registered Web3MCP tool descriptors into the standard OpenAI tool/function calling format.
 *
 * @param {Array<any>} tools Array of Web3MCP tool descriptors
 * @returns {Array<{ type: 'function', function: { name: string, description: string, parameters: any } }>}
 */
export function formatOpenAiTools(tools = []) {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));
}
