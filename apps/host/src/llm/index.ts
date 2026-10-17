import { LlmError } from './errors.js';
import { compactToolResult } from './compactor.js';
import { OpenAiCompatibleDriver } from './drivers/openai.js';
import { AnthropicDriver } from './drivers/anthropic.js';

let envLoaded = false;
function ensureEnvLoaded() {
  if (!envLoaded) {
    envLoaded = true;
    if (typeof process.loadEnvFile === 'function') {
      try {
        process.loadEnvFile();
      } catch {}
    }
  }
}

export interface CreateLlmClientOptions {
  provider?: 'gemini' | 'openai' | 'anthropic' | 'groq' | 'ollama';
  model?: string;
  apiKey?: string;
  baseURL?: string;
}

/**
 * Factory function creating an appropriate LlmClient instance based on parameters and environment variables.
 */
export function createLlmClient(options: CreateLlmClientOptions = {}): OpenAiCompatibleDriver | AnthropicDriver {
  ensureEnvLoaded();

  const provider =
    options.provider ||
    (process.env.GEMINI_API_KEY ? 'gemini' : null) ||
    (process.env.ANTHROPIC_API_KEY ? 'anthropic' : null) ||
    (process.env.GROQ_API_KEY ? 'groq' : null) ||
    'openai';

  const model =
    options.model ||
    process.env.LLM_MODEL ||
    process.env.MODEL ||
    (provider === 'gemini' ? process.env.GEMINI_MODEL : null) ||
    (provider === 'anthropic' ? process.env.ANTHROPIC_MODEL : null) ||
    (provider === 'groq' ? process.env.GROQ_MODEL : null) ||
    (provider === 'ollama' ? process.env.OLLAMA_MODEL : null) ||
    (provider === 'openai' ? process.env.OPENAI_MODEL : null);

  if (!model) {
    throw new LlmError(
      `No model specified for provider '${provider}'. Provide a model via options.model, --model, or the LLM_MODEL (or ${provider.toUpperCase()}_MODEL) environment variable.`
    );
  }

  if (provider === 'gemini') {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new LlmError(
        'Gemini provider requested but GEMINI_API_KEY is not set in environment or options.'
      );
    }
    return new OpenAiCompatibleDriver({
      apiKey,
      baseURL: options.baseURL || 'https://generativelanguage.googleapis.com/v1beta/openai/',
      model,
    });
  }

  if (provider === 'anthropic') {
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new LlmError(
        'Anthropic provider requested but ANTHROPIC_API_KEY is not set in environment or options.'
      );
    }
    return new AnthropicDriver({
      apiKey,
      model,
    });
  }

  if (provider === 'groq') {
    const apiKey = options.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new LlmError('Groq provider requested but GROQ_API_KEY is not set in environment or options.');
    }
    return new OpenAiCompatibleDriver({
      apiKey,
      baseURL: options.baseURL || 'https://api.groq.com/openai/v1',
      model,
    });
  }

  if (provider === 'ollama') {
    return new OpenAiCompatibleDriver({
      apiKey: options.apiKey || 'ollama',
      baseURL: options.baseURL || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
      model,
    });
  }

  // Default: OpenAI / generic OpenAI-compatible
  const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey && !options.baseURL && !process.env.OPENAI_BASE_URL) {
    throw new LlmError(
      'OpenAI provider requested but OPENAI_API_KEY is not set. Provide an API key or use Ollama/Groq.'
    );
  }

  return new OpenAiCompatibleDriver({
    apiKey,
    baseURL: options.baseURL || process.env.OPENAI_BASE_URL,
    model,
  });
}

export { compactToolResult, OpenAiCompatibleDriver, AnthropicDriver, LlmError };
