import Anthropic from '@anthropic-ai/sdk';
import { LlmError } from '../errors.js';

/**
 * Native Anthropic Claude driver with tool calling & Server-Sent Events (SSE) streaming.
 */
export class AnthropicDriver {
  client: Anthropic;
  model: string;

  constructor({ apiKey, model, baseURL }: { apiKey?: string; model?: string; baseURL?: string }) {
    if (!model) {
      throw new LlmError('A model name must be explicitly specified (e.g. via options.model, --model, or LLM_MODEL).');
    }
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      baseURL,
    });
    this.model = model;
  }

  async chat({ messages, tools = [], onToken, temperature = 0.2, maxTokens = 1024, signal }) {
    try {
      // Extract system messages into Anthropic system parameter
      let systemPrompt = '';
      const anthropicMessages = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemPrompt += (systemPrompt ? '\n\n' : '') + msg.content;
        } else if (msg.role === 'user') {
          anthropicMessages.push({ role: 'user', content: msg.content });
        } else if (msg.role === 'assistant') {
          if (msg.tool_calls && msg.tool_calls.length > 0) {
            const contentBlocks = [];
            if (msg.content) {
              contentBlocks.push({ type: 'text', text: msg.content });
            }
            for (const tc of msg.tool_calls) {
              const args = tc.function?.arguments ?? tc.arguments ?? {};
              contentBlocks.push({
                type: 'tool_use',
                id: tc.id,
                name: tc.name || tc.function?.name,
                input: typeof args === 'string' ? JSON.parse(args) : args,
              });
            }
            anthropicMessages.push({ role: 'assistant', content: contentBlocks });
          } else {
            anthropicMessages.push({ role: 'assistant', content: msg.content || '' });
          }
        } else if (msg.role === 'tool') {
          const result = { type: 'tool_result', tool_use_id: msg.tool_call_id,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) };
          const previous = anthropicMessages.at(-1);
          if (previous?.role === 'user' && Array.isArray(previous.content)) previous.content.push(result);
          else anthropicMessages.push({ role: 'user', content: [result] });
        }
      }

      // Map OpenAI tools to Anthropic format
      const anthropicTools = tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }));

      // Initiates Server-Sent Events (SSE) stream via `stream: true`
      const stream = await this.client.messages.create({
        model: this.model,
        system: systemPrompt || undefined,
        messages: anthropicMessages,
        tools: anthropicTools.length > 0 ? anthropicTools : undefined,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }, { signal });

      let content = '';
      const toolCalls = [];
      let currentToolUse = null;

      // Consumes incoming SSE events from Anthropic API
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_start') {
          if (chunk.content_block?.type === 'tool_use') {
            currentToolUse = {
              id: chunk.content_block.id,
              name: chunk.content_block.name,
              jsonStr: '',
            };
          }
        } else if (chunk.type === 'content_block_delta') {
          if (chunk.delta?.type === 'text_delta') {
            content += chunk.delta.text;
            if (onToken) onToken(chunk.delta.text);
          } else if (chunk.delta?.type === 'input_json_delta') {
            if (currentToolUse) {
              currentToolUse.jsonStr += chunk.delta.partial_json;
            }
          }
        } else if (chunk.type === 'content_block_stop') {
          if (currentToolUse) {
            let parsedArgs = {};
            try {
              parsedArgs = JSON.parse(currentToolUse.jsonStr || '{}');
            } catch {
              throw new LlmError(`Model returned invalid JSON arguments for tool '${currentToolUse.name}'.`);
            }
            toolCalls.push({
              id: currentToolUse.id,
              name: currentToolUse.name,
              arguments: parsedArgs,
            });
            currentToolUse = null;
          }
        }
      }

      return {
        role: 'assistant',
        content,
        toolCalls,
      };
    } catch (err) {
      throw new LlmError(`Anthropic completion failed: ${err.message}`, err);
    }
  }
}
