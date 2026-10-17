import OpenAI from 'openai';
import { LlmError } from '../errors.js';

/**
 * Universal OpenAI-compatible driver covering OpenAI, Gemini, Groq, DeepSeek, and Ollama.
 * Uses HTTP Server-Sent Events (SSE) streaming for real-time token delivery to the terminal.
 */
export class OpenAiCompatibleDriver {
  client: OpenAI;
  model: string;

  constructor({
    apiKey,
    baseURL,
    model,
    defaultHeaders = {},
  }: {
    apiKey?: string;
    baseURL?: string;
    model?: string;
    defaultHeaders?: Record<string, string>;
  }) {
    if (!model) {
      throw new LlmError('A model name must be explicitly specified (e.g. via options.model, --model, or LLM_MODEL).');
    }
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || 'ollama',
      baseURL: baseURL || process.env.OPENAI_BASE_URL,
      defaultHeaders,
    });
    this.model = model;
  }

  async chat({ messages, tools = [], onToken, temperature = 0.2, maxTokens = 1024 }) {
    try {
      const formattedTools = tools.length > 0 ? tools : undefined;

      // Initiates HTTP Server-Sent Events (SSE) stream via `stream: true`
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: formattedTools,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      let content = '';
      const toolCallsMap = new Map();

      // Consumes SSE events as they arrive over the wire
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          content += delta.content;
          if (onToken) onToken(delta.content);
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const index = tc.index;
            if (!toolCallsMap.has(index)) {
              toolCallsMap.set(index, {
                id: tc.id || `call_${index}`,
                name: tc.function?.name || '',
                argumentsStr: '',
              });
            }
            const current = toolCallsMap.get(index);
            if (tc.id) current.id = tc.id;
            if (tc.function?.name) current.name += tc.function.name;
            if (tc.function?.arguments) current.argumentsStr += tc.function.arguments;
          }
        }
      }

      const toolCalls = [];
      for (const call of toolCallsMap.values()) {
        let parsedArgs = {};
        if (call.argumentsStr) {
          try {
            parsedArgs = JSON.parse(call.argumentsStr);
          } catch {
            parsedArgs = {};
          }
        }
        toolCalls.push({
          id: call.id,
          name: call.name,
          arguments: parsedArgs,
        });
      }

      return {
        role: 'assistant',
        content,
        toolCalls,
      };
    } catch (err) {
      throw new LlmError(`OpenAI completion failed: ${err.message}`, err);
    }
  }
}
