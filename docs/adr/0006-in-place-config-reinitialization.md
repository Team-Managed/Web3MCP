# In-Place Config PDA Re-initialization with Fail-Closed Transition

We decided to allow the designated program authority to re-initialize an existing Config PDA in place. The reference program resets its status to `1 (Uploading)`, truncates the payload, and records the new expected length and digest. Fresh discovery rejects the account until finalization restores `2 (Published)` and the digest matches.

The v0.1 SDK retains previously discovered contexts in memory. A host that does not rediscover can still use an older snapshot during an upload or after a program upgrade. Automatic refresh and cache invalidation are open work; hosts handling writes should rediscover before presenting a transaction for approval. See [ADR 0011](0011-in-memory-tool-registry-and-deferred-cache-invalidation.md).
