# Web3MCP Protocol Specification v0.1.0

**Status**: Candidate under review (v0.1.0)
**Standard**: `web3mcp`
**Profile**: Anchor-compatible Solana program discovery

The account layout and JSON envelope below are implemented. The supported Anchor IDL subset and semantic binding rules are still being reviewed; publishers and hosts should not treat this candidate as interoperable until those rules and conformance vectors are complete.

---

## 1. Introduction & Architecture Boundaries

Web3MCP defines an on-chain standard for Solana programs to advertise agent-facing tools without requiring an off-chain API, website, or custom MCP server.

### 1.1 Core Boundaries
1. **Target Program Ownership**: The tool configuration account (Config PDA) is derived deterministically from the target program ID and owned exclusively by that program.
2. **Host Independence**: The Web3MCP host discovers and executes tools strictly from the target program ID, on-chain configuration data, and Solana RPC. The host never imports the target program's source code, generated Anchor IDL, or a hardcoded tool catalog.
3. **Wallet Approval**: The LLM suggests tool calls and parameters. The host performs strict, untrusted input validation, simulates transaction effects, and requests explicit user wallet signing. The LLM never signs transactions.
4. **Fail-Closed Security**: Any configuration with unknown envelope fields, unsupported versions, ambiguous account bindings, or invalid cryptographic hashes is immediately rejected.
5. **RPC Commitment**: The protocol recommends `finalized` commitment for config PDA fetching and account reads, but permits `confirmed` to support local-validator testing.

### 1.2 User Stories
1. As a **host implementer**, I want a JSON Schema file for the config payload, so that I can validate any config programmatically without hand-parsing prose.
2. As a **host implementer**, I want PDA derivation test vectors (program ID → expected config PDA address), so that I can verify my derivation logic matches the spec.
3. As a **host implementer**, I want golden valid-config fixtures, so that I can verify my parser accepts well-formed configs and produces the correct internal representation.
4. As a **host implementer**, I want golden invalid-config fixtures (wrong owner, bad version, unknown fields, malformed IDL, unsupported input types, circular account resolution), so that I can verify my parser rejects each case with the expected error.
5. As a **program publisher**, I want a clear account layout specification, so that I know exactly what bytes to write to the config PDA.
6. As a **program publisher**, I want defined upload lifecycle rules (Uninitialized → Uploading → Published), so that I can implement chunked upload with integrity checks.
7. As a **program publisher**, I want to know exactly which Anchor IDL subset is "supported," so that I don't publish a config the host will reject.
8. As a **conformance tester**, I want a standalone fixture reader that can load and validate a config from a file (no RPC required), so that protocol conformance is testable offline.
9. As a **protocol designer**, I want the spec to explicitly list what is deferred (SNS, freeform strings, multi-instruction, remaining accounts), so that v0.1 claims are bounded and reviewable.
10. As a **security reviewer**, I want the spec to define fail-closed behavior for every unsupported or ambiguous case, so that the trust boundary is auditable.

---

## 2. On-Chain Config PDA Layout

### 2.1 PDA Derivation
The Config PDA address is derived synchronously using the ed25519 off-curve program derivation algorithm with two literal UTF-8 byte seeds:
```
seeds = [ "web3mcp", "config" ]
program = target_program_id
```

### 2.2 Account Storage Layout (Anchor Serialization)
The Config PDA account data begins with an 81-byte header followed by the UTF-8 JSON configuration payload:

```
+-----------------------------------------------------------------------------------+
| Field         | Type         | Offset | Size (Bytes) | Description                |
+---------------+--------------+--------+--------------+----------------------------+
| discriminator | [u8; 8]      | 0      | 8            | sha256("account:           |
|               |              |        |              | Web3McpConfig")[0..8]      |
| authority     | Pubkey       | 8      | 32           | Authorized updater key     |
| status        | u8           | 40     | 1            | 0=Uninitialized            |
|               |              |        |              | 1=Uploading                |
|               |              |        |              | 2=Published                |
| expected_len  | u32 (LE)     | 41     | 4            | Total config payload bytes |
| digest        | [u8; 32]     | 45     | 32           | SHA-256 of complete config |
| config        | Vec<u8>      | 77     | 4 + N        | 4-byte LE length + UTF-8   |
+-----------------------------------------------------------------------------------+
```

- **Discriminator**: Hex `991dc793e1358b35` (`[153, 29, 199, 147, 225, 53, 139, 53]`).
- **Maximum Size**: The config payload is limited to a maximum of 64 KiB (`65,536` bytes).
- **Publication Lifecycle**:
  - `0 (Uninitialized)`: Account created but no upload initiated. Host must reject.
  - `1 (Uploading)`: Chunked upload in progress. Host must fail closed.
  - `2 (Published)`: Fully uploaded and finalized. Host may consume.

---

## 3. Configuration Envelope & Schema

The UTF-8 config payload must be valid JSON conforming strictly to `https://web3mcp.org/schema/v0.1/config.schema.json`.

```json
{
  "standard": "web3mcp",
  "version": "0.1.0",
  "programId": "<Base58 32-byte public key>",
  "idl": { /* Complete Anchor IDL */ },
  "tools": [ /* Array of Tool Descriptors */ ]
}
```

