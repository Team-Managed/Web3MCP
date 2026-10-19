import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateConfig } from "../../../protocol/src/validator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateConfig(options = {}) {
  const idlPath = path.resolve(__dirname, "../../../target/idl/reference_protocol_guard.json");
  if (!options.idl && !fs.existsSync(idlPath)) {
    throw new Error(`Compiled IDL not found at ${idlPath}. Run anchor build first.`);
  }

  const rawIdl = options.idl || JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const programId = rawIdl.address;

  const tools = [
    {
      name: "get_protocol_status",
      title: "Get Protocol Status & Risk Parameters",
      description: "Reads the global protocol guard state, including operational mode (0=Normal, 1=Caution, 2=Emergency Paused), circuit breaker status, fee basis points, utilization cap, volume usage, and authority keys.",
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      solana: {
        kind: "accountRead",
        account: "ProtocolGuard",
        accounts: {
          guard: {
            source: "pda",
            seeds: [
              { kind: "const", value: [...Buffer.from("protocol_guard")] },
            ],
          },
        },
      },
    },
    {
      name: "trip_circuit_breaker",
      title: "Trip Emergency Circuit Breaker",
      description: "Instantly freezes protocol operations and sets operational mode to Emergency Paused. Can be executed by the delegated operator or admin authority.",
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
        instruction: "trip_circuit_breaker",
        accounts: {
          signer: {
            source: "signer",
          },
          guard: {
            source: "idl",
          },
        },
        effects: {
          stateChanging: true,
          financial: false,
          summary: "Trips emergency circuit breaker to halt protocol operations",
        },
      },
    },
    {
      name: "resume_protocol",
      title: "Resume Protocol Operations",
      description: "Resumes normal protocol operations after an emergency pause. Requires master admin authority signature.",
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
        instruction: "resume_protocol",
        accounts: {
          authority: {
            source: "signer",
          },
          guard: {
            source: "idl",
          },
        },
        effects: {
          stateChanging: true,
          financial: false,
          summary: "Resumes normal protocol operations from emergency pause",
        },
      },
    },
    {
      name: "update_risk_parameters",
      title: "Update Protocol Risk Parameters",
      description: "Updates fee basis points, utilization cap, and epoch volume ceilings. Requires master admin authority signature.",
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      inputSchema: {
        type: "object",
        properties: {
          fee_basis_points: {
            type: "string",
            pattern: "^[1-9][0-9]*$",
            description: "Protocol fee in basis points (e.g. 50 = 0.50%, max 10000)",
          },
          max_utilization_bps: {
            type: "string",
            pattern: "^[1-9][0-9]*$",
            description: "Max utilization threshold in basis points (e.g. 8500 = 85.00%, max 10000)",
          },
          epoch_volume_limit: {
            type: "string",
            pattern: "^[1-9][0-9]*$",
            description: "Epoch volume limit in lamports (u64 decimal string)",
          },
        },
        required: ["fee_basis_points", "max_utilization_bps", "epoch_volume_limit"],
        additionalProperties: false,
      },
      solana: {
        kind: "instruction",
        instruction: "update_risk_parameters",
        accounts: {
          authority: {
            source: "signer",
          },
          guard: {
            source: "idl",
          },
        },
        effects: {
          stateChanging: true,
          financial: false,
          summary: "Updates protocol fee and volume risk parameters",
        },
      },
    },
    {
      name: "set_operator",
      title: "Set Delegated Risk Operator",
      description: "Sets the authorized operator key allowed to trip the emergency circuit breaker. Requires master admin authority signature.",
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      inputSchema: {
        type: "object",
        properties: {
          new_operator: {
            type: "string",
            pattern: "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
            description: "Base58 public key of the new delegated risk operator",
          },
        },
        required: ["new_operator"],
        additionalProperties: false,
      },
      solana: {
        kind: "instruction",
        instruction: "set_operator",
        accounts: {
          authority: {
            source: "signer",
          },
          guard: {
            source: "idl",
          },
        },
        effects: {
          stateChanging: true,
          financial: false,
          summary: "Rotates the delegated protocol risk operator key",
        },
      },
    },
  ];

  // Prune IDL to only instructions and accounts needed by published tools
  const publishedIxNames = new Set(
    tools.filter((t) => t.solana.kind === "instruction").map((t) => t.solana.instruction)
  );
  const publishedAccNames = new Set(
    tools.filter((t) => t.solana.kind === "accountRead").map((t) => t.solana.account)
  );

  const idl = {
    address: rawIdl.address,
    metadata: rawIdl.metadata,
    instructions: (rawIdl.instructions || []).filter((ix) => publishedIxNames.has(ix.name)),
    accounts: (rawIdl.accounts || []).filter((acc) => publishedAccNames.has(acc.name)),
    types: rawIdl.types || [],
  };

  const config = {
    standard: "web3mcp",
    version: "0.2.0",
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
    const outFile = path.join(outDir, "web3mcp-protocol-guard.json");
    fs.writeFileSync(outFile, JSON.stringify(config, null, 2), "utf8");
  }

  return config;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = generateConfig({ writeToFile: true });
  console.log(`Generated and validated Web3MCP config for ${config.programId}`);
  console.log(`Tools packaged: ${config.tools.map((t) => t.name).join(", ")}`);
}
