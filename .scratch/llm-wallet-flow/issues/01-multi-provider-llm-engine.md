# 01: Universal Multi-Provider LLM Engine & Streaming Token Support

**What to build:** Build the universal `LlmClient` in `apps/host/src/llm.js` supporting the standard OpenAI Chat Completions API (OpenAI, Groq, DeepSeek, local Ollama/vLLM) and Anthropic Claude Messages API. Implement an auto-discovery mechanism that detects available provider credentials from environment variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `OPENAI_BASE_URL`), feeds Web3MCP's native JSON Schema tools directly to the model without Zod conversion, supports sub-200ms real-time token streaming to stdout, and compacts Solana simulation logs for conversation history.

**Blocked by:** none

**Status:** complete

- [x] Add `openai` and `@anthropic-ai/sdk` to `apps/host/package.json` dependencies.
- [x] Implement `createLlmClient({ provider, model, apiKey, baseUrl })` in `apps/host/src/llm.js` that automatically chooses the active provider based on environment variables or explicit flags.
- [x] Support custom base URLs (`OPENAI_BASE_URL` or `--base-url`) to seamlessly route to Groq (`https://api.groq.com/openai/v1`), Ollama (`http://localhost:11434/v1`), DeepSeek, or local vLLM instances.
- [x] Consume Web3MCP protocol tools directly via `host.toOpenAiTools(programId)` without intermediate Zod schema wrappers.
- [x] Implement token streaming via Server-Sent Events (SSE) piping text deltas to an `onToken` callback for real-time terminal rendering.
- [x] Unit test suite in `apps/host/tests/llm.test.js` verifying multi-provider resolution (Gemini, Groq, Ollama, Anthropic, OpenAI), fail-closed error handling, and simulation log compaction without fake mock scripts.

