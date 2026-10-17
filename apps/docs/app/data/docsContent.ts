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
      "How Solana program developers publish self-sovereign AI tool manifests using chunked uploads and on-chain SHA-256 verification.",
    content: {
      overview:
        "Solana transactions have a 1,232-byte MTU limit. Full Web3MCP configurations with embedded Anchor IDLs frequently range from 4 KiB to 30 KiB. Web3MCP solves this with an authorized 3-phase chunked upload lifecycle with native on-chain SHA-256 verification using the Solana sol_sha256 syscall.",
      subsections: [
        {
          id: "upload-lifecycle",
          title: "1. Three-Phase Upload Lifecycle",
          description:
            "Configurations transition strictly from Uninitialized (0) to Uploading (1) to Published (2):",
          table: {
            headers: ["Phase Instruction", "Signer", "On-Chain Action & Invariants"],
            rows: [
              [
                "initialize_config",
                "Authority",
                "Sets status = 1 (Uploading), records expected_len and SHA-256 digest, truncates existing buffer. Hosts fail closed while in status 1.",
              ],
              [
                "write_config_chunk",
                "Authority",
                "Asserts status == 1 & offset == current_len. Appends chunk slice and reallocates account storage funded by authority.",
              ],
              [
                "finalize_config",
                "Authority",
                "Computes SHA-256 of uploaded buffer via native sol_sha256 syscall. Asserts hash equality with digest and sets status = 2 (Published).",
              ],
            ],
          },
        },
        {
          id: "anchor-implementation",
          title: "2. Anchor Implementation Example",
          description:
            "Smart contract developers implement the publisher instructions using the canonical seeds ['web3mcp', 'config'] and the native SHA-256 verification syscall:",
          code: {
            language: "rust",
            code: `#[derive(Accounts)]
pub struct FinalizeConfig<'info> {
    #[account(
        mut,
        seeds = [b"web3mcp", b"config"],
        bump,
        has_one = authority,
        constraint = config_account.status == 1 @ Web3McpError::InvalidStatus
    )]
    pub config_account: Account<'info, Web3McpConfig>,
    pub authority: Signer<'info>,
}

pub fn finalize_config_handler(ctx: Context<FinalizeConfig>) -> Result<()> {
    let config = &mut ctx.accounts.config_account;
    require!(
        config.config.len() as u32 == config.expected_len,
        Web3McpError::LengthMismatch
    );
    
    // Native Solana SHA-256 syscall verification (sol_sha256)
    let computed_hash = solana_program::hash::hash(&config.config);
    require!(
        computed_hash.to_bytes() == config.digest,
        Web3McpError::DigestMismatch
    );
    
    config.status = 2; // Published: consumable by agents
    Ok(())
}`,
          },
        },
        {
          id: "publisher-tooling",
          title: "3. Automated Publisher Script",
          description:
            "Use the automated publisher script to bundle your compiled Anchor IDL with tool definitions and stream chunks to Devnet or Mainnet:",
          code: {
            language: "bash",
            code: `# Generate valid Web3MCP JSON envelope from target Anchor IDL
node programs/reference-vault/scripts/generate-config.js

# Stream chunked transactions to Solana Devnet and finalize
node programs/reference-vault/scripts/publish.js --rpc https://api.devnet.solana.com`,
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
      "Core domain guidelines, invariants, and operational mental model for AI agents interacting with Solana programs.",
    content: {
      overview:
        "Web3MCP agents discover tools at runtime from program-owned Config PDAs. To successfully understand, inspect, and invoke these tools, the agent runtime grounds LLMs in the fundamental mechanics and safety invariants of the Solana runtime.",
      callouts: [
        {
          type: "info",
          title: "Injected Agent Mental Model",
          text: "Web3MCP injects domain guidelines directly into system prompts across all supported models. This eliminates hallucinated Solana mechanics such as sending decimal numbers to u64 integer fields or attempting state writes without prior balance checks.",
        },
      ],
      subsections: [
        {
          id: "four-prime-directives",
          title: "The Four Prime Directives",
          description:
            "Every Web3MCP agent adheres to four operational prime directives:",
          table: {
            headers: ["Directive", "Rule", "Operational Impact"],
            rows: [
              [
                "1. Read-Before-Write",
                "Always query account state via accountRead tools before proposing writes.",
                "Prevents proposing deposits or withdrawals when balances or registration states are insufficient.",
              ],
              [
                "2. Unit & Decimals Rigor",
                "Solana programs operate exclusively on base integer units (u64).",
                "1 SOL = 1,000,000,000 lamports (10^9); USDC = 10^6. Floating point numbers like 0.05 are never passed directly to instructions.",
              ],
              [
                "3. Fail-Closed on Uncertainty",
                "If account state is ambiguous or simulation fails, never retry blindly.",
                "Immediately informs the user of the exact simulation error or unexpected account state and asks for guidance.",
              ],
              [
                "4. Respect Wallet Rejections",
                "Acknowledge human transaction declines immediately without arguing.",
                "Never re-submits a declined transaction without explicit user instructions.",
              ],
            ],
          },
        },
        {
          id: "solana-mental-model",
          title: "The Solana Mental Model for AI",
          description:
            "Five core architecture principles every AI agent must understand when interacting with Solana programs:",
          table: {
            headers: ["Tenet", "Concept", "AI Agent Implication"],
            rows: [
              ["1. Stateless Logic", "Programs store code only; state lives in accounts", "Instructions must be provided with all required account keys"],
              ["2. Typed Accounts", "Accounts have lamport balance, owner, and data buffer", "Only the owning program can deduct lamports or alter data"],
              ["3. PDAs as Vaults", "Deterministic addresses with no private key", "Derived from seeds; program signs via Cross-Program Invocations (CPI)"],
              ["4. Atomic Transactions", "All instructions succeed, or entire transaction reverts", "Batched instructions never leave accounts in partial states"],
              ["5. Wallet Handoff", "Agent holds zero keys; human signs all mutations", "Reasoning is strictly decoupled from on-chain execution"],
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
      "Interactive breakdown of the 81-byte Anchor prefix, status transitions, and payload buffer.",
    content: {
      overview:
        "The Web3MCP Config PDA uses a fixed 81-byte Anchor binary header. Click any segment below to inspect its offset, byte size, data type, and security invariants.",
      subsections: [
        {
          id: "header-validation",
          title: "Header Validation & Status Transitions",
          description:
            "During discovery, hosts read the 81-byte header before parsing the payload. If the status byte is not 2 (Published), hosts fail closed immediately. During updates, the publisher re-initializes status to 1, causing hosts to fail closed until the full configuration has been uploaded and finalized.",
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
