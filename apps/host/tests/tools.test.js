import test, { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { Connection } from '@solana/web3.js';
import { Web3McpHost } from '../dist/index.js';
import { validateConfigSchema } from '@web3mcp/protocol/validator';

describe('Web3McpHost: Protocol-Strict Tool Descriptors & LLM Export (Ticket 02)', () => {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  const REFERENCE_PROGRAM_ID = 'GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv';

  let host;

  before(async () => {
    host = new Web3McpHost({ connection });
    await host.discover(REFERENCE_PROGRAM_ID);
  });

  it('retrieves all discovered tools via getTools()', () => {
    const tools = host.getTools();
    assert.ok(Array.isArray(tools));
    assert.equal(tools.length, 4);

    const names = tools.map((t) => t.name);
    assert.deepEqual(names.sort(), ['deposit', 'get_vault', 'initialize', 'withdraw'].sort());
  });

  it('filters tools by programId', () => {
    const tools = host.getTools(REFERENCE_PROGRAM_ID);
    assert.equal(tools.length, 4);

    const nonExistentId = '11111111111111111111111111111111';
    assert.throws(
      () => host.getTools(nonExistentId),
      /has not been discovered/i
    );
  });

  it('ensures each tool descriptor strictly abides by protocol JSON format', () => {
    const tools = host.getTools(REFERENCE_PROGRAM_ID);

    for (const tool of tools) {
      assert.ok(typeof tool.name === 'string');
      assert.match(tool.name, /^[a-z][a-z0-9_]{0,63}$/);
      assert.ok(typeof tool.description === 'string');
      assert.ok(tool.inputSchema, `Tool ${tool.name} must have inputSchema`);
      assert.equal(tool.inputSchema.type, 'object');
      assert.equal(tool.inputSchema.additionalProperties, false);
      assert.ok(tool.solana, `Tool ${tool.name} must have solana binding`);
      assert.ok(['instruction', 'accountRead'].includes(tool.solana.kind));

      if (tool.solana.kind === 'instruction') {
        assert.ok(tool.solana.effects, `Instruction tool ${tool.name} must have effects`);
        assert.equal(typeof tool.solana.effects.stateChanging, 'boolean');
      } else if (tool.solana.kind === 'accountRead') {
        assert.equal(tool.solana.effects, undefined, 'accountRead tool must NOT have effects');
      }

      // Validates against protocol schema envelope wrapper
      const dummyConfig = {
        standard: 'web3mcp',
        version: '0.1.0',
        programId: REFERENCE_PROGRAM_ID,
        idl: { version: '0.1.0', name: 'test', instructions: [], accounts: [] },
        tools: [tool],
      };
      const schemaCheck = validateConfigSchema(dummyConfig);
      assert.ok(schemaCheck.valid, `Tool ${tool.name} failed schema check: ${schemaCheck.errors?.join(', ')}`);
    }
  });

  it('retrieves an individual tool by name via getTool()', () => {
    const tool = host.getTool('deposit');
    assert.ok(tool);
    assert.equal(tool.name, 'deposit');
    assert.equal(tool.solana.kind, 'instruction');

    assert.throws(() => host.getTool('non_existent_tool'), /Tool 'non_existent_tool' not found/i);
  });

  it('exports tools to standard OpenAI function calling format via toOpenAiTools()', () => {
    const openAiTools = host.toOpenAiTools();
    assert.ok(Array.isArray(openAiTools));
    assert.equal(openAiTools.length, 4);

    for (const openAiTool of openAiTools) {
      assert.equal(openAiTool.type, 'function');
      assert.ok(openAiTool.function);
      assert.ok(typeof openAiTool.function.name === 'string');
      assert.ok(typeof openAiTool.function.description === 'string');
      assert.ok(openAiTool.function.parameters);
      assert.equal(openAiTool.function.parameters.type, 'object');
      assert.equal(openAiTool.function.parameters.additionalProperties, false);
    }

    const depositTool = openAiTools.find((t) => t.function.name === 'deposit');
    assert.ok(depositTool);
    assert.ok(depositTool.function.parameters.properties.amount);
  });
});
