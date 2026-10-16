# In-Memory Tool Registry and Deferred Cache Invalidation

## Context

When a generic Web3MCP host discovers a Solana program via `host.discover(programId)`, it queries standard Solana RPC for the program's executable status and canonical Config PDA, validates its SHA-256 digest and protocol schema, compiles dynamic Anchor instruction and account Borsh coders, and indexes the resulting tool descriptors. We must evaluate whether maintaining these tool descriptors and runtime coders in an in-memory `Map` is the appropriate architecture for the product, compared against querying on-demand on every tool call, persisting to external storage, or introducing automatic background cache eviction.

## Decision

For Web3MCP v0.1, the host runtime stores discovered program contexts, tool descriptors, and compiled Borsh coders strictly in-memory per host instance (`Map<string, ProgramContext>`). 

Automated time-to-live (TTL) cache eviction, background polling of on-chain account slots, and external persistent storage adapters (such as Redis, IndexedDB, or filesystem caches) are deferred to subsequent product milestones.

## Rationale

1. **Sub-millisecond Latency & RPC Rate Limits:**
   Querying Solana RPC for the Config PDA and running binary/schema validation on every LLM reasoning step or tool call would introduce 200–500ms of network latency per turn and rapidly trigger `429 Too Many Requests` on public and private RPC endpoints. In-memory indexing provides instantaneous (< 0.1ms) lookups for argument validation, discriminator checking, and instruction encoding.

2. **Negligible Memory Footprint:**
   The Web3MCP protocol strictly caps on-chain Config PDAs at 64 KiB. Indexing 100 distinct Solana programs consumes under 10 MB of memory (including parsed Anchor IDLs and dynamic coders). This minimal footprint allows the runtime to function identically across Node.js servers, desktop CLI utilities, mobile agents, and browser-based Web3 agent interfaces without requiring external database infrastructure.

3. **Runtime Coder Objects:**
   Borsh instruction and account coders dynamically instantiated from the on-chain Anchor IDL are stateful JavaScript objects containing compiled binary serializer functions. These cannot be cleanly serialized into passive key-value stores without recompilation overhead on each read.

4. **Explicit Refresh Capability:**
   On-chain program tools and IDLs are deployed alongside smart contract upgrades, which occur infrequently. In long-running host processes where an on-chain program has been upgraded, developers or hosts can explicitly re-invoke `host.discover(programId)` to re-fetch and replace the cached program context.

## Deferred Work & Consequences

- **Cold Starts in Serverless Environments:** In ephemeral environments (e.g. AWS Lambda, Vercel Edge functions), the in-memory map is rebuilt on cold start (~200ms once per cold container). An optional `StorageAdapter` interface for serializing raw validated config JSON payloads can be introduced in a future release if cold-start optimization is demanded.
- **Automated Invalidation:** For daemon services that run continuously for weeks without restarting, a future host option `{ cacheTtlMs?: number }` or slot-based change detection can be added without altering the core host discovery API.
