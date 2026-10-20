# In-Memory Tool Registry and Deferred Cache Invalidation

## Decision

`Web3McpSdk.discover(programId)` fetches and validates the executable program and canonical Config PDA, builds coders from the embedded IDL, and stores the resulting context in an in-memory map. Calling `discover` again replaces that snapshot. The SDK has no automatic TTL, polling, or slot-based invalidation for cached tool lists and account-read metadata.

## Consequences

- Cached tool lists and account-read metadata can become stale after config publication or a program upgrade; account data itself is fetched live. Hosts and SDK consumers should rediscover when they need a current catalog.
- Writes compare the stored discovery snapshot with the live Config PDA and program deployment before and after simulation, then again before broadcast. A change requires rediscovery and a new review.
- Simulation and exact-message approval remain required for writes. Freshness checks do not prove that a program is safe or prevent an upgrade after the final check.

Automatic refresh of cached tool lists and account-read metadata remains deferred.
