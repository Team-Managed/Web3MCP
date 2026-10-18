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
    category: "Protocol",
    title: "What is Web3MCP?",
    badge: "Start here",
    summary: "Solana programs publish agent-facing tools in a program-owned config PDA.",
    content: {
      overview: "Web3MCP is a protocol for discovering and using Solana program tools. Given a program ID, a compatible agent host reads its config PDA through Solana RPC. The config describes tool inputs, accounts, and instructions; the program executes the instructions. No project-specific MCP server or website is required.",
      tables: [{
        headers: ["Part", "Role"],
        rows: [
          ["Solana program", "Owns the config PDA and implements the advertised instructions."],
          ["Config PDA", "Publishes the manifest, embedded Anchor IDL, and tool bindings."],
          ["Compatible agent host", "Validates config and inputs, then performs RPC reads or prepares writes."],
          ["Wallet", "Signs a reviewed transaction after the user approves it."],
        ],
      }],
      subsections: [
        { id: "protocol-flow", title: "One program ID, on-demand tools", description: "Derive the canonical config PDA, verify program and account ownership, validate the published manifest, then load its tools. A host can repeat this for another compatible program without a new integration." },
        { id: "protocol-boundary", title: "Execution boundary", description: "Account reads use RPC and need no signature. Writes are constructed and simulated by the host; the model cannot sign. Published descriptions and effect summaries remain untrusted claims." },
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
      overview: "protocol/SPEC.md and protocol/schema/config.schema.json define the wire format. Validators accept v0.1.x and v0.2.x manifests. The v0.1 profile remains a candidate; v0.2 extends account reads without changing the binary account layout.",
      tables: [{
        headers: ["Rule", "Requirement"],
        rows: [
          ["Program identity", "The requested program is executable and owns its canonical config PDA."],
          ["Envelope", "standard is web3mcp; version is 0.1.x or 0.2.x; programId and IDL address match."],
          ["Inputs", "Only supported decimal-string u64, boolean, and base58 public-key values."],
          ["Instruction bindings", "Every advertised IDL account resolves through a supported source."],
          ["Account reads", "Verify owner and discriminator; v0.2 may derive the read PDA from declared seeds."],
          ["Writes", "Validate, simulate, request approval, verify the signed message, and confirm."],
        ],
      }],
      subsections: [
        { id: "protocol-scope", title: "Current scope", description: "Discovery begins with a program ID. Name resolution is host-side. Freeform strings, arrays, multi-instruction recipes, arbitrary off-chain resolvers, and autonomous signing are outside this profile." },
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
      overview: "Derive the config PDA with UTF-8 seeds web3mcp and config under the target program ID. Accept only a Published account owned by that program, with the expected discriminator, payload length, and SHA-256 digest.",
      tables: [{
        headers: ["Offset", "Field", "Size", "Meaning"],
        rows: [
          ["0", "discriminator", "8 bytes", "SHA-256(account:Web3McpConfig), first 8 bytes."],
          ["8", "authority", "32 bytes", "Authorized config updater."],
          ["40", "status", "1 byte", "0 Uninitialized, 1 Uploading, 2 Published."],
          ["41", "expected_len", "4 bytes", "Declared payload length, little endian."],
          ["45", "digest", "32 bytes", "SHA-256 of the JSON payload."],
          ["77", "Vec length", "4 bytes", "Actual payload length, little endian."],
          ["81", "config", "N bytes", "UTF-8 JSON; maximum 65,536 bytes."],
        ],
      }],
      subsections: [
        { id: "manifest-fields", title: "Manifest fields", description: "The JSON envelope contains standard, version, programId, an embedded Anchor IDL, and tools. Each tool declares an inputSchema and a Solana binding of kind instruction or accountRead." },
        { id: "wire-publication", title: "Publication lifecycle", description: "The program creates the account, uploads bounded chunks, and marks it Published only after length and digest checks pass. Hosts reject incomplete uploads." },
      ],
    },
  },
  {
    id: "publisher-guide",
    category: "Implementation",
    title: "Publish tools from a program",
    badge: "Program developers",
    summary: "Publish a validated manifest and IDL from the program's canonical PDA.",
    content: {
      overview: "A new or upgradeable Solana program can add instructions to create and update its Web3MCP config PDA. The program controls who may publish. Tool definitions are data; each advertised write still calls a real program instruction.",
      subsections: [
        { id: "publisher-manifest", title: "Describe each tool", description: "Match tool arguments to the embedded IDL. Bind every required instruction account to a signer, required public-key input, fixed program, or supported IDL PDA. For reads, name the account type and its address source." },
        { id: "publisher-validate", title: "Validate before publishing", description: "Validate the JSON against protocol/schema/config.schema.json and the protocol validator. Publish the exact payload whose length and SHA-256 digest appear in the account header." },
        { id: "publisher-reference", title: "Reference implementation", description: "reference-programs/reference-vault shows the Anchor publication instructions, config generator, and chunked publisher. It is an example, not a host dependency." },
      ],
      codeBlocks: [
        { title: "Validate a protocol fixture from the repository root", language: "bash", code: "npm ci\nnode protocol/bin/validate.js protocol/fixtures/valid/reference-instruction.json" },
      ],
      callouts: [
        { type: "warning", title: "Publisher authority", text: "Publishing to an existing deployment requires its authorized updater. Deploy your own program if you do not control that authority." },
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
      subsections: [
        { id: "host-discovery", title: "Discover and validate", description: "Verify the executable program, canonical PDA, owner, published status, digest, manifest version, embedded IDL, input schemas, and account bindings before exposing tools." },
        { id: "host-reads", title: "Read accounts", description: "Resolve the declared address, fetch it through RPC, verify account owner and discriminator, and decode it with the embedded IDL. Reads require no wallet signature." },
        { id: "host-writes", title: "Prepare and approve writes", description: "Validate arguments and accounts, construct one instruction, simulate the transaction, and show the exact message and available effects to the user. Sign only after explicit approval; reject a changed signed message." },
      ],
      callouts: [
        { type: "security", title: "Treat metadata as untrusted", text: "Program ownership identifies the publisher, but does not prove the tool is safe. Do not use tool descriptions or claimed effects as authorization." },
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
            `const programId = "${PROGRAM_ID}";`,
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
        { id: "sdk-write-flow", title: "Prepare a write", description: "Call prepareInstruction with a published tool, arguments, program ID, and signer public key. Review the simulation and message hash, get wallet approval, sign prepared.transaction, then call submitSignedTransaction. Prepare again if the message or blockhash changes." },
        { id: "sdk-scope", title: "Package boundary", description: "The npm SDK includes the protocol validator and schema. Publishers and other language implementations can use protocol/SPEC.md and its schema directly. The example Host CLI is not required." },
      ],
    },
  },
  {
    id: "playground",
    category: "Reference",
    title: "Devnet reference program",
    badge: "Protocol example",
    summary: "A vault program demonstrates two reads and three wallet-approved instructions.",
    content: {
      overview: "The Devnet reference program is " + PROGRAM_ID + ". Its config PDA is " + CONFIG_PDA + ". The SDK example above fetches the current tool list from chain; this table describes the expected reference tools.",
      subsections: [{
        id: "reference-tools-breakdown",
        title: "Published tools",
        description: "The v0.2 read binding derives a vault PDA from an owner public key.",
        table: {
          headers: ["Tool", "Kind", "Purpose"],
          rows: [
            ["get_vault(vaultAddress)", "accountRead", "Read an exact vault PDA."],
            ["get_vault_by_owner(ownerAddress)", "accountRead", "Derive and read an owner's vault PDA."],
            ["initialize", "instruction", "Create a vault PDA."],
            ["deposit(amount)", "instruction", "Transfer lamports into the vault."],
            ["withdraw(amount)", "instruction", "Transfer lamports from the vault."],
          ],
        },
      }],
    },
  },
];
