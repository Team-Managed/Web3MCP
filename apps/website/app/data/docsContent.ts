export interface DocSection {
  id: string;
  category: string;
  title: string;
  badge?: string;
  summary: string;
  content: {
    overview?: string;
    diagram?: string;
    tables?: { headers: string[]; rows: string[][] }[];
    codeBlocks?: { title: string; language: string; code: string }[];
    callouts?: { type: "info" | "security" | "warning" | "tip"; title: string; text: string }[];
    subsections?: {
      id?: string;
      title: string;
      description?: string;
      items?: string[];
      code?: { language: string; code: string };
      table?: { headers: string[]; rows: string[][] };
    }[];
  };
}

const VAULT_PROGRAM_ID = "9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD";
const VAULT_CONFIG_PDA = "J8Ph37LoQsv4yED6USdupCooCZzsVMqJkgBTm9uSkvCw";

const GUARD_PROGRAM_ID = "BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA";
const GUARD_CONFIG_PDA = "FnN43zVgGkqKWbs5D83AEs4cTrKfjrmodafTB7J69vB4";
const GUARD_STATE_PDA = "EWXdUTZGa1uQ1g1aLPeJv3J6oKFTSNgvJpueZ1fnN2dB";

export const DOCS_SECTIONS: DocSection[] = [
  {
    id: "overview",
    category: "Protocol",
    title: "What is Web3MCP?",
    badge: "Start here",
    summary: "Solana programs publish agent-facing tools in a program-owned config PDA.",
    content: {
      overview: "Web3MCP is an open protocol for discovering and executing Solana program capabilities. Given a program ID, a compatible agent host reads its canonical configuration PDA through Solana RPC. The on-chain configuration describes tool arguments, accounts, and instructions; the program executes transactions on-chain. No project-specific MCP server, custom API, or external website is required.",
      tables: [{
        headers: ["Component", "Role in Architecture"],
        rows: [
          ["Solana Program", "Owns the canonical config PDA and executes advertised instructions on-chain."],
          ["Config PDA", "Publishes the tool manifest, embedded Anchor IDL, and execution bindings on-chain."],
          ["Agent Host", "Discovers tools via RPC, validates schemas fail-closed, decodes reads, and prepares writes."],
          ["User Wallet", "Simulates and signs transactions after explicit human approval; the LLM never signs."],
        ],
      }],
      subsections: [
        {
          id: "protocol-flow",
          title: "One program ID, on-demand tools",
          description: "Connecting an agent host to any compatible Solana program follows a deterministic four-step discovery loop:",
          items: [
            "**1. Derive Canonical PDA**: Locate the configuration account at deterministic seeds `['web3mcp', 'config']` under the target program ID.",
            "**2. Verify Ownership & State**: Confirm the account is owned by the program, holds the required discriminator, and is marked `Published`.",
            "**3. Validate Schemas**: Parse the embedded Anchor IDL, Draft-07 parameter schemas, and execution bindings fail-closed.",
            "**4. Register Tools On-Demand**: Provide validated tool descriptors to the LLM without requiring an external MCP server or custom API.",
          ],
        },
        {
          id: "protocol-boundary",
          title: "Execution boundary & trust model",
          description: "Web3MCP enforces strict security boundaries between model suggestions, host validation, and transaction execution:",
          items: [
            "**Read Queries (RPC Only)**: Decodes on-chain account state directly via RPC with zero transaction fees and zero signatures.",
            "**Write Instructions (Wallet Signed)**: The host constructs and simulates instructions, requiring explicit human wallet confirmation before signing.",
            "**No Autonomous Agent Signing**: The model proposes tool arguments but never holds private keys or signs transactions.",
            "**Untrusted Publisher Claims**: Tool descriptions and effect summaries remain untrusted publisher metadata validated by the host.",
          ],
        },
      ],
    },
  },
  {
    id: "protocol-spec",
    category: "Protocol",
    title: "Protocol profile and versions",
    badge: "Candidate specification",
    summary: "The v0.1 candidate defines discovery and instruction bindings; v0.2 adds read PDA derivation.",
    content: {
      overview: "The Web3MCP specification and Draft-07 JSON Schema define the canonical wire format. Compliant hosts accept v0.1.x and v0.2.x manifests, with v0.2 extending account reads to support deterministic PDA derivation without altering the binary account layout.",
      tables: [{
        headers: ["Protocol Rule", "Normative Requirement"],
        rows: [
          ["Program Identity", "The target program must be an executable BPF account owning its canonical config PDA."],
          ["Manifest Envelope", "standard must be 'web3mcp'; version must be 0.1.x or 0.2.x; programId must match IDL address."],
          ["Input Validation", "Only supported decimal-string u64, boolean, and Base58 public-key parameters are permitted."],
          ["Instruction Bindings", "Every advertised IDL account must resolve through signer, input, program, or idl PDA sources."],
          ["Account Reads", "Verify account owner and discriminator; v0.2 may derive read PDAs from declared seeds."],
          ["Transaction Writes", "Validate inputs, simulate effects, request explicit approval, and assert message integrity before submission."],
        ],
      }],
      subsections: [
        {
          id: "protocol-scope",
          title: "Current profile & roadmap boundaries",
          description: "Web3MCP deliberately bounds initial profile complexity to guarantee fail-closed security and auditability:",
          items: [
            "**Supported Capabilities**: Program ID discovery, scalar inputs (`u64`, `boolean`, `publicKey`), Anchor IDL instruction bindings, read account queries, and v0.2 deterministic PDA seed derivation.",
            "**Deferred Capabilities**: Floating-point numbers, arbitrary strings, arrays, nested objects, multi-instruction recipes, dynamic address lookup tables (ALTs), and autonomous agent signing.",
            "**Fail-Closed Invariants**: Any unknown envelope field, unsupported input type, or malformed account source causes immediate rejection.",
          ],
        },
      ],
    },
  },
  {
    id: "on-chain-wire-format",
    category: "Protocol",
    title: "Config PDA and manifest",
    badge: "Wire format",
    summary: "A program-owned account holds an 81-byte header and a bounded JSON manifest.",
    content: {
      overview: "Derive the config PDA with literal UTF-8 seeds 'web3mcp' and 'config' under the target program ID. Accept only a Published account owned by that program, with the expected discriminator, declared payload length, and SHA-256 digest.",
      tables: [{
        headers: ["Offset", "Field", "Size", "Meaning"],
        rows: [
          ["0", "discriminator", "8 bytes", "SHA-256(account:Web3McpConfig), first 8 bytes."],
          ["8", "authority", "32 bytes", "Authorized config updater (program upgrade authority)."],
          ["40", "status", "1 byte", "0 = Uninitialized, 1 = Uploading, 2 = Published."],
          ["41", "expected_len", "4 bytes", "Declared payload length in bytes (little-endian u32)."],
          ["45", "digest", "32 bytes", "SHA-256 cryptographic digest of the complete JSON payload."],
          ["77", "vec_len", "4 bytes", "Anchor vector length prefix for configuration bytes (little-endian u32)."],
          ["81", "config", "N bytes", "UTF-8 JSON configuration payload; maximum 65,536 bytes (64 KiB)."],
        ],
      }],
      subsections: [
        {
          id: "manifest-fields",
          title: "Manifest envelope fields",
          description: "The JSON manifest payload contains exactly five top-level properties:",
          items: [
            "**Standard (`standard`)**: Must be literal string `'web3mcp'` to identify the protocol family.",
            "**Version (`version`)**: Semver string matching `0.1.x` or `0.2.x` corresponding to supported feature sets.",
            "**Target Program (`programId`)**: Base58 public key matching the account owner and IDL address.",
            "**Embedded IDL (`idl`)**: Pruned Anchor 0.1.0 IDL containing target instructions and account structs.",
            "**Tool Descriptors (`tools`)**: Array of agent-callable capabilities declaring input schemas and Solana bindings.",
          ],
        },
        {
          id: "wire-publication",
          title: "Publication lifecycle states",
          description: "The account header status byte controls discovery availability:",
          items: [
            "**Status 0 (`Uninitialized`)**: Account allocated but no upload started; hosts reject fail-closed.",
            "**Status 1 (`Uploading`)**: Chunked upload in progress; hosts reject to prevent partial or corrupted reads.",
            "**Status 2 (`Published`)**: Upload complete and SHA-256 verified; hosts discover and load tools.",
          ],
        },
      ],
    },
  },
  {
    id: "smart-contract-schemas",
    category: "Smart Contract",
    title: "Manifest & Schema Specifications",
    badge: "JSON Schema",
    summary: "Comprehensive schema definitions for envelopes, tool descriptors, input validation, and Solana bindings.",
    content: {
      overview: "Solana programs publish tools by serializing a JSON manifest that strictly conforms to Draft-07 JSON Schema. Agent hosts perform fail-closed validation: any unknown envelope fields, unsupported scalar types, missing IDL accounts, or malformed PDA seeds immediately cause the entire configuration to be rejected.",
      callouts: [
        {
          type: "security",
          title: "Fail-Closed Protocol Boundary",
          text: "Host validators reject manifests with additionalProperties: true, unexpected fields, or undeclared account sources. Smart contract engineers must publish only the exact types and structures specified below.",
        },
      ],
      tables: [
        {
          headers: ["Schema Component", "Draft-07 Reference", "Enforcement Rule"],
          rows: [
            ["Envelope", "Web3McpConfig", "standard, version, programId, idl, tools. No additional fields."],
            ["Tool Descriptor", "#/definitions/toolDescriptor", "name regex ^[a-z][a-z0-9_]{0,63}$, inputSchema, solana binding."],
            ["Input Schema", "#/definitions/inputSchema", "Strict object schema; only decimal u64, boolean, and pubkey."],
            ["Instruction Binding", "#/definitions/instructionBinding", "Maps IDL instruction accounts to signer, input, program, or idl. Declares effects."],
            ["Account Read Binding", "#/definitions/accountReadBinding", "Maps IDL account to input or v0.2 seeds PDA derivation. Effects are strictly forbidden."],
          ],
        },
      ],
      subsections: [
        {
          id: "schema-envelope",
          title: "1. Top-Level Manifest Envelope",
          description: "The root configuration payload must contain exactly five properties without any unknown fields:",
          items: [
            "**standard**: Must be literal string `'web3mcp'`.",
            "**version**: Semver string matching `^0\\.[12]\\.[0-9]+$` (e.g. `'0.2.0'`).",
            "**programId**: Base58 32-byte Solana public key matching the account owner and IDL address.",
            "**idl**: Complete Anchor IDL 0.1.0 object containing advertised instructions and account types.",
            "**tools**: Array of tool descriptors exposed to agent hosts.",
          ],
          table: {
            headers: ["Property", "Type", "Validation Pattern", "Description"],
            rows: [
              ["standard", "string", "web3mcp", "Must be literal string 'web3mcp'."],
              ["version", "string", "^0\\.[12]\\.[0-9]+$", "Supported versions are 0.1.x and 0.2.x."],
              ["programId", "string", "^[1-9A-HJ-NP-Za-km-z]{32,44}$", "Base58 32-byte Solana public key. Must match account owner and IDL address."],
              ["idl", "object", "Anchor IDL 0.1.0", "Complete Anchor IDL containing instructions and account types."],
              ["tools", "array", "toolDescriptor[]", "Array of agent-callable tools published by this program."],
            ],
          },
          code: {
            language: "json",
            code: `{
  "standard": "web3mcp",
  "version": "0.2.0",
  "programId": "BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA",
  "idl": {
    "address": "BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA",
    "metadata": {
      "name": "reference_protocol_guard",
      "version": "0.1.0",
      "spec": "0.1.0"
    },
    "instructions": [ /* ... */ ],
    "accounts": [ /* ... */ ],
    "types": [ /* ... */ ]
  },
  "tools": [ /* ... */ ]
}`,
          },
        },
        {
          id: "schema-tool-descriptor",
          title: "2. Tool Descriptor Schema",
          description: "Each item in the tools array defines an agent capability:",
          items: [
            "**name**: Lowercase snake_case identifier matching `^[a-z][a-z0-9_]{0,63}$`.",
            "**title**: Optional human-readable UI label for wallets and host dialogs.",
            "**description**: Untrusted prompt description passed directly to the model.",
            "**annotations**: Optional advisory hints such as `readOnlyHint` and `untrustedContentHint`.",
            "**inputSchema**: Strict Draft-07 JSON Schema specifying tool arguments.",
            "**solana**: Execution binding (`instruction` or `accountRead`).",
          ],
          table: {
            headers: ["Field", "Type", "Required", "Description"],
            rows: [
              ["name", "string", "Yes", "Lowercase snake_case tool identifier (max 64 chars)."],
              ["title", "string", "No", "Human-readable label for wallet and host interfaces."],
              ["description", "string", "No", "Prompt description passed to LLM (untrusted publisher content)."],
              ["annotations.readOnlyHint", "boolean", "No", "True if the tool does not mutate on-chain state."],
              ["annotations.untrustedContentHint", "boolean", "No", "True if the tool may return unverified third-party content."],
              ["inputSchema", "object", "Yes", "Draft-07 schema for tool arguments."],
              ["solana", "object", "Yes", "Solana execution binding (instruction or accountRead)."],
            ],
          },
        },
        {
          id: "schema-input-validation",
          title: "3. Input Schema & Supported Scalar Types",
          description: "Web3MCP v0.1 and v0.2 strictly limit tool arguments to three scalar types to prevent precision loss and serialization vulnerabilities:",
          items: [
            "**u64 Unsigned Integer**: Encoded as a decimal string without leading zeros (`^[1-9][0-9]*$`). Prevents JavaScript float rounding.",
            "**boolean Flag**: Standard JSON boolean (`true` or `false`).",
            "**publicKey Address**: Base58 32-byte public key string (`^[1-9A-HJ-NP-Za-km-z]{32,44}$`).",
            "**Forbidden Anti-Patterns**: Floating-point numbers, negative integers, arrays, nested objects, and arbitrary strings are rejected fail-closed.",
          ],
          table: {
            headers: ["Semantic Type", "JSON Schema Definition", "Wire Format", "Anti-Pattern (Rejected)"],
            rows: [
              ["u64 integer", "{\"type\": \"string\", \"pattern\": \"^[1-9][0-9]*$\"}", "Decimal string without leading zeros (e.g. \"1000000\")", "JSON numbers (1000), floats (1.5), negative numbers (-10)"],
              ["boolean", "{\"type\": \"boolean\"}", "JSON boolean (true or false)", "String booleans (\"true\"), integers (0, 1)"],
              ["publicKey", "{\"type\": \"string\", \"pattern\": \"^[1-9A-HJ-NP-Za-km-z]{32,44}$\"}", "Base58-encoded 32-byte Solana address", "Hex strings (0x...), raw byte arrays, freeform text"],
            ],
          },
          code: {
            language: "json",
            code: `"inputSchema": {
  "type": "object",
  "properties": {
    "feeBasisPoints": {
      "type": "string",
      "pattern": "^[1-9][0-9]*$",
      "description": "Protocol fee in basis points (1 to 10000)"
    },
    "newOperator": {
      "type": "string",
      "pattern": "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
      "description": "Base58 public key of the new delegated operator"
    },
    "isPaused": {
      "type": "boolean",
      "description": "Emergency pause flag"
    }
  },
  "required": ["feeBasisPoints", "newOperator"],
  "additionalProperties": false
}`,
          },
        },
        {
          id: "schema-instruction-binding",
          title: "4. Instruction Execution Bindings",
          description: "Tools with kind: 'instruction' bind directly to Anchor instructions. Every instruction account declared in the IDL must be mapped to exactly one account source. The binding must declare execution effects.",
          items: [
            "**signer**: Binds to the connected user wallet. Must match IDL `isSigner: true`.",
            "**input**: Binds to a required `publicKey` parameter from `inputSchema`.",
            "**program**: Fixed static program address (e.g. SystemProgram `11111111111111111111111111111111`).",
            "**idl**: Derives PDA synchronously using seeds declared in the IDL instruction account.",
          ],
          table: {
            headers: ["Account Source", "Schema Syntax", "Description"],
            rows: [
              ["signer", "{\"source\": \"signer\"}", "Binds to the connected user wallet. Must match IDL isSigner: true."],
              ["input", "{\"source\": \"input\", \"input\": \"<argName>\"}", "Binds to a required publicKey parameter from inputSchema."],
              ["program", "{\"source\": \"program\", \"address\": \"<pubkey>\"}", "Fixed static program address (e.g. SystemProgram 11111111111111111111111111111111)."],
              ["idl", "{\"source\": \"idl\"}", "Derives PDA synchronously using seeds declared in the IDL instruction account."],
            ],
          },
          code: {
            language: "json",
            code: `"solana": {
  "kind": "instruction",
  "instruction": "update_risk_parameters",
  "accounts": {
    "authority": {
      "source": "signer"
    },
    "guard": {
      "source": "idl"
    }
  },
  "effects": {
    "stateChanging": true,
    "financial": false,
    "summary": "Updates protocol fee basis points, utilization cap, and volume limits"
  }
}`,
          },
        },
        {
          id: "schema-account-read-binding",
          title: "5. Account Read Bindings & v0.2 PDA Seeds",
          description: "Tools with kind: 'accountRead' query and decode account state via RPC without wallet signatures. In v0.2, the target address can be resolved from input or derived from on-chain seeds. Effects claims are strictly forbidden on accountRead tools.",
          items: [
            "**Constant Seed (`const`)**: Fixed byte array of 1 to 32 unsigned 8-bit integers.",
            "**Input Seed (`input`)**: References a required `publicKey` input parameter; uses its decoded 32-byte public key.",
            "**Address Derivation**: Derived using `findProgramAddressSync(seeds, programId)` under the target program ID.",
          ],
          table: {
            headers: ["Seed Type", "Schema Syntax", "Value Constraints"],
            rows: [
              ["Constant seed", "{\"kind\": \"const\", \"value\": [118, 97, 117, 108, 116]}", "Byte array of 1 to 32 unsigned 8-bit integers (0 to 255)."],
              ["Input seed", "{\"kind\": \"input\", \"input\": \"ownerAddress\"}", "References a required publicKey parameter; uses decoded 32-byte key."],
            ],
          },
          code: {
            language: "json",
            code: `"solana": {
  "kind": "accountRead",
  "account": "ProtocolGuard",
  "accounts": {
    "guard": {
      "source": "pda",
      "seeds": [
        {
          "kind": "const",
          "value": [112, 114, 111, 116, 111, 99, 111, 108, 95, 103, 117, 97, 114, 100]
        }
      ]
    }
  }
}`,
          },
        },
      ],
    },
  },
  {
    id: "anchor-program-integration",
    category: "Smart Contract",
    title: "Anchor Program Integration",
    badge: "Rust / Anchor",
    summary: "On-chain memory layout, Anchor Rust structs, and the 3-step chunked publication flow.",
    content: {
      overview: "To publish tools from an Anchor Solana program, implement the canonical Web3MCP Config PDA under seeds ['web3mcp', 'config']. Because Solana transactions are bounded by the 1,232-byte IPv6 MTU, manifests are published via a 3-step chunked upload flow with cryptographic SHA-256 integrity verification.",
      tables: [
        {
          headers: ["Offset", "Field", "Type", "Size", "Description"],
          rows: [
            ["0", "discriminator", "[u8; 8]", "8 bytes", "sha256(\"account:Web3McpConfig\")[0..8] (991dc793e1358b35)"],
            ["8", "authority", "Pubkey", "32 bytes", "Authorized updater (e.g. program upgrade authority)"],
            ["40", "status", "u8", "1 byte", "0 = Uninitialized, 1 = Uploading, 2 = Published"],
            ["41", "expected_len", "u32 (LE)", "4 bytes", "Declared total length of the JSON manifest payload"],
            ["45", "digest", "[u8; 32]", "32 bytes", "SHA-256 digest of the entire JSON manifest payload"],
            ["77", "vec_len", "u32 (LE)", "4 bytes", "Anchor vector length prefix for config bytes"],
            ["81", "config", "Vec<u8>", "N bytes", "UTF-8 JSON manifest bytes (maximum 65,536 bytes)"],
          ],
        },
      ],
      subsections: [
        {
          id: "anchor-structs",
          title: "Anchor State Definition in Rust",
          description: "Add Web3McpConfig to your program's state module. The CONFIG_HEADER_LEN constant is exactly 81 bytes.",
          code: {
            language: "rust",
            code: `use anchor_lang::prelude::*;

pub const CONFIG_HEADER_LEN: usize = 81;
pub const MAX_CONFIG_LEN: u32 = 65536;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum ConfigStatus {
    Uninitialized = 0,
    Uploading = 1,
    Published = 2,
}

#[account]
pub struct Web3McpConfig {
    pub authority: Pubkey,
    pub status: u8,
    pub expected_len: u32,
    pub digest: [u8; 32],
    pub config: Vec<u8>,
}`,
          },
        },
        {
          id: "chunked-upload-lifecycle",
          title: "The 3-Step Chunked Publication Flow",
          description: "Programs publish configs using three sequentially invoked instructions. Hosts reject any config whose status is not Published (2):",
          items: [
            "**1. Initialize**: `initialize_config(authority, expected_len, digest)` allocates the PDA header, verifies program upgrade authority, and sets status to `Uploading` (1).",
            "**2. Stream Chunks**: `write_config_chunk(offset, chunk)` appends 800-byte slices into the byte vector at specified offsets.",
            "**3. Finalize & Verify**: `finalize_config()` asserts `vec_len == expected_len` and verifies `sha256(payload) == digest` on-chain, transitioning status to `Published` (2).",
          ],
          table: {
            headers: ["Step", "Instruction", "Signer", "Behavior"],
            rows: [
              ["1. Init", "initialize_config(authority, expected_len, digest)", "Upgrade Authority", "Allocates PDA with header, sets status=1 (Uploading), zeroes payload buffer."],
              ["2. Chunk", "write_config_chunk(offset, chunk)", "Authorized Updater", "Appends bounded byte chunk at specified offset into the config vector."],
              ["3. Finalize", "finalize_config()", "Authorized Updater", "Verifies vector length == expected_len and SHA256(payload) == digest. Sets status=2."],
            ],
          },
        },
        {
          id: "publication-handlers",
          title: "Reference Publication Instruction Handlers",
          description: "Implement authorization using Anchor's ProgramData upgrade authority check to ensure only the program owner can modify tool definitions.",
          code: {
            language: "rust",
            code: `#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(constraint = program.programdata_address()? == Some(program_data.key()))]
    pub program: Program<'info, crate::program::ReferenceProtocolGuard>,
    #[account(constraint = program_data.upgrade_authority_address == Some(authority.key()))]
    pub program_data: Account<'info, ProgramData>,
    #[account(
        mut,
        seeds = [b"web3mcp".as_ref(), b"config".as_ref()],
        bump
    )]
    pub config: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WriteConfigChunk<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"web3mcp".as_ref(), b"config".as_ref()],
        bump
    )]
    pub config: Account<'info, Web3McpConfig>,
}

#[derive(Accounts)]
pub struct FinalizeConfig<'info> {
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"web3mcp".as_ref(), b"config".as_ref()],
        bump
    )]
    pub config: Account<'info, Web3McpConfig>,
}`,
          },
        },
        {
          id: "rent-refund-pattern",
          title: "Rent Exemption & Upgrades",
          description: "When updating a published manifest, initialize_config reallocates the account and dynamically manages rent:",
          items: [
            "**Reallocation**: The account is resized using `AccountInfo::realloc` to fit the new manifest.",
            "**Rent Top-Up**: If the new manifest is larger, additional lamports are transferred from the authority to preserve rent exemption.",
            "**Rent Refund**: If the new manifest is smaller, excess lamports are returned to the authority.",
          ],
          code: {
            language: "rust",
            code: `let new_account_len = CONFIG_HEADER_LEN + expected_len as usize;
let rent = Rent::get()?;
let required_lamports = rent.minimum_balance(new_account_len);
let current_lamports = config_info.lamports();

if current_lamports < required_lamports {
    transfer(
        CpiContext::new(ctx.accounts.system_program.to_account_info(), Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: config_info.clone(),
        }),
        required_lamports - current_lamports,
    )?;
} else if current_lamports > required_lamports {
    let excess = current_lamports - required_lamports;
    **config_info.try_borrow_mut_lamports()? -= excess;
    **ctx.accounts.authority.try_borrow_mut_lamports()? += excess;
}
config_info.realloc(new_account_len, false)?;`,
          },
        },
      ],
    },
  },
  {
    id: "idl-pruning-and-optimization",
    category: "Smart Contract",
    title: "IDL Pruning & Size Optimization",
    badge: "Optimization",
    summary: "Techniques for pruning Anchor IDLs to keep manifests under the 64 KiB on-chain storage limit.",
    content: {
      overview: "While Solana accounts can hold up to 10 MB, Web3MCP enforces a strict 64 KiB (65,536 bytes) maximum payload limit. This guarantees rapid RPC discovery, low memory overhead for agent hosts, and minimal rent cost. Complex Anchor IDLs frequently exceed 100 KiB, so smart contract engineers should prune unadvertised instructions before publishing.",
      tables: [
        {
          headers: ["Boundary", "Limit", "Consequence if Exceeded"],
          rows: [
            ["Config Payload", "65,536 bytes (64 KiB)", "Protocol validator fails closed; host rejects discovery."],
            ["Chunk Size", "800 - 900 bytes", "Exceeding Solana transaction MTU causes sendRawTransaction failure."],
            ["Supported Types", "u8, u16, u32, u64, bool, pubkey", "Unknown struct fields in read accounts cause deserialization error."],
          ],
        },
      ],
      subsections: [
        {
          id: "pruning-rules",
          title: "What to Prune from Your Anchor IDL",
          description: "The embedded IDL only needs to describe instructions and account types referenced by your published tools:",
          items: [
            "**Instructions**: Retain only instructions advertised as agent tools. Omit admin migrations and internal handlers.",
            "**Accounts**: Retain only account types queried by `accountRead` tools.",
            "**Types**: Retain only struct definitions for retained accounts. Omit unreferenced enums and event structs.",
            "**Docstrings**: Strip source code comments and docstrings to reduce payload size by 20% to 40%.",
          ],
          table: {
            headers: ["IDL Section", "Action", "Rule"],
            rows: [
              ["instructions", "Filter", "Retain only instructions named in tool bindings."],
              ["accounts", "Filter", "Retain only account types named in accountRead bindings."],
              ["types", "Prune", "Retain only struct definitions for retained accounts. Omit unreferenced enums."],
              ["docs / comments", "Strip", "Remove docstring arrays to save 20-40% of payload size."],
            ],
          },
        },
        {
          id: "pruning-script",
          title: "Automated Pruning in Manifest Generator",
          description: "Use a manifest generation script to extract only the needed instructions and types from the compiled IDL before publishing.",
          code: {
            language: "javascript",
            code: `import fs from "node:fs";
import { validateConfig } from "@web3mcp/protocol/validator";

export function generateConfig({ idlPath, targetTools }) {
  const rawIdl = JSON.parse(fs.readFileSync(idlPath, "utf8"));

  // Prune instructions not exposed as tools
  const toolInstructionNames = new Set(
    targetTools.filter(t => t.solana.kind === "instruction").map(t => t.solana.instruction)
  );
  const prunedInstructions = rawIdl.instructions.filter(ix => toolInstructionNames.has(ix.name));

  // Prune accounts not exposed as reads
  const readAccountNames = new Set(
    targetTools.filter(t => t.solana.kind === "accountRead").map(t => t.solana.account)
  );
  const prunedAccounts = (rawIdl.accounts || []).filter(acc => readAccountNames.has(acc.name));

  const prunedIdl = {
    address: rawIdl.address,
    metadata: rawIdl.metadata,
    instructions: prunedInstructions,
    accounts: prunedAccounts,
    types: (rawIdl.types || []).filter(t => readAccountNames.has(t.name)),
  };

  const manifest = {
    standard: "web3mcp",
    version: "0.2.0",
    programId: rawIdl.address,
    idl: prunedIdl,
    tools: targetTools,
  };

  validateConfig(manifest);
  return manifest;
}`,
          },
        },
      ],
    },
  },
  {
    id: "publisher-guide",
    category: "Smart Contract",
    title: "Publish Tools from a Program",
    badge: "Publishing Pipeline",
    summary: "Step-by-step pipeline for generating, chunking, and publishing verified Web3MCP tools to Solana.",
    content: {
      overview: "Publishing Web3MCP tools transforms a Solana Anchor program into an agent-callable service. Smart contract engineers follow a structured 5-stage publication pipeline: compiling the program, pruning the IDL, generating the manifest, streaming 800-byte chunks to the on-chain Config PDA, and validating the finalized deployment via RPC.",
      callouts: [
        {
          type: "security",
          title: "Upgrade Authority Verification",
          text: "The initialize_config instruction cryptographically asserts that ctx.accounts.program_data.upgrade_authority_address == ctx.accounts.authority.key(). Only the wallet holding the deployed program's BPF upgrade authority can publish or update tool definitions.",
        },
        {
          type: "tip",
          title: "Compute Unit Allocation for Finalization",
          text: "Computing a SHA-256 digest over several kilobytes of manifest data on-chain consumes substantial compute units. Always prepend ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }) to your finalizeConfig transaction.",
        },
      ],
      tables: [
        {
          headers: ["Stage", "Action", "Tool / Script", "Key Artifact / Result"],
          rows: [
            ["1. Build", "Compile program binary and Anchor IDL", "anchor build", "Compiled Anchor IDL"],
            ["2. Generate", "Prune IDL and define tools with schemas", "generate-config script", "Validated Web3MCP JSON manifest"],
            ["3. Digest & Init", "Compute SHA-256 and allocate Config PDA", "initialize_config instruction", "Config PDA status = 1 (Uploading)"],
            ["4. Chunk Upload", "Stream sequential ~800-byte chunks", "write_config_chunk loop", "Config byte buffer populated"],
            ["5. Finalize", "Verify digest on-chain and set Published", "finalize_config instruction", "Config PDA status = 2 (Published)"],
          ],
        },
      ],
      subsections: [
        {
          id: "pub-pipeline-overview",
          title: "1. The 5-Stage Publishing Pipeline",
          description: "Publishing is fully automated using a generator and chunked publishing script in your program repository:",
          items: [
            "**1. Compile Program**: Run `anchor build` to produce the compiled program binary and raw IDL.",
            "**2. Generate Manifest**: Run the generator script to prune the IDL and structure tool definitions with input schemas and execution bindings.",
            "**3. Initialize PDA**: Broadcast `initialize_config` with the payload byte length and SHA-256 digest, setting status to `Uploading`.",
            "**4. Stream Chunks**: Broadcast sequential 800-byte chunks with 500ms pacing to stay within Solana MTU and RPC rate limits.",
            "**5. Finalize & Verify**: Broadcast `finalize_config` with 400,000 compute units to verify the SHA-256 digest on-chain and set status to `Published`.",
          ],
        },
        {
          id: "pub-chunking-and-limits",
          title: "2. Payload Chunking & MTU Boundaries",
          description: "Solana's IPv6 MTU limit restricts transactions to 1,232 serialized bytes. To avoid transaction rejection, publishers partition the UTF-8 JSON buffer into chunks of 800 bytes. A 500ms delay between chunk broadcasts prevents triggering HTTP 429 rate limits on public Devnet RPC nodes.",
          table: {
            headers: ["Parameter", "Recommended Value", "Rationale"],
            rows: [
              ["CHUNK_SIZE", "800 bytes", "Leaves ~432 bytes for signatures, account keys, and instruction overhead."],
              ["CHUNK_DELAY_MS", "500 ms", "Smooths request bursts across Solana RPC rate-limit windows."],
              ["MAX_CONFIG_LEN", "65,536 bytes (64 KiB)", "Enforced protocol boundary for on-chain storage and host memory."],
              ["Finalize Compute Units", "400,000 units", "Ensures on-chain SHA-256 hash calculation does not exhaust standard 200k CU limit."],
            ],
          },
        },
        {
          id: "pub-script-reference",
          title: "3. Complete Publishing Script Reference",
          description: "Use this battle-tested publishing script from the reference implementations. It includes 429 exponential backoff, transaction confirmation, and post-publish verification.",
          code: {
            language: "javascript",
            code: `import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, ComputeBudgetProgram } from "@solana/web3.js";
import { generateConfig } from "./generate-config.js";
import { validateDiscoveredConfig } from "@web3mcp/protocol/validator";

const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
const CHUNK_SIZE = 800;
const CHUNK_DELAY_MS = 500;

export async function publishConfig(options = {}) {
  const url = options.url || "https://api.devnet.solana.com";
  const connection = new Connection(url, "confirmed");
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // 1. Generate & digest manifest
  const config = generateConfig();
  const payload = Buffer.from(JSON.stringify(config), "utf8");
  const digest = crypto.createHash("sha256").update(payload).digest();

  // 2. Derive PDAs
  const programId = new PublicKey(config.programId);
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("web3mcp"), Buffer.from("config")],
    programId
  );
  const [programData] = PublicKey.findProgramAddressSync(
    [programId.toBuffer()],
    BPF_LOADER_UPGRADEABLE_PROGRAM_ID
  );

  // 3. Step 1: Initialize Config PDA in Uploading state
  console.log("Initializing Config PDA (status = 1)...");
  await program.methods
    .initializeConfig(wallet.publicKey, payload.length, Array.from(digest))
    .accounts({
      authority: wallet.publicKey,
      program: programId,
      programData,
      config: configPda,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  // 4. Step 2: Stream sequential chunks
  const totalChunks = Math.ceil(payload.length / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const offset = i * CHUNK_SIZE;
    const chunk = payload.subarray(offset, Math.min(offset + CHUNK_SIZE, payload.length));
    console.log(\`Uploading chunk \${i + 1}/\${totalChunks}...\`);

    await program.methods
      .writeConfigChunk(offset, chunk)
      .accounts({ authority: wallet.publicKey, config: configPda })
      .rpc();

    if (CHUNK_DELAY_MS > 0) await new Promise(r => setTimeout(r, CHUNK_DELAY_MS));
  }

  // 5. Step 3: Finalize and verify digest on-chain
  console.log("Finalizing config (status = 2 Published)...");
  await program.methods
    .finalizeConfig()
    .accounts({ authority: wallet.publicKey, config: configPda })
    .preInstructions([ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 })])
    .rpc();

  // 6. Post-publish verification via protocol validator
  const accountInfo = await connection.getAccountInfo(configPda, "confirmed");
  const programAccount = await connection.getAccountInfo(programId, "confirmed");
  const check = validateDiscoveredConfig({
    programId: programId.toBase58(),
    programAccount,
    configAddress: configPda.toBase58(),
    configAccount: accountInfo,
  });

  if (!check.valid) throw new Error(\`Validation failed: \${check.errors.join("; ")}\`);
  console.log("Config published and verified successfully!");
}`,
          },
        },
        {
          id: "pub-verification",
          title: "4. Post-Publish Verification & Conformance",
          description: "After finalize_config succeeds, verify that the on-chain account header contains status = 2 (Published), matches the exact byte length, and matches the SHA-256 digest. Run Web3MCP Host CLI discovery to test live tool rendering.",
          code: {
            language: "bash",
            code: `# Test tool discovery immediately on Solana Devnet
npm run host -- --program <YOUR_PROGRAM_ID>

# Discover program tools programmatically using the SDK
node -e "
  const { Connection } = require('@solana/web3.js');
  const { Web3McpSdk } = require('@web3mcp/sdk');
  const sdk = new Web3McpSdk({ connection: new Connection('https://api.devnet.solana.com') });
  sdk.discover('<YOUR_PROGRAM_ID>').then(() => {
    console.log(sdk.getTools('<YOUR_PROGRAM_ID>').map(t => t.name));
  });
"`,
          },
        },
        {
          id: "pub-troubleshooting",
          title: "5. Troubleshooting Common Publisher Errors",
          description: "Common issues encountered when publishing to Solana Devnet and how to resolve them:",
          items: [
            "**429 Too Many Requests**: Public RPC rate limit exceeded during chunk loop. Add 500ms delay between chunks and implement exponential backoff retry.",
            "**Program failed to complete (Compute Limit)**: Finalize SHA-256 hashing exceeded default 200,000 CUs. Prepend `ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 })` to `finalizeConfig`.",
            "**Custom 6001 (Unauthorized)**: Signer wallet is not the program's upgrade authority. Ensure signing key matches the BPF program deployment authority.",
            "**Custom 6002 (InvalidDigest)**: SHA-256 digest mismatch on finalization. Ensure JSON string serialization is identical in generator and publisher without reformatting.",
            "**Transaction too large**: Chunk size exceeds Solana IPv6 MTU limit. Keep `CHUNK_SIZE` at 800 bytes or lower.",
          ],
          table: {
            headers: ["Error / Symptom", "Root Cause", "Resolution"],
            rows: [
              ["429 Too Many Requests", "Devnet RPC rate limit exceeded during chunk loop", "Add 500ms delay between chunks and implement exponential backoff retry."],
              ["Program failed to complete (Compute Limit)", "Finalize SHA-256 hashing exceeded default 200,000 CUs", "Add ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }) to finalizeConfig."],
              ["Custom 6001 (Unauthorized)", "Signer wallet is not the program's upgrade authority", "Ensure signing key matches the BPF program deployment authority."],
              ["Custom 6002 (InvalidDigest)", "SHA-256 digest mismatch on finalization", "Ensure JSON string serialization is identical in generator and publisher (no reformatting)."],
              ["Transaction too large", "Chunk size exceeds Solana IPv6 MTU limit", "Keep CHUNK_SIZE at 800 bytes or lower."],
            ],
          },
        },
      ],
    },
  },
  {
    id: "agent-wallet",
    category: "Implementation",
    title: "Implement a compatible agent host",
    badge: "Host requirements",
    summary: "Load validated tools on demand and keep signing under user control.",
    content: {
      overview: "A host receives a program ID, fetches its config through RPC, validates it, and exposes only supported tools to its model. The model proposes a tool and arguments. The host controls reads, transaction preparation, review, signing, and submission.",
      callouts: [
        { type: "security", title: "Treat metadata as untrusted", text: "Program ownership identifies the publisher, but does not prove the tool is safe. Do not use tool descriptions or claimed effects as authorization." },
      ],
      subsections: [
        {
          id: "host-discovery",
          title: "Discover and validate",
          description: "Agent hosts discover and validate program tools before exposing them to the LLM:",
          items: [
            "**Derive Config PDA**: Deterministically derive `['web3mcp', 'config']` under the target program ID.",
            "**Verify Ownership**: Assert the account is owned by the program and has status `Published` (2).",
            "**Integrity Verification**: Assert the account data length matches `expected_len` and SHA-256 digest matches.",
            "**Schema Validation**: Validate envelope structure, Draft-07 input schemas, and Anchor IDL bindings fail-closed.",
          ],
        },
        {
          id: "host-reads",
          title: "Read accounts",
          description: "Executing read queries requires no transaction fees or wallet signatures:",
          items: [
            "**Resolve Address**: Extract the target account address from arguments or derive via declared PDA seeds.",
            "**RPC Fetch**: Fetch account data from the Solana cluster using `getAccountInfo`.",
            "**Discriminator Check**: Verify the account discriminator matches the expected Anchor struct header.",
            "**Decode State**: Deserialize binary fields using the embedded IDL type definitions and return structured JSON.",
          ],
        },
        {
          id: "host-writes",
          title: "Prepare and approve writes",
          description: "Executing write instructions enforces strict user review and cryptographic signing boundaries:",
          items: [
            "**Construct Instruction**: Validate inputs against `inputSchema` and resolve required account public keys.",
            "**Simulate Transaction**: Simulate execution via Solana RPC to inspect balance diffs and account state changes.",
            "**Present Human Summary**: Display the human-readable summary, simulation results, and message hash to the user.",
            "**Explicit Wallet Signature**: Prompt the connected wallet for explicit user approval; the LLM never signs.",
            "**Verify & Submit**: Verify that the signed message hash matches the simulated transaction before broadcast.",
          ],
        },
      ],
    },
  },
  {
    id: "typescript-sdk",
    category: "Implementation",
    title: "Use the Node.js SDK",
    badge: "Implementation library",
    summary: "Use @web3mcp/sdk to implement protocol discovery, reads, and prepared writes.",
    content: {
      overview: "@web3mcp/sdk implements the protocol's host-side validation and Solana RPC operations. It is a Node.js library, not the protocol itself.",
      codeBlocks: [
        { title: "Install from npm", language: "bash", code: "npm install @web3mcp/sdk @solana/web3.js" },
        {
          title: "Discover the Devnet reference program",
          language: "javascript",
          code: [
            'import { Connection } from "@solana/web3.js";',
            'import { Web3McpSdk } from "@web3mcp/sdk";',
            "",
            `const programId = "${VAULT_PROGRAM_ID}";`,
            'const sdk = new Web3McpSdk({ connection: new Connection("https://api.devnet.solana.com") });',
            "await sdk.discover(programId);",
            "console.log(sdk.getTools(programId).map(({ name, solana }) => ({ name, kind: solana.kind })));",
            "",
            "if (process.argv[2]) {",
            '  const vault = await sdk.executeRead("get_vault_by_owner", { ownerAddress: process.argv[2] }, { programId });',
            "  console.log(vault);",
            "}",
          ].join("\n"),
        },
      ],
      subsections: [
        {
          id: "sdk-write-flow",
          title: "Prepare a write",
          description: "Preparing and executing wallet-approved transactions follows a 5-step lifecycle:",
          items: [
            "**1. Prepare Instruction**: Call `prepareInstruction` with the tool name, arguments, program ID, and connected wallet signer.",
            "**2. Simulate & Review**: Inspect simulated transaction effects, balance diffs, and the transaction message hash.",
            "**3. Human Approval**: Display the human-readable summary and prompt the user for explicit confirmation in the wallet UI.",
            "**4. Sign Transaction**: The user's wallet signs the prepared transaction (`prepared.transaction`); the model never touches private keys.",
            "**5. Submit & Confirm**: Call `submitSignedTransaction` to broadcast to Solana RPC and wait for cluster confirmation. Prepare again if the blockhash expires.",
          ],
        },
        {
          id: "sdk-scope",
          title: "Package boundary & language independence",
          description: "The npm package is an implementation library, not the protocol itself:",
          items: [
            "**Language Agnostic**: The Web3MCP wire format is defined by the on-chain binary header and JSON schema, not TypeScript.",
            "**Custom Host Implementations**: Developers building hosts in Rust, Go, or Python can implement discovery and simulation directly.",
            "**CLI Independence**: The terminal Host CLI is an example consumer; other agent hosts and backends can import `@web3mcp/sdk` directly.",
            "**Embedded Conformance**: The package exports `validateDiscoveredConfig` for offline and integration testing without network calls.",
          ],
        },
      ],
    },
  },
  {
    id: "playground",
    category: "Reference",
    title: "Devnet reference program",
    badge: "Protocol example",
    summary: "Interactive tool explorer for deployed Devnet reference programs.",
    content: {
      overview: "Web3MCP maintains live reference programs on Solana Devnet to prove protocol discovery, account decoding, and simulated execution. Explore their published tools, live accounts, and CLI discovery commands below.",
      subsections: [{
        id: "reference-tools-breakdown",
        title: "Published tools summary",
        description: "The Devnet reference vault program " + VAULT_PROGRAM_ID + " demonstrates segregated PDA vault deposits and withdrawals. The protocol guard program " + GUARD_PROGRAM_ID + " demonstrates non-custodial risk parameter updates and emergency circuit breaking.",
        items: [
          "**Reference Vault (" + VAULT_PROGRAM_ID + ")**: Custodial SOL vault with segregated accounts per owner wallet.",
          "**Protocol Guard (" + GUARD_PROGRAM_ID + ")**: Non-custodial risk management and emergency circuit breaker.",
        ],
        table: {
          headers: ["Program", "Program ID", "Config PDA", "Tools Published"],
          rows: [
            ["Reference Vault", VAULT_PROGRAM_ID, VAULT_CONFIG_PDA, "5 tools (2 reads, 3 writes)"],
            ["Protocol Guard", GUARD_PROGRAM_ID, GUARD_CONFIG_PDA, "5 tools (1 read, 4 writes)"],
          ],
        },
      }],
    },
  },
  {
    id: "protocol-guard-reference",
    category: "Reference",
    title: "Protocol Guard Reference",
    badge: "Live Devnet",
    summary: "Non-custodial risk guard and emergency circuit-breaker program on Solana Devnet with 5 published tools.",
    content: {
      overview: "reference-protocol-guard proves that Web3MCP generalizes to non-custodial administrative, operational, and risk-management programs. Deployed to Solana Devnet at " + GUARD_PROGRAM_ID + ", it publishes 1 read query and 4 wallet-approved instructions without any token custody or vault escrow.",
      tables: [
        {
          headers: ["Contract Account", "Base58 Address", "Seeds / Role"],
          rows: [
            ["Program ID", GUARD_PROGRAM_ID, "Deployed executable BPF program"],
            ["Config PDA", GUARD_CONFIG_PDA, "Seeds: ['web3mcp', 'config'] (Status: Published)"],
            ["State PDA", GUARD_STATE_PDA, "Seeds: ['protocol_guard'] (Global operational state)"],
          ],
        },
      ],
      subsections: [
        {
          id: "guard-tools-breakdown",
          title: "Published Tool Catalog",
          description: "All 5 tools are discovered dynamically from on-chain config through Solana RPC without importing the program source or IDL:",
          items: [
            "**get_protocol_status (accountRead)**: Reads global operational mode, circuit breaker flag, fee bps, and volume thresholds.",
            "**trip_circuit_breaker (instruction)**: Instant emergency freeze. Flips `is_paused = true` and `operational_mode = 2`.",
            "**resume_protocol (instruction)**: Resumes normal operations after an emergency. Requires admin authority.",
            "**update_risk_parameters (instruction)**: Updates fee basis points, maximum utilization cap, and volume limits.",
            "**set_operator (instruction)**: Delegates a hot operator key for automated circuit-breaking bots.",
          ],
          table: {
            headers: ["Tool Name", "Kind", "Signer / Source", "Operation & Effects"],
            rows: [
              ["get_protocol_status", "accountRead", "PDA ['protocol_guard']", "Reads operational mode (0=Normal, 1=Caution, 2=Emergency), circuit breaker flag, fee bps, and volume."],
              ["trip_circuit_breaker", "instruction", "operator or authority", "Emergency halt: flips is_paused=true and operational_mode=2. stateChanging: true, financial: false."],
              ["resume_protocol", "instruction", "admin authority", "Resumes operations: flips is_paused=false and operational_mode=0. stateChanging: true, financial: false."],
              ["update_risk_parameters", "instruction", "admin authority", "Sets fee_basis_points (u64), max_utilization_bps (u64), and epoch_volume_limit (u64)."],
              ["set_operator", "instruction", "admin authority", "Delegates hot operator key for automated circuit-breaking bots without sharing admin master key."],
            ],
          },
        },
        {
          id: "guard-manifest-sample",
          title: "Verified On-Chain Manifest Excerpt",
          description: "Examine how reference-protocol-guard publishes its state read using v0.2 constant PDA seeds and binds its emergency circuit breaker to the wallet signer.",
          code: {
            language: "json",
            code: `{
  "standard": "web3mcp",
  "version": "0.2.0",
  "programId": "BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA",
  "tools": [
    {
      "name": "get_protocol_status",
      "title": "Get Protocol Status & Risk Parameters",
      "description": "Reads global protocol guard state: operational mode, circuit breaker, fee basis points, and volume usage.",
      "annotations": { "readOnlyHint": true, "untrustedContentHint": false },
      "inputSchema": {
        "type": "object",
        "properties": {},
        "required": [],
        "additionalProperties": false
      },
      "solana": {
        "kind": "accountRead",
        "account": "ProtocolGuard",
        "accounts": {
          "guard": {
            "source": "pda",
            "seeds": [{ "kind": "const", "value": [112, 114, 111, 116, 111, 99, 111, 108, 95, 103, 117, 97, 114, 100] }]
          }
        }
      }
    },
    {
      "name": "trip_circuit_breaker",
      "title": "Trip Emergency Circuit Breaker",
      "description": "Instantly freezes protocol operations and sets mode to Emergency Paused. Executed by operator or admin.",
      "annotations": { "readOnlyHint": false, "untrustedContentHint": false },
      "inputSchema": { "type": "object", "properties": {}, "required": [], "additionalProperties": false },
      "solana": {
        "kind": "instruction",
        "instruction": "trip_circuit_breaker",
        "accounts": {
          "signer": { "source": "signer" },
          "guard": { "source": "idl" }
        },
        "effects": {
          "stateChanging": true,
          "financial": false,
          "summary": "Trips emergency circuit breaker to halt protocol operations"
        }
      }
    }
  ]
}`,
          },
        },
        {
          id: "guard-cli-commands",
          title: "Discovery & Interaction Commands",
          description: "Test discovery and inspect published tools against live Solana Devnet using the Web3MCP Host CLI or SDK.",
          items: [
            "**Host CLI Discovery**: Run `npm run host -- --program BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA` to launch the interactive prompt.",
            "**Natural Language Invocations**: Issue prompts like `Check protocol status` or `Trip the circuit breaker` to test automated tool proposals.",
          ],
          code: {
            language: "bash",
            code: `# Discover tools and inspect protocol state using the Host CLI
npm run host -- --program BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA

# In Host CLI prompt:
> Check protocol status
> Update risk parameters with fee 250 bps and utilization 8500 bps`,
          },
        },
      ],
    },
  },
];
