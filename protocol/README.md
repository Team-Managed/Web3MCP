# Web3MCP Protocol

Normative specification, JSON Schema, validation logic, and conformance vectors for Web3MCP v0.1.

## Structure

- `schema/`: Machine-readable JSON Schema files.
  - `config.schema.json`: Schema definition for the on-chain UTF-8 JSON configuration payload.
- `src/`: Protocol reference implementations and offline validation logic.
  - `pda.js`: Deterministic Config PDA derivation (`["web3mcp", "config"]`).
  - `account.js`: Anchor account binary serialization and fail-closed deserializer.
  - `validator.js`: Full protocol conformance validator (`validateConfig`, `validateConfigSchema`).
- `fixtures/`: Golden test vectors for protocol compliance.
  - `valid/`: Valid configuration envelopes and reference fixtures (`minimal.json`, `reference-instruction.json`, `reference-read.json`).
  - `invalid/`: Rejection test vectors covering versioning, missing fields, invalid tool names, forbidden effects, and unsupported types.
  - `binary/`: Pre-serialized on-chain account byte vectors (`valid-published.bin`).
- `tests/`: Automated conformance test suite.

## Running Tests

From the workspace root:
```bash
npm test
```

Or within the `protocol/` package:
```bash
npm --prefix protocol test
```

## Conformance CLI Validator

To validate any configuration JSON or on-chain binary account file offline against the frozen protocol:
```bash
node protocol/bin/validate.js <path-to-file.json|.bin>
```
Example:
```bash
node protocol/bin/validate.js protocol/fixtures/valid/reference-instruction.json
node protocol/bin/validate.js protocol/fixtures/binary/valid-published.bin
```

## Tool Descriptors (v0.1)

### Input Schema Supported Types
Web3MCP v0.1 supports exactly three scalar property types in `inputSchema.properties`:
1. `u64`: JSON string matching `^[1-9][0-9]*$` (no leading zeros)
2. `boolean`: JSON boolean (`true` / `false`)
3. `publicKey`: JSON string matching `^[1-9A-HJ-NP-Za-km-z]{32,44}$` (Base58 public key)

### Account Resolution Sources
- `"signer"`: Wallet key of connected user.
- `"input"`: Resolved from an `inputSchema` argument specified by `"input": "<param>"`.
- `"program"`: Static program address specified by `"address": "<pubkey>"`.
- `"idl"`: Deterministically derived PDA from Anchor IDL account definitions.

### Instruction Tools (`solana.kind = "instruction"`)
State-changing operations require:
- `instruction`: Name matching an IDL instruction.
- `accounts`: Map of accounts to resolution sources.
- `effects`: Publisher claims containing `stateChanging` (boolean), `financial` (boolean), and optional `summary`.

### Account Read Tools (`solana.kind = "accountRead"`)
Query operations that read and decode program account state:
- `account`: Name of target account type defined in the IDL.
- `accounts`: Map of accounts specifying the target query address (via `input`, `program`, `signer`, or `idl`).
- `effects`: **Forbidden** on `accountRead` tools. Schema validation fails closed if present.

## On-Chain Account Layout

The Config PDA holds Anchor-serialized account state with an 81-byte header before the configuration payload:

| Field | Type | Size | Description |
|---|---|---|---|
| `discriminator` | `[u8; 8]` | 8 B | Anchor account discriminator (`sha256("account:Web3McpConfig")[0..8]` = `991dc793e1358b35`) |
| `authority` | `Pubkey` | 32 B | Base58 public key of authorized publisher |
| `status` | `u8` | 1 B | `0 = Uninitialized`, `1 = Uploading`, `2 = Published` |
| `expected_len` | `u32` | 4 B | Declared total byte length of config payload (max 64 KiB) |
| `digest` | `[u8; 32]` | 32 B | SHA-256 hash of complete config bytes |
| `config` | `Vec<u8>` | 4 B + N | 4-byte LE length prefix followed by UTF-8 JSON payload bytes |

### Fail-Closed Validation
A compliant Web3MCP host MUST fail closed and reject any configuration account if:
- Account discriminator does not match `991dc793e1358b35`
- `status` is not `2` (`Published`) (e.g. `Uninitialized` or in-progress `Uploading`)
- Payload byte length exceeds 64 KiB (`65,536` bytes)
- Vector prefix or account length does not match `expected_len`
- SHA-256 digest of payload bytes does not equal on-chain `digest`
- Decoded string is not valid JSON conforming to `config.schema.json`

## PDA Derivation

The Config PDA is derived using the target program ID and two seeds:
```ts
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("web3mcp", "utf8"), Buffer.from("config", "utf8")],
  programId
);
```