### 3.1 Field Normative Rules
- `standard`: Must be literal string `"web3mcp"`.
- `version`: Semver string matching `^0\.1\.[0-9]+$`. Hosts must reject any major ≠ 0 or minor ≠ 1.
- `programId`: Base58 public key matching the account owner.
- `idl`: Complete Anchor IDL JSON object describing instructions and account structs.
- `tools`: Array of Tool Descriptors.
- `additionalProperties: false`: Any unknown top-level field causes rejection.

---

## 4. Tool Descriptors

Each element of `tools` defines an agent-callable tool.

### 4.1 Identification & Metadata
- **`name`**: Must match regex `^[a-z][a-z0-9_]{0,63}$`. Must be unique across `tools`.
- **`title`**: Optional human-readable UI label.
- **`description`**: Untrusted publisher description passed to the LLM.
- **`annotations`**: Optional advisory hints:
  - `readOnlyHint`: boolean.
  - `untrustedContentHint`: boolean.

### 4.2 Parameter Schema (`inputSchema`)
The `inputSchema` defines the arguments exposed to the LLM. For v0.1, properties are strictly limited to three scalar types:

| Semantic Type | JSON Schema Representation | Validation & Value Representation |
|---|---|---|
| `u64` | `{"type": "string", "pattern": "^[1-9][0-9]*$"}` | Unsigned 64-bit integer as decimal string (no leading zeros) |
| `boolean` | `{"type": "boolean"}` | JSON boolean (`true` or `false`) |
| `publicKey` | `{"type": "string", "pattern": "^[1-9A-HJ-NP-Za-km-z]{32,44}$"}` | Base58 Solana public key string |

`inputSchema` must set `type: "object"` and `additionalProperties: false`. All complex, nested, freeform string, or array types are rejected in v0.1.

---

## 5. Execution Bindings (`solana`)

Every tool must declare a `solana` execution binding with `kind: "instruction"` or `kind: "accountRead"`.

### 5.1 Account Resolution Sources
Accounts are resolved using one of four sources:
1. `{"source": "signer"}`: Connected user wallet public key.
2. `{"source": "input", "input": "<param>"}`: Resolved from an `inputSchema` property. Must match a declared property name.
3. `{"source": "program", "address": "<pubkey>"}`: Fixed static program address.
4. `{"source": "idl"}`: Deterministically derived on-chain PDA as specified in Anchor IDL seeds.

### 5.2 Instruction Binding (`kind: "instruction"`)
- `instruction`: Name of target instruction in the embedded IDL.
- `accounts`: Mapping of instruction account names to resolution sources.
- `effects`: Required publisher claims:
  - `stateChanging`: boolean.
  - `financial`: boolean.
  - `summary`: optional string.

### 5.3 Account Read Binding (`kind: "accountRead"`)
- `account`: Name of target account type in the embedded IDL.
- `accounts`: Mapping of query account name to resolution source.
- `effects`: **FORBIDDEN** on `accountRead` tools. Schema validation fails closed if present.

---

## 6. Conformance & Fail-Closed Error Catalog

A compliant host or validator must reject configurations under the following conditions:

| Category | Rejection Condition | Behavior |
|---|---|---|
| Binary | Discriminator ≠ `991dc793e1358b35` | Reject immediately |
| Binary | Status ≠ `2` (`Published`) | Reject immediately (incomplete upload) |
| Binary | Payload > 64 KiB (`65,536` bytes) | Reject immediately |
| Binary | SHA-256(payload) ≠ `digest` | Reject immediately (corruption) |
| Envelope | `standard` ≠ `"web3mcp"` | Reject immediately |
| Envelope | `version` does not match `^0\.1\.[0-9]+$` | Reject immediately |
| Envelope | Unknown top-level fields | Reject immediately |
| Schema | Duplicate tool names in `tools` | Reject immediately |
| Schema | Tool name violates `^[a-z][a-z0-9_]{0,63}$` | Reject immediately |
| Schema | Unsupported `inputSchema` type | Reject immediately |
| Schema | Unknown account resolution source | Reject immediately |
| Schema | `effects` present on `accountRead` | Reject immediately |
| Schema | `effects` missing on `instruction` | Reject immediately |
| Semantic | Instruction tool not in IDL instructions | Reject immediately |
| Semantic | Read tool account not in IDL accounts | Reject immediately |
| Semantic | Account references undeclared input property | Reject immediately |

---

## 7. Deferred Features (Out of Scope for v0.1)

The following capabilities are explicitly deferred and must not be assumed:
- **SNS Name Discovery**: Discovery starts exclusively from a Base58 program ID.
- **Arbitrary Types**: Freeform strings, floats, arrays, signed ints (`i64`), and byte vectors.
- **Multi-Instruction Transactions**: Recipes, batched instructions, or flash loan sequences.
- **Dynamic Account Resolution**: Address Lookup Tables (ALTs) and executable off-chain resolvers.
- **Autonomous Signing**: Delegated signer keys or agent autonomous execution.
- **View Instructions**: Simulating instruction execution to read state.
