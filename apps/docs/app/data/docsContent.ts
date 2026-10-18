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

const PROGRAM_ID = "9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD";
const CONFIG_PDA = "J8Ph37LoQsv4yED6USdupCooCZzsVMqJkgBTm9uSkvCw";

export const DOCS_SECTIONS: DocSection[] = [
  {
    id: "overview",
    category: "Get Started",
    title: "How Web3MCP works",
    badge: "Protocol overview",
    summary: "A Solana program publishes tool definitions in its own config PDA.",
    content: {
      overview: "A compatible host starts with a program ID, reads the program-owned config PDA through Solana RPC, validates it, and presents its declared tools to a model. Reads use RPC. For a write, the host prepares and simulates a transaction, then asks a person to sign the exact message with a wallet. A target-program website, custom API, and MCP server are not required.",
      callouts: [
        { type: "security", title: "The trust boundary", text: "Published descriptions and effect summaries are claims, not guarantees. The host checks program ownership, config structure, tool arguments, account bindings, and simulation. The model never receives a private key or signs." },
        { type: "info", title: "Current status", text: "The v0.1 protocol profile remains a candidate under review. The current Devnet reference config uses its v0.2 account-read PDA extension. npm publication and a second-program interoperability demo remain pending." },
      ],
      tables: [{
        headers: ["Part", "Responsibility"],
        rows: [
          ["Target program", "Owns the config PDA and implements the advertised Solana instructions."],
          ["Config PDA", "Stores a published JSON manifest, embedded Anchor IDL, and tool bindings."],
          ["SDK", "Discovers, validates, reads accounts, prepares instructions, and checks signed submission."],
          ["Compatible Host CLI", "Connects a model, displays results, and requests explicit signing approval."],
          ["Wallet", "Signs only the transaction the person reviewed."],
        ],
      }],
      subsections: [
        { id: "discovery-flow", title: "Discovery", description: "The host derives the canonical PDA from the program ID, verifies the program is executable and owns the published account, checks the payload digest, then validates the manifest and embedded IDL. Program ID discovery is the protocol entry point." },
        { id: "name-resolution", title: "Name resolution", description: "The Host CLI may resolve a .sns name on Mainnet before ordinary program-ID discovery. Name resolution is a host convenience, not part of the on-chain protocol. The current SNS SDK does not resolve .sol names." },
      ],
    },
  },
  {
    id: "typescript-sdk",
    category: "Get Started",
    title: "Use the Node.js SDK",
    badge: "SDK guide",
    summary: "Discover tools, read accounts, and prepare wallet-reviewed instructions with @web3mcp/sdk.",
    content: {
      overview: "@web3mcp/sdk is a Node.js workspace package in this repository. It has not been published to npm. It talks directly to Solana RPC and does not include an LLM, terminal UI, wallet file reader, or MCP transport.",
      codeBlocks: [
        { title: "Build the SDK from this repository", language: "bash", code: ["npm ci", "npm --prefix packages/sdk run build"].join("\n") },
        {
          title: "Discover the current Devnet reference program",
          language: "typescript",
          code: [
            'import { Connection } from "@solana/web3.js";',
            'import { Web3McpSdk } from "@web3mcp/sdk";',
            "",
            'const programId = "9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD";',
            'const sdk = new Web3McpSdk({ connection: new Connection("https://api.devnet.solana.com") });',
            "await sdk.discover(programId);",
            "const tools = sdk.getTools(programId);",
            "console.log(tools.map(({ name }) => name));",
            "",
            "async function readMyVault(ownerAddress: string) {",
            '  return sdk.executeRead("get_vault_by_owner", { ownerAddress }, { programId });',
            "}",
          ].join("\n"),
        },
      ],
      tables: [{
        headers: ["Method", "Use"],
        rows: [
          ["discover(programId)", "Validate the executable program and its published config PDA."],
          ["getTools(programId)", "Read the validated tool definitions."],
          ["toOpenAiTools(programId)", "Format the discovered tools for OpenAI function calling."],
          ["executeRead(name, args, options)", "Fetch and decode a declared program account."],
          ["resolveToolAccounts(name, args, options)", "Derive accounts for a published instruction without RPC."],
          ["prepareInstruction(name, args, options)", "Validate, construct, and simulate a transaction."],
          ["submitSignedTransaction(prepared, signed)", "Reject altered or invalid signatures, then submit and confirm."],
        ],
      }],
      subsections: [
        { id: "sdk-write-flow", title: "Write flow", description: "Call prepareInstruction with the tool name, arguments, program ID, and signer public key. Show the resulting accounts, claimed effects, simulation, fee estimate, and message hash. After explicit approval, have the wallet sign prepared.transaction and pass the signed transaction to submitSignedTransaction. Prepare again if the blockhash expires or the message changes." },
        { id: "sdk-scope", title: "Scope", description: "The SDK is generic: it consumes the published IDL and tool bindings. It must not import the reference vault source or a local generated IDL. Host applications own model integration, UI, wallet custody, and approval." },
      ],
    },
  },
  {
    id: "cli",
    category: "Guides",
    title: "Run the compatible host",
    badge: "CLI guide",
    summary: "Use one terminal chat application to discover a program and approve transactions.",
    content: {
      overview: "The Web3MCP Compatible Host CLI is the single web3mcp command in apps/host. It imports @web3mcp/sdk, opens in chat, and accepts a program ID in your request. It can also preload a program with --program. The CLI has no separate inspector or agent binary.",
      codeBlocks: [{
        title: "Start the host from this repository",
        language: "bash",
        code: ["npm ci", "npm --prefix packages/sdk run build", "npm --prefix apps/host run build", "npm run host", "# Optional: npm run host -- --program " + PROGRAM_ID].join("\n"),
      }],
      tables: [{
        headers: ["Command", "Behavior"],
        rows: [
          ["/model", "Choose provider, enter or reuse a masked API key, and select a model."],
          ["/wallet", "Select a detected local keypair or enter a path."],
          ["/rpc", "Change the Solana RPC endpoint; Devnet is the default."],
          ["/tools", "List tools discovered in this session."],
          ["/balance", "Read the selected wallet's SOL balance."],
          ["/clear", "Clear visible chat while keeping model conversation context."],
          ["/help", "Show commands and keyboard shortcuts."],
          ["/exit", "Leave the terminal session."],
        ],
      }],
      subsections: [
        { id: "cli-discovery", title: "Ask the host", description: "For example, ask: Read my vault using program ID " + PROGRAM_ID + ". The host validates the on-chain config before it offers the program's tools to the model. The current reference config advertises five tools." },
        { id: "cli-signing", title: "Review a write", description: "The host simulates a proposed transaction and displays its program, accounts, arguments, claimed effects, instruction data, logs, fee estimate, and message hash. Press s to sign with the selected keypair. Press n or Enter to reject." },
        { id: "cli-settings", title: "Saved settings", description: "The CLI saves provider, model, wallet path, and RPC URL in a local settings file. It stores API keys in the operating system credential store when available. A wallet is optional for reads; writes require one." },
      ],
    },
  },
  {
    id: "publisher-guide",
    category: "Guides",
    title: "Publish tools from a program",
    badge: "Publisher guide",
    summary: "Put a validated manifest and embedded IDL in a program-owned config PDA.",
    content: {
      overview: "A program publisher creates the canonical config PDA with seeds [web3mcp, config], writes the manifest in bounded chunks, and marks it Published after checking the length and SHA-256 digest. The target program owns the account and controls the publication instructions.",
      callouts: [
        { type: "warning", title: "Authority and deployment", text: "The reference publisher requires the program upgrade authority to sign. Running it against an existing deployment needs that authority and Devnet SOL. Use your own deployment and keypair; do not run the publisher against the current reference program unless you control its authority." },
      ],
      subsections: [
        { id: "publisher-layout", title: "Config account", description: "The binary account uses an 81-byte header followed by UTF-8 JSON. The host accepts only status 2 (Published), a payload of at most 65,536 bytes, and a matching SHA-256 digest. It also checks that the account is owned by the requested executable program." },
        { id: "publisher-manifest", title: "Tool manifest", description: "The JSON envelope contains standard, version, programId, idl, and tools. Each tool declares an inputSchema and a Solana binding. Instruction tools map every IDL account and include an effects claim. Account-read tools identify the account type and address binding." },
        { id: "publisher-reference", title: "Reference implementation", description: "The repository's reference-programs/reference-vault contains the Anchor program, config generator, and chunked publisher. Build the program first, generate and validate its config, then publish with the matching upgrade-authority wallet. For a new program, implement publication instructions that follow protocol/SPEC.md and validate the result with protocol/bin/validate.js." },
      ],
      codeBlocks: [
        { title: "Inspect the reference generator", language: "bash", code: ["anchor build", "npm run generate:config", "node protocol/bin/validate.js target/web3mcp.json"].join("\n") },
      ],
    },
  },
  {
    id: "agent-wallet",
    category: "Guides",
    title: "Review and sign a transaction",
    badge: "Wallet boundary",
    summary: "The model proposes a write; the host prepares it; you authorize the exact transaction.",
    content: {
      overview: "The LLM chooses a discovered tool and arguments. The host validates both, resolves accounts, encodes the instruction, and simulates the transaction. The Host CLI then pauses for a person to review it. The selected local keypair signs only after the person presses s.",
      callouts: [
        { type: "security", title: "Do not trust a description as proof", text: "The on-chain publisher can describe an effect, but that text cannot prove a balance change. Review the actual program, accounts, instruction data, simulation logs, fee estimate, and message hash. If a field is unavailable, the CLI says so." },
      ],
      subsections: [
        { id: "review-details", title: "What the CLI shows", description: "The review card includes signing wallet, tool, target program, arguments, claimed effects, resolved accounts, instruction bytes, simulation status, validator logs, estimated fee when available, and SHA-256 of the transaction message." },
        { id: "approval-keys", title: "Approval keys", description: "Press s to sign and submit the reviewed transaction with the selected keypair. Press n or Enter to reject. The SDK checks the signed message and signatures before submission." },
      ],
    },
  },
  {
    id: "agent-knowledge",
    category: "Guides",
    title: "How the agent uses Solana context",
    badge: "Host behavior",
    summary: "The host combines generic Solana guidance with discovered program tools.",
    content: {
      overview: "The host gives its model generic Solana context and host discovery tools. Once it validates a program's on-chain config, it adds only that program's declared tools to the next model turn. The host remains responsible for validation and wallet review even when the model proposes plausible arguments.",
      subsections: [
        { id: "knowledge-discovery", title: "Discover first", description: "A user can provide a program ID in chat. The host discovers and validates the program-owned config PDA, then the model can call its published tools. The model can also request generic account resolution for an IDL-defined PDA." },
        { id: "knowledge-reads", title: "Read without signing", description: "Account-read tools use RPC, verify owner and discriminator, and decode fields from the embedded IDL. The v0.2 get_vault_by_owner tool derives a vault PDA from a wallet public key and reports exists: false when the vault is absent." },
        { id: "knowledge-writes", title: "Prepare before signing", description: "For instruction tools, the host validates scalar inputs and account bindings, simulates the exact transaction, then asks the person to approve signing. Model output alone never authorizes a transaction." },
      ],
    },
  },
  {
    id: "protocol-spec",
    category: "Specification",
    title: "Protocol profile and versions",
    badge: "Candidate specification",
    summary: "The v0.1 candidate profile defines discovery and instruction bindings; v0.2 adds read PDA derivation.",
    content: {
      overview: "protocol/SPEC.md and protocol/schema/config.schema.json are the source of truth. The v0.1 profile remains a candidate under review. Validators accept v0.1.x and v0.2.x envelopes; v0.2 adds a PDA address source for account-read tools without changing the binary account layout.",
      tables: [{
        headers: ["Rule", "Current profile"],
        rows: [
          ["Program identity", "The requested program is executable and owns the canonical config PDA."],
          ["Envelope", "standard is web3mcp; version is 0.1.x or 0.2.x; programId and embedded IDL address match."],
          ["Inputs", "Decimal-string u64, boolean, and base58 public key. Unknown fields and unsupported types fail closed."],
          ["Instruction accounts", "Each advertised IDL account binds to signer, required input, fixed program, or supported IDL PDA."],
          ["Account reads", "Verify owner and discriminator. v0.2 may derive the read address from constant and public-key input seeds."],
          ["Writes", "One instruction, simulation, explicit wallet approval, signed-message validation, and confirmation."],
        ],
      }],
      subsections: [
        { id: "protocol-candidate", title: "Candidate status", description: "The v0.1 profile remains under review while adversarial conformance coverage grows. The deployed reference vault currently publishes a v0.2 config with five tools." },
        { id: "protocol-scope", title: "Deferred capabilities", description: "The on-chain protocol starts from a program ID. SNS resolution is host-side. Freeform strings, arrays, multi-instruction recipes, arbitrary off-chain account resolvers, and autonomous signing are outside the current profile." },
      ],
    },
  },
  {
    id: "on-chain-wire-format",
    category: "Specification",
    title: "Config PDA wire format",
    badge: "Binary layout",
    summary: "An 81-byte Anchor-compatible header precedes the JSON manifest.",
    content: {
      overview: "The canonical config PDA uses UTF-8 seeds web3mcp and config under the target program ID. Its owner must be that program. The 81-byte header includes the 4-byte vector length; JSON payload bytes follow it. A host rejects incomplete uploads, wrong discriminators, oversized payloads, and digest mismatches.",
      tables: [{
        headers: ["Offset", "Field", "Size", "Meaning"],
        rows: [
          ["0", "discriminator", "8 bytes", "First 8 bytes of SHA-256(account:Web3McpConfig)."],
          ["8", "authority", "32 bytes", "Authorized config updater public key."],
          ["40", "status", "1 byte", "0 Uninitialized, 1 Uploading, 2 Published."],
          ["41", "expected_len", "4 bytes", "Expected payload length, little endian."],
          ["45", "digest", "32 bytes", "SHA-256 of the complete JSON payload."],
          ["77", "Vec length", "4 bytes", "Actual payload length, little endian."],
          ["81", "config", "N bytes", "UTF-8 JSON, at most 65,536 bytes."],
        ],
      }],
      subsections: [
        { id: "wire-publication", title: "Publication lifecycle", description: "The publisher initializes the account, uploads bounded chunks, and finalizes only when the complete payload matches its declared length and digest. Hosts expose tools only from Published accounts." },
      ],
    },
  },
  {
    id: "playground",
    category: "Reference",
    title: "Inspect the Devnet reference vault",
    badge: "Reference deployment",
    summary: "Current reference program and five published tools on Solana Devnet.",
    content: {
      overview: "The current reference vault is deployed at " + PROGRAM_ID + " with config PDA " + CONFIG_PDA + ". The table below is a static guide to the published tool set; use the Host CLI or SDK for a fresh on-chain discovery.",
      subsections: [{
        id: "reference-tools-breakdown",
        title: "Five reference tools",
        description: "Two reads and three wallet-approved instructions demonstrate v0.2 read PDA derivation and signed transactions.",
        table: {
          headers: ["Tool", "Kind", "Purpose"],
          rows: [
            ["get_vault(vaultAddress)", "accountRead", "Read a vault when you know its exact PDA."],
            ["get_vault_by_owner(ownerAddress)", "accountRead", "Derive and read the vault from its owner's wallet address."],
            ["initialize", "instruction", "Create a personal rent-funded vault PDA."],
            ["deposit(amount)", "instruction", "Transfer lamports from the signer into the vault."],
            ["withdraw(amount)", "instruction", "Transfer lamports from the vault to the signer."],
          ],
        },
      }],
    },
  },
];
