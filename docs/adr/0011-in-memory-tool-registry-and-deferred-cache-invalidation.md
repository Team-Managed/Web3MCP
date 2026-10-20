# In-Memory Tool Registry and Deferred Cache Invalidation

## Decision

`Web3McpSdk.discover(programId)` fetches and validates the executable program and canonical Config PDA, builds coders from the embedded IDL, and stores the resulting context in an in-memory map. Calling `discover` again replaces that snapshot. The SDK has no automatic TTL, polling, or slot-based invalidation in the current release.

## Consequences

- Cached tools can become stale after config publication or a program upgrade. A previously discovered tool can remain callable while the on-chain config is `Uploading` because execution methods use the stored context.
- The host can explicitly rediscover before a sensitive operation. Generic SDK consumers need their own refresh policy until the SDK enforces one.
- Simulation and exact-message approval remain required for writes, but they do not establish that cached metadata is current or that the program is safe.

Automatic freshness checks and the behavior when a refreshed config removes an advertised tool need a protocol and SDK decision before claiming that all active hosts fail closed during updates.
