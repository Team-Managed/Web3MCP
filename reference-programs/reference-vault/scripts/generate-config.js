import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateConfig } from "../../../protocol/src/validator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateConfig(options = {}) {
  const idlPath = path.resolve(__dirname, "../../../target/idl/reference_vault.json");
  if (!options.idl && !fs.existsSync(idlPath)) {
    throw new Error(`Compiled IDL not found at ${idlPath}. Run anchor build first.`);
  }

  const idl = options.idl || JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const programId = idl.address;

  const tools = [
    {
      name: "get_vault",
      title: "Fetch Vault State",
      description: "Reads a vault account by its PDA address",
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      inputSchema: {
        type: "object",
        properties: {
          vaultAddress: {
            type: "string",
            pattern: "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
            description: "Base58 address of the vault PDA",
          },
        },
        required: ["vaultAddress"],
        additionalProperties: false,
      },
      solana: {
        kind: "accountRead",
        account: "Vault",
        accounts: {
          vault: {
            source: "input",
            input: "vaultAddress",
          },
        },
      },
    },
    {
      name: "initialize",
      title: "Initialize Personal Vault",
      description: "Initializes a personal vault PDA for depositing SOL",
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      solana: {
        kind: "instruction",
        instruction: "initialize",
        accounts: {
          owner: {
            source: "signer",
          },
          vault: {
            source: "idl",
          },
          system_program: {
            source: "program",
            address: "11111111111111111111111111111111",
          },
        },
        effects: {
          stateChanging: true,
          financial: true,
          summary: "Creates a rent-funded personal vault account",
        },
      },
    },
    {
      name: "deposit",
      title: "Deposit SOL into Vault",
      description: "Transfers SOL from connected wallet into program vault",
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      inputSchema: {
        type: "object",
        properties: {
          amount: {
            type: "string",
            pattern: "^[1-9][0-9]*$",
            description: "Amount in lamports (u64 decimal string)",
          },
        },
        required: ["amount"],
        additionalProperties: false,
      },
      solana: {
        kind: "instruction",
        instruction: "deposit",
        accounts: {
          owner: {
            source: "signer",
          },
          vault: {
            source: "idl",
          },
          system_program: {
            source: "program",
            address: "11111111111111111111111111111111",
          },
        },
        effects: {
          stateChanging: true,
          financial: true,
          summary: "Deposits lamports from user to vault",
        },
      },
    },
    {
      name: "withdraw",
      title: "Withdraw SOL from Vault",
      description: "Withdraws SOL from program vault back to connected wallet",
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      inputSchema: {
        type: "object",
        properties: {
          amount: {
            type: "string",
            pattern: "^[1-9][0-9]*$",
            description: "Amount in lamports (u64 decimal string)",
          },
        },
        required: ["amount"],
        additionalProperties: false,
      },
      solana: {
        kind: "instruction",
        instruction: "withdraw",
        accounts: {
          owner: {
            source: "signer",
          },
          vault: {
            source: "idl",
          },
          system_program: {
            source: "program",
            address: "11111111111111111111111111111111",
          },
        },
        effects: {
          stateChanging: true,
          financial: true,
          summary: "Withdraws lamports from vault to user",
        },
      },
    },
  ];

  const config = {
    standard: "web3mcp",
    version: "0.1.0",
    programId,
    idl,
    tools,
  };

  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(`Generated Web3MCP config is invalid: ${validation.errors.join("; ")}`);
  }

  if (options.writeToFile) {
    const outDir = path.resolve(__dirname, "../../../target");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outFile = path.join(outDir, "web3mcp.json");
    fs.writeFileSync(outFile, JSON.stringify(config, null, 2), "utf8");
  }

  return config;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = generateConfig({ writeToFile: true });
  console.log(`Generated and validated Web3MCP config for ${config.programId}`);
  console.log(`Tools packaged: ${config.tools.map((t) => t.name).join(", ")}`);
}
