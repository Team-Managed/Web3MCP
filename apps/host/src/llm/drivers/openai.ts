import OpenAI from 'openai';
import { LlmError } from '../errors.js';

export interface ChatParams {
  messages: Array<any>;
  tools?: Array<any>;
  onToken?: (token: string) => void;
  temperature?: number;
  maxTokens?: number;
}

type ToolCallDelta = OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall & {
  extra_content?: unknown;
};

interface ToolCallEntry {
  id: string;
  name: string;
  argumentsStr: string;
  extra_content?: unknown;
}

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

  async chat({
    messages,
    tools = [],
    onToken,
    temperature = 0.2,
    maxTokens = 1024,
  }: Partial<ChatParams> = {}) {
    const formattedTools = tools.length > 0 ? (tools as unknown as Array<OpenAI.Chat.Completions.ChatCompletionTool>) : undefined;
    const maxRetries = 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        // Initiates HTTP Server-Sent Events (SSE) stream via `stream: true`
        const stream = await this.client.chat.completions.create({
          model: this.model,
          messages: messages as unknown as Array<OpenAI.Chat.Completions.ChatCompletionMessageParam>,
          tools: formattedTools,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        });

        let content = '';
        const toolCallsMap = new Map<number, ToolCallEntry>();

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
              const deltaTc = tc as ToolCallDelta;
              const index = deltaTc.index;
              if (!toolCallsMap.has(index)) {
                toolCallsMap.set(index, {
                  id: deltaTc.id || `call_${index}`,
                  name: '',
                  argumentsStr: '',
                  extra_content: deltaTc.extra_content,
                });
              }
              const current = toolCallsMap.get(index);
              if (current) {
                if (deltaTc.id) current.id = deltaTc.id;
                if (deltaTc.extra_content) current.extra_content = deltaTc.extra_content;
                if (deltaTc.function?.name) current.name += deltaTc.function.name;
                if (deltaTc.function?.arguments) current.argumentsStr += deltaTc.function.arguments;
              }
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
            ...(call.extra_content ? { extra_content: call.extra_content } : {}),
          });
        }

        return {
          role: 'assistant',
          content,
          toolCalls,
        };
      } catch (err: any) {
        attempt++;
        const isRateLimit = err?.status === 429 || (err?.message && err.message.includes('429'));
        if (isRateLimit && attempt <= maxRetries) {
          let delayMs = 15000;
          const match = err.message?.match(/retry in ([0-9.]+)s/i);
          if (match && match[1]) {
            delayMs = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
          }
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw new LlmError(`OpenAI completion failed: ${err.message}`, err);
      }
    }
    throw new LlmError('OpenAI completion failed: Max retry attempts reached.');
  }
}
