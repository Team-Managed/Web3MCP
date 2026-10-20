# Dependency security status

On 2026-10-20, `npm audit --omit=dev` reported 14 affected entries in the root production dependency tree (6 high, 8 moderate). An audit scoped to the SDK workspace reported 7 (2 high, 5 moderate). These are transitive findings, not 14 independent flaws in Web3MCP code. No claim of zero known advisories is made.

The SDK currently depends on Anchor 0.32.1 and `@solana/web3.js` 1.99.0 for runtime IDL coding and Solana transactions. Anchor's dependency graph includes vulnerable `toml`; web3.js v1 includes `jayson`, which depends on older `stream-json` and `uuid`. The optional Host CLI `.sns` path adds Bonfida/SPL packages and `bigint-buffer`. `npm audit` did not offer a compatible fix for the SDK graph. Forced overrides across major versions would risk breaking IDL decoding, transaction submission, or name resolution.

The immediate controls are strict config/input validation, bounded published config size, RPC result checks, simulation, exact-message signature verification, and explicit user approval. They do not eliminate dependency advisories. Dependabot is configured to surface new releases. A separate migration should replace the affected Solana/Anchor stack or verify a compatible upstream patch, then rerun the SDK and local-validator suites plus a Devnet rehearsal before publication. The published SDK package remains at 0.1.1 until that work is reviewed and released.

Recheck with `npm audit --omit=dev` from the root and `npm audit --omit=dev --workspace @web3mcp/sdk` after a fresh `npm ci`. See [security policy](../SECURITY.md) for private reporting.
