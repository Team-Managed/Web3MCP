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
      description: string;
      code?: { language: string; code: string };
      table?: { headers: string[]; rows: string[][] };
    }[];
  };
}

export const DOCS_SECTIONS: DocSection[] = [
  {
    id: "overview",
    category: "Get Started",
    title: "Web3MCP Protocol Overview",
    badge: "Open Protocol",
    summary:
      "Open wire protocol for Solana programs to self-publish verifiable AI tool manifests in program-owned PDAs.",
    content: {
      overview:
        "Web3MCP is an open on-chain wire standard, not an SDK or proprietary library. It defines how any Solana smart contract self-publishes verifiable tool declarations and Anchor IDLs directly on-chain at canonical Program Derived Addresses (PDAs). Any compliant host runtime in any programming language (Rust, TypeScript, Go, Python) can discover and call these tools over standard Solana RPC—executing reads signature-free and presenting simulated transactions to human wallets for explicit approval.",
      callouts: [
        {
          type: "security",
          title: "The Golden Trust Boundary",
          text: "The LLM never signs transactions and never holds private keys. The model proposes tool names and scalar arguments; the host performs strict input validation, deterministically resolves accounts, simulates execution against Solana RPC, and renders an interactive terminal review card requiring explicit human wallet confirmation before broadcast.",
        },
      ],
      tables: [
        {
          headers: [
            "Dimension",
            "Solana Action Kits / Plugins",
            "Off-Chain MCP Servers (Anthropic)",
            "On-Chain Anchor IDL Buffers",
            "Web3MCP (This Protocol)",
          ],
          rows: [
            [
              "Discovery Location",
              "Off-chain npm package",
              "Off-chain HTTP / stdio endpoint",
              "On-chain buffer account",
              "Program-owned canonical Config PDA",
            ],
            [
              "Infrastructure",
              "Client library dependencies",
              "Dedicated server process per app",
              "None",
              "Zero off-chain servers; 100% standard Solana RPC",
            ],
            [
              "Program Coupling",
              "High (custom plugins per protocol)",
              "High (bespoke API wrapper)",
              "None (raw instructions)",
              "Zero (pure runtime discovery via RPC)",
            ],
            [
              "Tool Schema",
              "Hardcoded TypeScript / Zod",
              "JSON-RPC schema",
              "Raw IDL instruction args",
              "Normative JSON Schema (inputSchema)",
            ],
            [
              "Key Custody",
              "Often risky autonomous bot keys",
              "Server or agent environment",
              "Explorer / CLI only",
              "Strict human wallet approval boundary",
            ],
            [
              "Pre-Simulation",
              "Ad-hoc or none",
              "Ad-hoc",
              "None",
              "Mandatory live RPC pre-simulation",
            ],
          ],
        },
      ],
      subsections: [
        {
          id: "protocol-architecture",
          title: "Protocol Architecture",
          description:
            "Because Web3MCP is a pure protocol, it eliminates the off-chain discovery bottleneck. Smart contract publishers write their tools to on-chain accounts. Any agent host discovers them purely by reading chain state at seeds ['web3mcp', 'config']. When the contract upgrades its tools on-chain, every agent across the network automatically discovers the new tools with zero software updates.",
        },
        {
          id: "core-pipeline",
          title: "The Discovery & Execution Pipeline",
          description:
            "The protocol divides responsibilities strictly between chain state, host validation, and human authorization:",
          table: {
            headers: ["Stage", "Actor", "Action & Guarantees"],
            rows: [
              ["1. Discovery", "Target Program PDA", "Program self-publishes 81-byte header + JSON IDL & tool schema."],
              ["2. Ingestion", "Host Runtime", "Fetches Config PDA over standard RPC, verifies SHA-256 digest, compiles dynamic Borsh coders."],
              ["3. Tool Calling", "AI Model (LLM)", "Inspects strict JSON Schema tools, outputs scalar parameters. Cannot access private keys."],
              ["4. Account Resolution", "Host Runtime", "Resolves accounts via 4-tier declarative sources (signer, input, program, IDL PDA seeds)."],
              ["5. Pre-Simulation", "Solana RPC", "Pre-simulates transaction on live RPC; verifies Compute Units, return data, and validator logs."],
              ["6. Human Approval", "User Wallet", "Terminal review card displays exact accounts, fee, and effects; user confirms [y/N]."],
            ],
          },
        },
      ],
    },
  },
  {
    id: "typescript-sdk",
    category: "Get Started",
    title: "TypeScript SDK (@web3mcp)",
    badge: "SDK Reference",
    summary:
      "Official unified TypeScript/JavaScript SDK for on-chain tool discovery, PDA derivation, Anchor binary unpacking, and AI agent integration.",
    content: {
      overview:
        "The official `@web3mcp` npm package bundles both host runtime execution and protocol validation into a single, zero-overhead SDK for AI agent hosts, wallets, and Solana developers. It enables discovering on-chain tools dynamically, cryptographically verifying manifest integrity, resolving Anchor accounts, and formatting tool declarations for LLM providers (Anthropic Claude, OpenAI, and LangChain) without any off-chain proxy servers.",
      callouts: [
        {
          type: "info",
          title: "Zero Off-Chain Server Dependency",
          text: "Unlike traditional MCP bridges that require running local Docker daemons or stdio process wrappers, the Web3MCP TypeScript SDK connects directly to any Solana JSON-RPC endpoint. Discovery and reads are 100% signature-free, and instructions are pre-simulated before reaching user wallets.",
        },
        {
          type: "security",
          title: "Fail-Closed Cryptographic Verification",
          text: "The SDK automatically validates the 8-byte Anchor discriminator ('account:Web3McpConfig'), confirms the publication status equals Published (2), and computes the SHA-256 hash of the UTF-8 payload to guarantee bit-for-bit parity with the on-chain digest before presenting tools to any model.",
        },
      ],
      codeBlocks: [
        {
          title: "1. Installation",
          language: "bash",
          code: `# Install the unified @web3mcp package via npm, yarn, or pnpm
npm install @web3mcp @solana/web3.js

# Or with pnpm
pnpm add @web3mcp @solana/web3.js`,
        },
        {
          title: "2. Complete End-to-End Discovery & Verification Example",
          language: "typescript",
          code: `import { Connection, PublicKey } from "@solana/web3.js";
import {
  deriveConfigPda,
  parseConfigAccount,
  validateConfig,
  PublicationStatus,
} from "@web3mcp";

async function discoverProgramTools(programIdStr: string) {
  // 1. Initialize standard Solana connection
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // 2. Derive canonical Web3MCP Config PDA: seeds = ["web3mcp", "config"]
  const { pda, bump } = deriveConfigPda(programIdStr);
  console.log(\`Derived Config PDA: \${pda} (bump \${bump})\`);

  // 3. Fetch on-chain account data (Zero off-chain middleman)
  const accountInfo = await connection.getAccountInfo(new PublicKey(pda));
  if (!accountInfo) {
    throw new Error(\`No Web3MCP configuration found for program \${programIdStr}\`);
  }

  // 4. Parse Anchor binary layout & verify SHA-256 integrity hash
  const parsed = parseConfigAccount(accountInfo.data);

  if (parsed.status !== PublicationStatus.Published) {
    throw new Error("Configuration is still uploading or uninitialized");
  }

  console.log(\`Verified Publisher Authority: \${parsed.authority}\`);
  console.log(\`SHA-256 Digest Match: \${parsed.digest}\`);

  // 5. Validate normative Web3MCP JSON Schema
  const validation = validateConfig(parsed.config);
  if (!validation.valid) {
    throw new Error(\`Schema validation failed: \${JSON.stringify(validation.errors)}\`);
  }

  // 6. Discover tools dynamically
  console.log(\`Successfully discovered \${parsed.config.tools.length} on-chain tools!\`);
  for (const tool of parsed.config.tools) {
    console.log(\`  - \${tool.name} (\${tool.solana.kind}): \${tool.description}\`);
  }

  return parsed.config;
}`,
        },
        {
          title: "3. Format Discovered Tools for Anthropic Claude & OpenAI Agents",
          language: "typescript",
          code: `// Convert on-chain Web3MCP tools directly into Anthropic Claude tool format
export function toAnthropicTools(web3mcpTools: any[]) {
  return web3mcpTools.map((tool) => ({
    name: tool.name,
    description: \`[Web3MCP \${tool.solana.kind.toUpperCase()}] \${tool.description}\`,
    input_schema: {
      type: "object",
      properties: tool.inputSchema?.properties || {},
      required: tool.inputSchema?.required || [],
    },
  }));
}

// Convert into OpenAI / LangChain Function Calling format
export function toOpenAITools(web3mcpTools: any[]) {
  return web3mcpTools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.inputSchema?.properties || {},
        required: tool.inputSchema?.required || [],
      },
    },
  }));
}`,
        },
      ],
      tables: [
        {
          headers: ["Exported Member", "Signature / Type", "Description"],
          rows: [
            ["deriveConfigPda", "(programId: string) => { pda: string, bump: number }", "Derives the canonical Config PDA address and bump seed for any target program ID."],
            ["CONFIG_PDA_SEEDS", "Buffer[]", "Normative seed buffers [Buffer.from('web3mcp'), Buffer.from('config')]."],
            ["parseConfigAccount", "(data: Buffer | Uint8Array) => ParsedAccount", "Deserializes Anchor binary layout, verifies 8-byte discriminator, and verifies SHA-256 digest."],
            ["serializeConfigAccount", "(params: SerializeParams) => Buffer", "Serializes authority, status, and JSON payload into 81-byte header + data for publishing."],
            ["PublicationStatus", "enum { Uninitialized: 0, Uploading: 1, Published: 2 }", "Publication state machine on-chain status code."],
            ["CONFIG_ACCOUNT_DISCRIMINATOR", "Buffer (8 bytes)", "8-byte Anchor discriminator buffer sha256('account:Web3McpConfig')[0..8]."],
            ["validateConfig", "(configObj: object) => ValidationResult", "Validates parsed configuration against normative Web3MCP v0.1 JSON Schema."],
            ["validateConfigSchema", "(jsonStr: string) => ValidationResult", "Validates raw JSON string with Ajv compiler in fail-closed mode."],
          ],
        },
      ],
      subsections: [
        {
          id: "pda-derivation-api",
          title: "PDA Derivation API",
          description:
            "Every Web3MCP program publishes its configuration to a deterministic PDA derived using normative seeds: ['web3mcp', 'config']. The SDK ensures exact seed byte alignment across runtimes.",
          code: {
            language: "typescript",
            code: `import { deriveConfigPda } from "@web3mcp";

// Derives PDA synchronously from any Base58 Program ID
const { pda, bump } = deriveConfigPda("GgVnzvsM32h953kU2k1v5GjA1j6kS2f54Lyrgv");
// Returns: { pda: "9WzDXwBbmKg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", bump: 254 }`,
          },
        },
        {
          id: "account-parsing-api",
          title: "Anchor Deserializer & Integrity Verification",
          description:
            "The deserializer checks the 8-byte Anchor discriminator (0x991dc793e1358b35), unpacks the 32-byte publisher authority, publication status, declared length, and computes SHA-256 of the payload bytes.",
          code: {
            language: "typescript",
            code: `import { parseConfigAccount, ConfigAccountError } from "@web3mcp";

try {
  const result = parseConfigAccount(rawAccountBuffer);
  console.log("Authority:", result.authority);
  console.log("Status:", result.status); // 2 = Published
  console.log("Embedded IDL Name:", result.config.idl.name);
  console.log("Tool Manifests:", result.config.tools);
} catch (err) {
  if (err instanceof ConfigAccountError) {
    console.error("Tampered or invalid Web3MCP account:", err.message);
  }
}`,
          },
        },
        {
          id: "live-rpc-simulation-seam",
          title: "Live RPC Pre-Simulation & Wallet Approval",
          description:
            "The golden rule of Web3MCP is that the LLM proposes arguments, but never signs. The host constructs the exact VersionedTransaction or TransactionInstruction and simulates it against live RPC before presenting to the user's wallet.",
          code: {
            language: "typescript",
            code: `import { Connection, Transaction, TransactionInstruction, PublicKey } from "@solana/web3.js";

// Construct instruction from discovered Web3MCP tool manifest
const instruction = new TransactionInstruction({
  programId: new PublicKey(config.programId),
  keys: resolvedAccounts,
  data: encodedBorshBuffer,
});

const tx = new Transaction().add(instruction);
tx.feePayer = userWalletPublicKey;
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

// Pre-simulate on Solana RPC (Never broadcast uninspected agent proposals)
const simulation = await connection.simulateTransaction(tx);
if (simulation.value.err) {
  throw new Error(\`Simulation failed: \${JSON.stringify(simulation.value.err)}\`);
}

console.log(\`Simulation succeeded! Consumed \${simulation.value.unitsConsumed} compute units.\`);
// Present exact balance delta and instruction details to Phantom / Solflare wallet for human approval`,
          },
        },
      ],
    },
  },
  {
    id: "cli",
    category: "Guides",
    title: "Host CLI & Agent Runner",
    badge: "CLI Reference",
    summary:
      "Inspect program tools, run conversational agent sessions, and validate protocol configurations.",
    content: {
      overview:
        "The Web3MCP reference host provides command-line binaries for inspecting on-chain configurations, running autonomous conversational agents with human approval, and validating protocol schemas offline.",
      codeBlocks: [
        {
          title: "Conversational Agent State Check & Multi-Turn Guidance",
          language: "text",
          code: `────────────────────────────────────────────────────────
gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv
> deposit 10% of my remaining wallet balance into the vault
⠇ Thinking...

• Wallet Balance Required

The available on-chain tools allow reading vault PDA state (get_vault), but do not include a direct query for your external wallet's native SOL balance.

How to Proceed

1. State your current wallet SOL balance (for example, "my wallet balance is 2.5 SOL"), or
2. Specify the exact amount you want to deposit directly (for example, "deposit 0.1 SOL").

Units and Considerations
• 1 SOL = 1,000,000,000 lamports
• Always leave a small amount of SOL (at least 0.005 SOL) in your wallet to cover network transaction fees.

Once you provide the amount, I will prepare the deposit transaction for your wallet review.
────────────────────────────────────────────────────────
gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv
> █`,
        },
      ],
      subsections: [
        {
          id: "host-inspector-commands",
          title: "1. Host Inspector (web3mcp-host)",
          description:
            "The inspector tool lets developers explore on-chain program configurations, inspect JSON Schema tool definitions, and execute live queries directly in the terminal.",
          code: {
            language: "bash",
            code: `# Discover tools for the Reference Vault on Devnet
npm run host:inspect -- discover GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv

# Output tools in standard OpenAI function calling format
npm run host:inspect -- tools GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv --openai

# Query account state signature-free
npm run host:inspect -- read get_vault '{"vaultOwner":"CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG"}' --program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv

# Pre-simulate an instruction tool with declared signer
npm run host:inspect -- prepare deposit '{"amount":"100000000"}' --signer CniPSdkAUaNTfZZUSKvAKU2VJuWecRjqvGhDmQjGSZEG --program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv`,
          },
        },
        {
          id: "conversational-agent-cli",
          title: "2. Interactive Agent CLI (web3mcp-agent)",
          description:
            "Launches an autonomous terminal agent connected to your choice of LLM provider. Read tools execute autonomously; state-changing transactions trigger an interactive terminal review card with explicit human confirmation.",
          table: {
            headers: ["Slash Command", "Description"],
            rows: [
              ["/tools", "Lists all discovered program tools with types and descriptions"],
              ["/balance", "Checks connected wallet SOL balance and active vault state"],
              ["/keygen", "Generates a fresh local devnet keypair file if none exists"],
              ["/clear", "Clears terminal screen while preserving conversational history"],
              ["/help", "Displays available interactive commands and keyboard shortcuts"],
              ["/exit", "Cleanly terminates the agent session"],
            ],
          },
        },
        {
          id: "protocol-validator-cli",
          title: "3. Protocol Validator (web3mcp-validate)",
          description:
            "A standalone tool to validate Web3MCP configuration files or raw binary accounts offline against the frozen protocol schema without requiring an active RPC connection.",
          code: {
            language: "bash",
            code: `# Validate a JSON configuration file against protocol schema
node protocol/bin/validate.js path/to/config.json

# Validate raw binary account dump
node protocol/bin/validate.js protocol/fixtures/binary/valid-published.bin`,
          },
        },
      ],
    },
  },
  {
    id: "publisher-guide",
    category: "Guides",
    title: "Solana Program Publisher Guide",
    badge: "Anchor & Solana",
    summary:
      "Comprehensive, end-to-end guide for Solana program developers to declare, chunk, and publish self-sovereign AI tool manifests with on-chain SHA-256 verification.",
    content: {
      overview:
        "Solana transactions are strictly constrained by a 1,232-byte IPv6 MTU limit. However, rich AI tool manifests with embedded Anchor IDLs frequently range from 4 KiB to 30 KiB. Web3MCP resolves this by defining an on-chain publishing standard: a program-owned Config PDA derived at canonical seeds ['web3mcp', 'config'], an 81-byte normative Anchor binary header, a 3-phase chunked upload lifecycle, and cryptographic verification via Solana's native sol_sha256 syscall.",
      callouts: [
        {
          type: "info",
          title: "Self-Sovereign On-Chain Tooling",
          text: "When you publish your Web3MCP manifest to your program's Config PDA, any Web3MCP host anywhere on Solana instantly discovers your tools over standard RPC. You never need to host an off-chain server, submit tools to a centralized registry, or maintain bespoke API endpoints.",
        },
      ],
      subsections: [
        {
          id: "canonical-pda-and-header",
          title: "1. Canonical PDA & Binary Layout",
          description:
            "Every program publishes its tools to a deterministic PDA derived using its own Program ID and the literal seeds ['web3mcp', 'config']. The account begins with an 81-byte fixed Anchor binary header followed by a 4-byte length prefix and the raw UTF-8 JSON payload buffer:",
          table: {
            headers: ["Offset", "Size", "Field Name", "Rust Type", "Description & Invariants"],
            rows: [
              ["0", "8 bytes", "discriminator", "[u8; 8]", "Anchor account discriminator: sha256('account:Web3McpConfig')[..8]"],
              ["8", "32 bytes", "authority", "Pubkey", "Authorized updater / publisher public key with mutation rights"],
              ["40", "1 byte", "status", "u8", "0 = Uninitialized, 1 = Uploading, 2 = Published (verified)"],
              ["41", "32 bytes", "digest", "[u8; 32]", "Expected SHA-256 hash of the complete uncompressed UTF-8 payload"],
              ["73", "4 bytes", "expected_len", "u32", "Expected total payload length in bytes (little-endian, capped at 65,536)"],
              ["77", "4 bytes", "payload_len", "u32", "Current uploaded payload byte length prefix (little-endian)"],
              ["81+", "Dynamic", "payload", "Vec<u8>", "Raw UTF-8 JSON payload buffer containing tool definitions and IDL"],
            ],
          },
        },
        {
          id: "anchor-account-struct",
          title: "2. Anchor Account Struct & Custom Errors",
          description:
            "Define the Web3McpConfig account and specific error codes in your Anchor program:",
          code: {
            language: "rust",
            code: `use anchor_lang::prelude::*;

pub const CONFIG_SEED_PREFIX: &[u8] = b"web3mcp";
pub const CONFIG_SEED_SUFFIX: &[u8] = b"config";
pub const MAX_PAYLOAD_SIZE: usize = 65_536; // 64 KiB protocol cap

#[account]
pub struct Web3McpConfig {
    pub authority: Pubkey,     // 32 bytes (offset 8)
    pub status: u8,            // 1 byte   (offset 40)
    pub digest: [u8; 32],      // 32 bytes (offset 41)
    pub expected_len: u32,     // 4 bytes  (offset 73)
    pub payload: Vec<u8>,      // 4 bytes prefix + N bytes dynamic (offset 77)
}

#[error_code]
pub enum Web3McpError {
    #[msg("Config account is not in Uploading status (expected 1)")]
    InvalidStatus,
    #[msg("Uploaded chunk offset does not match current buffer length")]
    OffsetMismatch,
    #[msg("Total payload length does not match expected_len declared at initialization")]
    LengthMismatch,
    #[msg("On-chain SHA-256 hash does not match expected digest")]
    DigestMismatch,
    #[msg("Payload size exceeds maximum allowed capacity (64 KiB)")]
    ExceedsMaxCapacity,
    #[msg("Unauthorized: caller does not match config authority")]
    Unauthorized,
}`,
          },
        },
        {
          id: "upload-lifecycle-matrix",
          title: "3. Three-Phase Upload State Machine",
          description:
            "The publishing lifecycle enforces a strict state machine to guarantee atomicity and prevent hosts from reading partial or corrupted tool manifests:",
          table: {
            headers: ["Phase Instruction", "Allowed Status", "Target Status", "On-Chain Validation & Action"],
            rows: [
              [
                "01. initialize_config",
                "0, 1, or 2",
                "1 (Uploading)",
                "Sets status = 1, records expected_len and SHA-256 digest, zeroes existing buffer. External hosts immediately fail-closed.",
              ],
              [
                "02. write_config_chunk",
                "1 (Uploading)",
                "1 (Uploading)",
                "Asserts offset == current_len. Dynamically reallocs account size and appends chunk slice funded by authority.",
              ],
              [
                "03. finalize_config",
                "1 (Uploading)",
                "2 (Published)",
                "Verifies current_len == expected_len. Runs native sol_sha256 syscall over payload and asserts hash equality.",
              ],
            ],
          },
        },
        {
          id: "anchor-instruction-handlers",
          title: "4. Complete Anchor Instruction Handlers",
          description:
            "Implement the three publisher instructions with automatic rent reallocation and native cryptographic hash verification:",
          code: {
            language: "rust",
            code: `#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 32 + 1 + 32 + 4 + 4, // 81 bytes base header
        seeds = [CONFIG_SEED_PREFIX, CONFIG_SEED_SUFFIX],
        bump
    )]
    pub config_account: Account<'info, Web3McpConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_config_handler(
    ctx: Context<InitializeConfig>,
    expected_len: u32,
    digest: [u8; 32],
) -> Result<()> {
    require!(expected_len as usize <= MAX_PAYLOAD_SIZE, Web3McpError::ExceedsMaxCapacity);
    let config = &mut ctx.accounts.config_account;

    // Set or verify authority
    if config.status == 0 {
        config.authority = ctx.accounts.authority.key();
    } else {
        require_keys_eq!(config.authority, ctx.accounts.authority.key(), Web3McpError::Unauthorized);
    }

    config.status = 1; // Transition to Uploading (hosts fail closed)
    config.digest = digest;
    config.expected_len = expected_len;
    config.payload.clear();
    Ok(())
}

#[derive(Accounts)]
#[instruction(offset: u32, chunk: Vec<u8>)]
pub struct WriteConfigChunk<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED_PREFIX, CONFIG_SEED_SUFFIX],
        bump,
        has_one = authority @ Web3McpError::Unauthorized,
        constraint = config_account.status == 1 @ Web3McpError::InvalidStatus,
        realloc = 8 + 32 + 1 + 32 + 4 + 4 + config_account.payload.len() + chunk.len(),
        realloc::payer = authority,
        realloc::zero = false
    )]
    pub config_account: Account<'info, Web3McpConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn write_config_chunk_handler(
    ctx: Context<WriteConfigChunk>,
    offset: u32,
    chunk: Vec<u8>,
) -> Result<()> {
    let config = &mut ctx.accounts.config_account;
    require!(offset as usize == config.payload.len(), Web3McpError::OffsetMismatch);
    require!(
        config.payload.len() + chunk.len() <= config.expected_len as usize,
        Web3McpError::LengthMismatch
    );

    config.payload.extend_from_slice(&chunk);
    Ok(())
}

#[derive(Accounts)]
pub struct FinalizeConfig<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED_PREFIX, CONFIG_SEED_SUFFIX],
        bump,
        has_one = authority @ Web3McpError::Unauthorized,
        constraint = config_account.status == 1 @ Web3McpError::InvalidStatus
    )]
    pub config_account: Account<'info, Web3McpConfig>,
    pub authority: Signer<'info>,
}

pub fn finalize_config_handler(ctx: Context<FinalizeConfig>) -> Result<()> {
    let config = &mut ctx.accounts.config_account;
    require!(
        config.payload.len() as u32 == config.expected_len,
        Web3McpError::LengthMismatch
    );

    // Cryptographic verification via Solana native syscall (sol_sha256)
    let computed_hash = solana_program::hash::hash(&config.payload);
    require!(
        computed_hash.to_bytes() == config.digest,
        Web3McpError::DigestMismatch
    );

    config.status = 2; // Published: verified and ready for agent consumption
    Ok(())
}`,
          },
        },
        {
          id: "web3mcp-json-schema",
          title: "5. Authoring the Tool Manifest (web3mcp.json)",
          description:
            "The payload uploaded to your Config PDA is a canonical JSON document containing your protocol version, embedded IDL subset, and tool descriptors with strict JSON Schema (draft-07) input bindings:",
          code: {
            language: "json",
            code: `{
  "$schema": "https://web3mcp.org/schemas/v0.1.0/envelope.json",
  "version": "0.1.0",
  "programId": "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
  "idl": {
    "version": "0.1.0",
    "name": "reference_vault",
    "instructions": [
      {
        "name": "deposit",
        "accounts": [
          { "name": "owner", "isMut": true, "isSigner": true },
          { "name": "vault", "isMut": true, "isSigner": false },
          { "name": "systemProgram", "isMut": false, "isSigner": false }
        ],
        "args": [{ "name": "amount", "type": "u64" }]
      }
    ]
  },
  "tools": [
    {
      "name": "deposit",
      "title": "Deposit SOL to Personal Vault",
      "description": "Transfers native SOL lamports from connected wallet into the segregated vault PDA.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "amount": {
            "type": "string",
            "pattern": "^[1-9][0-9]*$",
            "description": "Lamports to deposit (decimal integer string to prevent float precision loss)"
          }
        },
        "required": ["amount"],
        "additionalProperties": false
      },
      "solana": {
        "kind": "instruction",
        "instruction": "deposit",
        "accounts": {
          "owner": { "source": "signer" },
          "vault": { "source": "idl" },
          "systemProgram": { "source": "program", "address": "11111111111111111111111111111111" }
        },
        "effects": {
          "stateChanging": true,
          "financial": true,
          "summary": "Transfers native SOL from user wallet to on-chain vault PDA"
        }
      }
    }
  ]
}`,
          },
        },
        {
          id: "production-publisher-script",
          title: "6. Production TypeScript Publisher Script",
          description:
            "Automate bundling, chunking (900 bytes per chunk to stay safely below MTU), and streaming your configuration to Devnet or Mainnet:",
          code: {
            language: "typescript",
            code: `import * as fs from "fs";
import * as crypto from "crypto";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";

const CHUNK_SIZE = 900; // Safe byte size fitting inside 1,232-byte MTU

export async function publishTools(
  connection: Connection,
  authorityKeypair: Keypair,
  programId: PublicKey,
  manifestPath: string
) {
  const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
  const payloadBuffer = Buffer.from(manifestRaw, "utf-8");
  const expectedLen = payloadBuffer.length;
  const digest = crypto.createHash("sha256").update(payloadBuffer).digest();

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("web3mcp"), Buffer.from("config")],
    programId
  );

  console.log(\`Publishing Web3MCP tools to PDA: \${configPda.toBase58()}\`);
  console.log(\`Payload size: \${expectedLen} bytes | SHA-256: \${digest.toString("hex")}\`);

  const provider = new AnchorProvider(connection, new Wallet(authorityKeypair), {});
  // 1. Initialize Config (resets status to 1: Uploading)
  await program.methods
    .initializeConfig(expectedLen, Array.from(digest))
    .accounts({ configAccount: configPda, authority: authorityKeypair.publicKey })
    .rpc();

  console.log("Status set to 1 (Uploading). Streaming chunks...");

  // 2. Stream Chunks
  for (let offset = 0; offset < expectedLen; offset += CHUNK_SIZE) {
    const chunk = payloadBuffer.subarray(offset, Math.min(offset + CHUNK_SIZE, expectedLen));
    await program.methods
      .writeConfigChunk(offset, chunk)
      .accounts({ configAccount: configPda, authority: authorityKeypair.publicKey })
      .rpc();
    console.log(\`Wrote chunk offset \${offset}..\${offset + chunk.length} / \${expectedLen}\`);
  }

  // 3. Finalize on-chain (executes sol_sha256 syscall & sets status to 2: Published)
  await program.methods
    .finalizeConfig()
    .accounts({ configAccount: configPda, authority: authorityKeypair.publicKey })
    .rpc();

  console.log("Successfully published! Status is now 2 (Published). Tools are live on-chain.");
}`,
          },
        },
      ],
    },
  },
  {
    id: "agent-wallet",
    category: "Guides",
    title: "AI Agent & Wallet Approval Boundary",
    badge: "Human-in-the-Loop",
    summary:
      "Direct JSON Schema tool calling, pre-flight RPC simulation, and strict terminal wallet approval.",
    content: {
      overview:
        "The conversational agent loop binds discovered on-chain Web3MCP tool schemas directly into AI prompts across OpenAI, Anthropic Claude, Gemini, Groq, DeepSeek, and local Ollama/vLLM without intermediate Zod shims or heavy framework bloat.",
      callouts: [
        {
          type: "security",
          title: "The Golden Rule: Zero Autonomous Signing",
          text: "Web3MCP strictly decouples reasoning from signing. When the model proposes a transaction, execution halts. A high-contrast financial review card is rendered in the terminal, and signing occurs exclusively after explicit human keystroke approval ([y/N]). If the user declines, the agent gracefully acknowledges and continues without crashing.",
        },
      ],
      codeBlocks: [
        {
          title: "High-Contrast Terminal Review Card Example",
          language: "text",
          code: `╭────────────────────────────────────────────────────────────────────────╮
│ ⚠️   TRANSACTION APPROVAL REQUIRED                                     │
├────────────────────────────────────────────────────────────────────────┤
│ Tool:             deposit                                              │
│ Program ID:       GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv         │
│ Effects:          Deposits lamports from user to vault (⚠️ FINANCIAL WRITE) │
│ Estimated Fee:    ~0.000005 SOL (5000 lamports)                        │
├────────────────────────────────────────────────────────────────────────┤
│ Accounts Touched:                                                      │
│   • owner         : CniPSdkAUaNTfZZU...cRjqvGhDmQjGSZEG (SIGNER, WRITABLE) │
│   • vault         : 7Nm9VsUWReKcBrhe...g9UwXCabnd11TwXB (WRITABLE)     │
│   • system_program: 11111111111111111111111111111111 (READONLY)        │
├────────────────────────────────────────────────────────────────────────┤
│ Simulation Status: ✅ SUCCESS (4563 CUs consumed)                       │
│ Key Logs:                                                              │
│   > Program log: Instruction: Deposit                                  │
│   > Program 11111111111111111111111111111111 success                   │
│   > Program GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv consumed...   │
╰────────────────────────────────────────────────────────────────────────╯

? Approve and broadcast transaction to Devnet? [y/N] ›`,
        },
      ],
      subsections: [
        {
          id: "simulation-guarantees",
          title: "Pre-Flight Simulation Guarantees",
          description:
            "Before any transaction instruction is presented to the user, the host executes a live RPC simulation (connection.simulateTransaction). This provides three essential guarantees:",
          table: {
            headers: ["Guarantee", "Mechanism", "Benefit"],
            rows: [
              ["Execution Validity", "Live RPC simulation", "Catches missing accounts, invalid parameters, or program logic errors before spending fees"],
              ["Exact Compute Budget", "Validator CU accounting", "Determines exact Compute Units consumed (e.g. 4,563 CUs) for accurate priority fee estimation"],
              ["Financial Transparency", "Publisher effects claims", "Audits balance deductions and state alterations against declared publisher effects"],
            ],
          },
        },
        {
          id: "rejection-handling",
          title: "Graceful Rejection Handling",
          description:
            "If a user types 'n' or presses Ctrl+C at the confirmation prompt, the host cleanly aborts the transaction. The agent receives a rejection event with the latest account balances and invites the user to adjust parameters or ask questions without crashing the session.",
        },
      ],
    },
  },
  {
    id: "agent-knowledge",
    category: "Guides",
    title: "Solana Operational Knowledge",
    badge: "Operational Mental Model",
    summary:
      "Core domain guidelines, runtime invariants, and operational mental model for AI agents interacting with Solana programs.",
    content: {
      overview:
        "Web3MCP agents discover tools at runtime from program-owned Config PDAs. To successfully understand, inspect, and invoke these tools without hallucinating invalid transactions, the agent runtime grounds LLMs in the fundamental mechanics, account models, and safety invariants of the Solana runtime.",
      callouts: [
        {
          type: "info",
          title: "Injected Agent Mental Model",
          text: "Web3MCP injects domain guidelines directly into system prompts across all supported models. This eliminates hallucinated Solana mechanics such as sending decimal numbers to u64 integer fields, attempting state writes without prior balance checks, or signing on behalf of human wallets.",
        },
      ],
      subsections: [
        {
          id: "four-prime-directives",
          title: "1. The Four Prime Directives",
          description:
            "Foundational runtime invariants enforced across all Web3MCP agent prompts to prevent hallucinations and execution reverts:",
          table: {
            headers: ["Directive", "Operational Rule", "Runtime Failure Mode Prevented", "Agent Requirement"],
            rows: [
              [
                "01. Read-Before-Write",
                "Always execute accountRead queries before proposing any state mutation",
                "Eliminates blind calls on uninitialized accounts or depleted balances",
                "Query account state first; verify existing lamports and ownership",
              ],
              [
                "02. Unit & Decimals Rigor",
                "Solana programs execute exclusively on integer base units (u64)",
                "Avoids passing floating decimals like 0.05 to integer parameters",
                "Convert 1 SOL = 1,000,000,000 lamports (10^9); USDC = 10^6 base units",
              ],
              [
                "03. Fail-Closed on Ambiguity",
                "If account state or simulation is indeterminate, abort immediately",
                "Prevents proposing doomed transactions that waste user priority fees",
                "Return simulation logs with error code and solicit user clarification",
              ],
              [
                "04. Human Wallet Exclusivity",
                "The AI agent never stores private keys or signs transactions",
                "Eliminates unauthorized asset movement or rogue autonomous execution",
                "Present full simulated transaction payload to the user's wallet for approval",
              ],
            ],
          },
        },
        {
          id: "solana-account-model",
          title: "2. Solana Account Model & Invariants",
          description:
            "Solana strictly separates executable code from data. Programs are stateless; state is persisted entirely in external accounts passed by reference:",
          table: {
            headers: ["Account Primitive", "Mechanic", "Runtime Invariant", "Agent Pre-Flight Rule"],
            rows: [
              [
                "Stateless Programs",
                "Executable code accounts (executable: true)",
                "Programs store zero mutable internal state; all state lives in passed accounts",
                "Verify target program ID exists and is owned by BPFLoaderUpgradeab1e",
              ],
              [
                "Data Account Ownership",
                "Only the program designated in account.owner can mutate its data buffer",
                "Foreign programs cannot alter account bytes or deduct lamports",
                "Verify account.owner === targetProgramId before attempting deserialization",
              ],
              [
                "Lamport Accounting",
                "Native SOL balances are tracked as 64-bit unsigned integer lamports",
                "Lamport balance can never underflow or be negative",
                "Verify payer.lamports >= rent_minimum + transfer_lamports + fee",
              ],
              [
                "Account Allocation",
                "New accounts must allocate explicit byte capacity (data.length)",
                "Space cannot be expanded dynamically without runtime reallocation (realloc)",
                "Inspect account size against expected IDL struct layout before writing",
              ],
              [
                "Account Deallocation",
                "To close an account, data buffer is zeroed and all lamports drained",
                "Closed account with 0 lamports is reclaimed by runtime at slot boundary",
                "Confirm closing destination account is writable and owned by intended recipient",
              ],
            ],
          },
        },
        {
          id: "rent-exemption-rules",
          title: "3. Rent Exemption & Account Lifecycles",
          description:
            "Solana requires accounts to hold a minimum balance in lamports proportional to their byte allocation to remain exempt from storage rent eviction:",
          table: {
            headers: ["Parameter", "Formula / Value", "Runtime Rule", "Agent Implication"],
            rows: [
              [
                "Static Base Rent",
                "890,880 lamports (~0.00089 SOL)",
                "Minimum base cost required for any 0-byte account metadata overhead",
                "Any created account must hold at least this base amount",
              ],
              [
                "Byte Rate Cost",
                "6,960 lamports / byte",
                "Additional rent per byte of serialized account data buffer",
                "Compute (128 + data_bytes) * 6,960 lamports for exact rent",
              ],
              [
                "Rent Exemption Threshold",
                "Minimum 2 years of storage rent",
                "Transactions that leave an account below rent-exempt threshold will revert",
                "Always calculate rent-exemption via RPC getMinimumBalanceForRentExemption",
              ],
              [
                "Account Reclamation",
                "Drain lamports to exactly 0",
                "Reassigns owner to SystemProgram and reclaims storage",
                "When destroying a vault PDA, route all rent lamports back to the human owner",
              ],
            ],
          },
        },
        {
          id: "pda-architecture",
          title: "4. Program Derived Addresses (PDAs) & Seeds",
          description:
            "PDAs are deterministic public keys controlled exclusively by programs without corresponding private keys, derived using the 255-to-0 bump search algorithm:",
          table: {
            headers: ["PDA Mechanism", "Derivation Formula", "Cryptographic Invariant", "Security / Host Handling"],
            rows: [
              [
                "Off-Curve ed25519",
                "Hash(seeds, program_id, bump)",
                "Must NOT lie on the ed25519 elliptic curve; cannot have a private key",
                "Verify address is strictly off-curve to prevent private key impersonation",
              ],
              [
                "Canonical Bump",
                "First bump (255 -> 0) producing an off-curve address",
                "Exactly one canonical bump exists per seed sequence",
                "Always verify canonical bump; reject non-canonical bumps to prevent spoofing",
              ],
              [
                "User Segregation PDA",
                "[b\"vault\", owner_pubkey.as_ref()]",
                "Deterministically maps each user wallet to an isolated, sovereign vault",
                "Host auto-derives PDA; caller cannot maliciously substitute another user's vault",
              ],
              [
                "Protocol Config PDA",
                "[b\"web3mcp\", b\"config\"]",
                "Deterministic root anchor for program metadata and tool discovery",
                "Single source of truth for on-chain tool definitions and IDL validation",
              ],
              [
                "Program Signing (CPI)",
                "invoke_signed(&ix, accounts, &[&[seeds, &[bump]]])",
                "Only the owning program runtime can sign on behalf of its derived PDA",
                "Agent never simulates signing for PDAs; the program signs autonomously in CPI",
              ],
            ],
          },
        },
        {
          id: "compute-units-and-simulation",
          title: "5. Compute Units (CUs), Priority Fees & Simulation",
          description:
            "Every Solana instruction consumes Compute Units (CUs). Agents must simulate transactions prior to human presentation to verify execution and avoid wasted fees:",
          table: {
            headers: ["Resource / Phase", "Default Constraint", "Runtime Limit", "Agent / Host Requirement"],
            rows: [
              [
                "Instruction CUs",
                "200,000 CUs default allocation per instruction",
                "Max 1,400,000 CUs per entire transaction bundle",
                "Profile actual CU usage in simulation; set explicit limit to prevent over-allocation",
              ],
              [
                "Compute Unit Price",
                "0 micro-lamports / CU (base fee)",
                "Dynamic priority auction market per computational unit",
                "Query priority fee percentiles from RPC before proposing during network congestion",
              ],
              [
                "Transaction Size",
                "1,232 bytes (IPv6 MTU safe limit)",
                "Exceeding 1,232 bytes causes hard packet rejection",
                "Keep instruction data compact; batch accounts efficiently",
              ],
              [
                "Pre-flight Simulation",
                "simulateTransaction with sigVerify: false",
                "Validates entire instruction stack on bank fork without committing state",
                "Mandatory before wallet handoff; abort if simulation returns error or logs revert",
              ],
              [
                "Blockhash Window",
                "~150 slots (~60-90 seconds)",
                "Expired blockhashes cause immediate transaction drop",
                "Fetch fresh blockhash immediately prior to wallet signing handoff",
              ],
            ],
          },
        },
        {
          id: "conversational-mental-model",
          title: "6. Agent Multi-Turn Execution Pipeline",
          description:
            "The standardized multi-turn execution pipeline followed by Web3MCP host agents when converting natural language requests into verified on-chain executions:",
          table: {
            headers: ["Pipeline Step", "Agent Action", "Underlying RPC / Tool", "Output & Safety Verification"],
            rows: [
              [
                "01. Parse Intent",
                "Extracts operation, target assets, amounts, and program context",
                "None (Pure LLM structured reasoning)",
                "Resolves human prompt into canonical tool candidate (e.g. deposit)",
              ],
              [
                "02. Inspect State",
                "Executes read-only account query before generating instructions",
                "accountRead / getAccountInfo",
                "Confirms account existence, initialization status, and current balances",
              ],
              [
                "03. Denominate Units",
                "Converts natural human quantities into exact integer base units",
                "Math conversion (10^9 for SOL)",
                "Produces strict unsigned integer string (e.g., '500000000')",
              ],
              [
                "04. Simulate & Verify",
                "Synthesizes instruction, resolves PDAs, and runs dry-run execution",
                "simulateTransaction",
                "Verifies execution logs, ensures zero reverts, and estimates exact CU usage",
              ],
              [
                "05. Wallet Presentation",
                "Renders a clear transaction review card with diffs and fees",
                "Host Wallet Adapter (Signer UI)",
                "Displays recipient, lamports transferred, and requires explicit user signature",
              ],
            ],
          },
        },
      ],
    },
  },
  {
    id: "protocol-spec",
    category: "Specification",
    title: "Protocol Specification (v0.1.0 Frozen)",
    badge: "Normative Standard",
    summary:
      "Normative account layout, 81-byte Anchor header, discriminator, JSON Schema envelope, and scalar types.",
    content: {
      overview:
        "The Web3MCP v0.1 wire specification defines a deterministic account structure and normative JSON schema. Configurations are owned by the target program at canonical seeds, capped at 64 KiB, and verified cryptographically with native SHA-256 checksums.",
      subsections: [
        {
          id: "canonical-pda-derivation",
          title: "1. Canonical PDA Derivation",
          description:
            "The Config PDA is derived synchronously using Solana's ed25519 off-curve program derivation algorithm with two literal UTF-8 byte seeds:",
          code: {
            language: "typescript",
            code: `// Deterministic PDA derivation
const [configPda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("web3mcp", "utf8"), Buffer.from("config", "utf8")],
  targetProgramId
);
// Example for Reference Vault (GgVnzvs...):
// Config PDA: HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD`,
          },
        },
        {
          id: "anchor-binary-account-layout",
          title: "2. Anchor Binary Account Layout (81-Byte Header)",
          description:
            "The Config PDA begins with an 81-byte header followed by a 4-byte LE length prefix and raw UTF-8 JSON:",
          table: {
            headers: ["Offset", "Size", "Field", "Type", "Description"],
            rows: [
              ["0", "8 bytes", "discriminator", "[u8; 8]", 'sha256("account:Web3McpConfig")[0..8] = 0x991dc793e1358b35'],
              ["8", "32 bytes", "authority", "Pubkey", "Authorized updater / publisher public key"],
              ["40", "1 byte", "status", "u8", "0 = Uninitialized, 1 = Uploading, 2 = Published"],
              ["41", "4 bytes", "expected_len", "u32 (LE)", "Total JSON payload byte size (max 65,536 bytes)"],
              ["45", "32 bytes", "digest", "[u8; 32]", "Cryptographic SHA-256 hash of complete config JSON"],
              ["77", "4 + N bytes", "config", "Vec<u8>", "4-byte LE length prefix + raw UTF-8 JSON payload"],
            ],
          },
        },
        {
          id: "scalar-input-types",
          title: "3. Three Supported Scalar Input Types",
          description:
            "To prevent LLM hallucination and ensure deterministic binary serialization, v0.1 properties are restricted strictly to three scalar types with additionalProperties: false:",
          table: {
            headers: ["Semantic Type", "JSON Schema Pattern", "Value Representation"],
            rows: [
              ["u64", '{"type": "string", "pattern": "^[1-9][0-9]*$"}', "Unsigned 64-bit integer as decimal string (no leading zeros)"],
              ["boolean", '{"type": "boolean"}', "JSON boolean true or false"],
              ["publicKey", '{"type": "string", "pattern": "^[1-9A-HJ-NP-Za-km-z]{32,44}$"}', "Base58 Solana public key address"],
            ],
          },
        },
        {
          id: "account-resolution",
          title: "4. Four-Tier Declarative Account Resolution",
          description:
            "Accounts are resolved deterministically without arbitrary code execution or LLM address guessing:",
          table: {
            headers: ["Source Type", "Mapping Format", "Resolution Behavior"],
            rows: [
              ["signer", '{"source": "signer"}', "Bound to connected user wallet (isSigner: true)"],
              ["input", '{"source": "input", "input": "<name>"}', "Bound to Base58 public key provided in validated input arguments"],
              ["program", '{"source": "program", "address": "<pubkey>"}', "Bound to static program address (e.g. SystemProgram)"],
              ["idl", '{"source": "idl"}', "Dynamically evaluated from Anchor IDL PDA seeds (const, account, arg)"],
            ],
          },
        },
        {
          id: "fail-closed-catalog",
          title: "5. Fail-Closed Error Catalog",
          description:
            "A compliant host or validator must reject configurations under the following conditions:",
          table: {
            headers: ["Category", "Rejection Condition", "Behavior"],
            rows: [
              ["Binary", "Discriminator != 0x991dc793e1358b35", "Reject immediately (account type mismatch)"],
              ["Binary", "Status != 2 (Published)", "Reject immediately (incomplete upload)"],
              ["Binary", "Payload > 64 KiB (65,536 bytes)", "Reject immediately (exceeds size limit)"],
              ["Binary", "SHA-256(payload) != digest", "Reject immediately (checksum corruption)"],
              ["Envelope", "standard != 'web3mcp'", "Reject immediately (unknown standard)"],
              ["Envelope", "version does not match ^0.1.[0-9]+$", "Reject immediately (version unsupported)"],
              ["Envelope", "Unknown top-level fields", "Reject immediately (schema strictness)"],
              ["Schema", "Duplicate tool names in tools array", "Reject immediately"],
              ["Schema", "Unsupported inputSchema property type", "Reject immediately (only u64, boolean, publicKey)"],
              ["Schema", "effects present on accountRead tool", "Reject immediately (reads must have no effects)"],
              ["Schema", "effects missing on instruction tool", "Reject immediately (writes must declare effects)"],
            ],
          },
        },
      ],
      codeBlocks: [
        {
          title: "Normative Configuration JSON Envelope Example",
          language: "json",
          code: `{
  "standard": "web3mcp",
  "version": "0.1.0",
  "programId": "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
  "idl": {
    "version": "0.1.0",
    "name": "reference_vault",
    "instructions": [ ... ],
    "accounts": [ ... ]
  },
  "tools": [
    {
      "name": "deposit",
      "title": "Deposit SOL to Vault",
      "description": "Deposits native SOL into the caller's segregated vault PDA.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "amount": { "type": "string", "pattern": "^[1-9][0-9]*$" }
        },
        "required": ["amount"],
        "additionalProperties": false
      },
      "solana": {
        "kind": "instruction",
        "instruction": "deposit",
        "accounts": {
          "owner": { "source": "signer" },
          "vault": { "source": "idl" },
          "systemProgram": { "source": "program", "address": "11111111111111111111111111111111" }
        },
        "effects": {
          "stateChanging": true,
          "financial": true,
          "summary": "Transfers native SOL from signer to vault PDA"
        }
      }
    }
  ]
}`,
        },
      ],
    },
  },
  {
    id: "on-chain-wire-format",
    category: "Specification",
    title: "On-Chain Wire Format",
    badge: "Binary Layout",
    summary:
      "Normative breakdown of the 81-byte Anchor binary header, memory offsets, status transitions, and payload buffer.",
    content: {
      overview:
        "The Web3MCP Config PDA uses a fixed 81-byte Anchor binary header followed by a 4-byte length prefix and the raw UTF-8 JSON tool manifest buffer. Below is the normative memory layout, byte offsets, data types, and status state machine.",
      subsections: [
        {
          id: "binary-layout-table",
          title: "81-Byte Anchor Binary Layout",
          description:
            "Exact memory offsets, byte widths, data types, and invariants for the on-chain Config PDA:",
          table: {
            headers: ["Offset", "Size", "Field Name", "Rust Type", "Description & Invariants"],
            rows: [
              ["0 .. 8", "8 bytes", "discriminator", "[u8; 8]", "Anchor account discriminator: sha256('account:Web3McpConfig')[..8]"],
              ["8 .. 40", "32 bytes", "authority", "Pubkey", "Authorized updater / publisher public key with mutation and upload rights"],
              ["40 .. 41", "1 byte", "status", "u8", "Upload state machine: 0 = Uninitialized, 1 = Uploading, 2 = Published"],
              ["41 .. 73", "32 bytes", "digest", "[u8; 32]", "Expected SHA-256 hash of the complete uncompressed UTF-8 payload"],
              ["73 .. 77", "4 bytes", "expected_len", "u32", "Expected total payload length in bytes (little-endian, capped at 65,536)"],
              ["77 .. 81", "4 bytes", "payload_len", "u32", "Current uploaded payload byte length prefix (little-endian)"],
              ["81+", "Dynamic", "config payload", "Vec<u8>", "Raw UTF-8 JSON payload buffer containing tool definitions and IDL"],
            ],
          },
        },
        {
          id: "header-validation",
          title: "Status Transitions & Host Invariants",
          description:
            "During discovery, hosts read the 81-byte header before parsing the payload. If the status byte is not 2 (Published), hosts fail closed immediately. During updates, the publisher re-initializes status to 1, causing hosts to fail closed until the full configuration has been uploaded and finalized:",
          table: {
            headers: ["Status Value", "Name", "Host Behavior"],
            rows: [
              ["0", "Uninitialized", "Account allocated but no config uploaded. Rejected."],
              ["1", "Uploading", "Chunked upload in progress. Hosts fail closed immediately."],
              ["2", "Published", "Upload finalized and verified via SHA-256. Consumable by hosts."],
            ],
          },
        },
      ],
    },
  },
  {
    id: "playground",
    category: "Reference",
    title: "Devnet Tool Explorer",
    badge: "Live Devnet",
    summary:
      "Live interactive inspection of the Reference Vault deployed on Solana Devnet.",
    content: {
      overview:
        "Inspect the live Reference Vault deployed on Solana Devnet at GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv (Config PDA: HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD). View the published on-chain tool descriptors, parameter validation schemas, and execution bindings discovered dynamically over standard RPC.",
      subsections: [
        {
          id: "reference-tools-breakdown",
          title: "Discovered Reference Tools",
          description:
            "The reference program demonstrates four fundamental Solana tool patterns:",
          table: {
            headers: ["Tool Name", "Kind", "Operation", "Effects Claim"],
            rows: [
              ["get_vault", "accountRead", "Point-in-time state query for Vault account", "Zero effects (free, signature-free read)"],
              ["initialize", "instruction", "Allocates rent-exempt segregated vault PDA", "State-changing: creates vault PDA account"],
              ["deposit", "instruction", "Transfers SOL lamports from signer to vault PDA", "Financial: transfers SOL from user to vault"],
              ["withdraw", "instruction", "Transfers SOL lamports from vault back to signer", "Financial: transfers SOL from vault to user"],
            ],
          },
        },
      ],
    },
  },
];
