# Account Query and Discriminator-Verified RPC Reads

We decided that state queries in Web3MCP (`accountRead` tools) are executed by fetching raw Solana account data via standard RPC `getAccountInfo` and decoding it through IDL-derived Anchor discriminators, rather than simulating view instructions or calling off-chain indexer APIs. This provides zero-cost, signature-free state inspection directly from the canonical chain state while enforcing strict cryptographic guarantees against account type confusion and ownership spoofing.

## What We Are Dealing With

Unlike EVM contracts that support gas-free `view` function calls, Solana does not provide native on-chain read-only methods. All persistent state on Solana lives inside **Accounts** (raw byte buffers owned by programs). When an agent needs to answer an operational query (e.g. "What is my vault balance?" or "What is the status of escrow X?"), the host queries an on-chain account's byte buffer directly from a validator.

Without an intermediary API or indexer, this presents three distinct security and deserialization challenges:
1. **Ownership Spoofing:** Any user or rogue program can create an account with arbitrary data.
2. **Account Type Confusion:** A Solana program may define dozens of account types (e.g., `Vault`, `UserInfo`, `AdminConfig`). Passing an address of the wrong type could produce garbled data or incorrect assumptions.
3. **Binary Layout:** The data is packed as raw binary Borsh bytes following Anchor's serialization format.

## Why No Indexer Is Required: PDAs as Deterministic Primary Keys

Indexers (such as Subgraphs, Subsquid, or custom Postgres databases) are necessary for historical time-series analytics, multi-table joins, or unbounded paginated searches (e.g. "show 30-day deposit history"). However, AI agents executing tools require **operational point-in-time state reads** ("what is the user's current vault balance?").

Web3MCP solves this without an indexer by leveraging Solana's Program Derived Addresses (PDAs) as deterministic primary keys:
- Instead of executing relational queries (`SELECT * FROM vaults WHERE owner = ?`), the target address is deterministically computed in-memory by evaluating the on-chain IDL seed formula: `findPDA(["vault", userPubkey], programId)`.
- The host queries the validator with a single, direct key-value lookup: `connection.getAccountInfo(pdaAddress)`. This is an $O(1)$ hash lookup directly in validator memory.
- **Zero Indexer Lag:** Indexers typically lag behind the tip of the chain by 5–30 seconds. Direct RPC reads query instantaneous `confirmed` or `processed` validator state, so agents observe balance updates the exact millisecond a state-changing transaction confirms.
- **Zero Server Infrastructure:** Program developers are not required to host, maintain, or pay for indexers, GraphQL endpoints, or gRPC bridges. The program is 100% self-sovereign and queryable globally upon deployment.

## The Approach

To resolve queries deterministically without off-chain servers or transaction fees, `executeRead` executes a fail-closed four-step verification and decoding pipeline:

1. **Address Resolution:**
   The host resolves the query target address either from the agent's validated input arguments (`source: "input"`, e.g. `vaultOwner`) or deterministically derives a PDA using the program's IDL seeds (`source: "idl"`).

2. **Direct RPC Fetch (`getAccountInfo`):**
   The host fetches the account buffer via standard Solana RPC `getAccountInfo` with `confirmed` commitment. If the account does not exist (`null`), the host returns an explicit, typed not-found result rather than failing unexpectedly.

3. **Ownership and Discriminator Verification (Fail-Closed):**
   Before parsing, the host validates two cryptographic invariants:
   - **Program Ownership:** `account.owner` must match the target `programId`. If owned by another program or the System Program, execution halts immediately with an `AccountSecurityError`.
   - **Anchor 8-Byte Discriminator:** Anchor prefixes all account structs with `sha256("account:<AccountName>")[0..8]`. The host matches the first 8 bytes of the buffer against the target account struct in the on-chain IDL. If they do not match, the host rejects the data with an `AccountDiscriminatorMismatchError`.

4. **Dynamic Borsh Deserialization:**
   Once verified, the host strips the 8-byte discriminator and deserializes the remaining payload using Anchor's dynamic accounts coder compiled from the on-chain IDL. Values are transformed into clean, JSON-serializable structures (converting `u64` to string and `PublicKey` to Base58) and returned directly to the agent.

5. **Signature-Free and Forbidden Effects:**
   Because `accountRead` tools only inspect state, they require zero wallet interaction, produce no transactions, and strictly forbid declared `effects` in the protocol schema. This guarantees agents can query chain state with zero latency overhead and zero financial risk to the user.
