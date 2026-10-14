import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, ComputeBudgetProgram, BPF_LOADER_UPGRADEABLE_PROGRAM_ID } from "@solana/web3.js";
import { generateConfig } from "./generate-config.js";
import { validateDiscoveredConfig } from "../../../protocol/src/validator.js";

if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = path.resolve(os.homedir(), ".config/solana/id.json");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHUNK_SIZE = 800; // MTU-safe chunk size for Solana transactions
const CHUNK_DELAY_MS = 500; // Pacing delay to avoid public devnet 429 rate-limiting

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryOn429(fn, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err.message && err.message.includes("429") && attempt < maxRetries) {
        const delay = attempt * 1000;
        console.warn(`RPC 429 rate limit hit. Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
}

export async function publishConfig(options = {}) {
  const url = options.url || process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new Connection(url, "confirmed");
  const wallet = options.wallet || anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  anchor.setProvider(provider);

  // 1. Generate and validate config manifest
  console.log("Generating Web3MCP config manifest...");
  const config = generateConfig({ writeToFile: true });
  const rawJson = JSON.stringify(config);
  const payload = Buffer.from(rawJson, "utf8");
  const digest = crypto.createHash("sha256").update(payload).digest();

  // 2. Load program IDL
  const idlPath = path.resolve(__dirname, "../../../target/idl/reference_vault.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const program = new anchor.Program(idl, provider);

  // 3. Derive Config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("web3mcp"), Buffer.from("config")],
    program.programId
  );
  const [programData] = PublicKey.findProgramAddressSync(
    [program.programId.toBuffer()],
    BPF_LOADER_UPGRADEABLE_PROGRAM_ID
  );
  console.log(`Target Program ID: ${program.programId.toBase58()}`);
  console.log(`Canonical Config PDA: ${configPda.toBase58()}`);
  console.log(`Payload size: ${payload.length} bytes (Digest: ${digest.toString("hex").slice(0, 16)}...)`);

  // 4. Initialize Config PDA
  console.log("Step 1/3: Initializing Config PDA in Uploading state (status = 1)...");
  const initSig = await retryOn429(() =>
    program.methods
      .initializeConfig(wallet.publicKey, payload.length, Array.from(digest))
      .accounts({
        authority: wallet.publicKey,
        program: program.programId,
        programData,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc()
  );
  console.log(`Initialized Config PDA. Tx: ${initSig}`);

  // 5. Stream chunks
  const totalChunks = Math.ceil(payload.length / CHUNK_SIZE);
  console.log(`Step 2/3: Uploading ${totalChunks} chunks (~${CHUNK_SIZE} bytes/chunk)...`);

  for (let i = 0; i < totalChunks; i++) {
    const offset = i * CHUNK_SIZE;
    const chunk = payload.subarray(offset, Math.min(offset + CHUNK_SIZE, payload.length));

    console.log(`Uploading chunk ${i + 1}/${totalChunks} (offset: ${offset}, length: ${chunk.length})...`);
    await retryOn429(() =>
      program.methods
        .writeConfigChunk(offset, chunk)
        .accounts({
          authority: wallet.publicKey,
          program: program.programId,
          programData,
          config: configPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc()
    );

    if (i < totalChunks - 1 && CHUNK_DELAY_MS > 0) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  // 6. Finalize Config PDA
  console.log("Step 3/3: Finalizing config and verifying SHA-256 digest on-chain...");
  const finalizeSig = await retryOn429(() =>
    program.methods
      .finalizeConfig()
      .accounts({
        authority: wallet.publicKey,
        program: program.programId,
        programData,
        config: configPda,
      })
      .preInstructions([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
      ])
      .rpc()
  );
  console.log(`Finalized Config PDA (status = 2 Published). Tx: ${finalizeSig}`);

  // 7. Verify live on-chain account data via Solana RPC & protocol validator
  console.log("Verifying on-chain account conformance with @web3mcp/protocol...");
  const accountInfo = await connection.getAccountInfo(configPda, "confirmed");
  if (!accountInfo) {
    throw new Error(`Failed to fetch published Config PDA account from RPC`);
  }

  const programAccount = await connection.getAccountInfo(program.programId, "confirmed");
  const conformance = validateDiscoveredConfig({
    programId: program.programId.toBase58(),
    programAccount,
    configAddress: configPda.toBase58(),
    configAccount: accountInfo,
  });
  if (!conformance.valid) {
    throw new Error(`Published on-chain config failed protocol validation: ${conformance.errors.join("; ")}`);
  }

  console.log("On-chain Config PDA passed current discovery and payload checks.");
  return {
    programId: program.programId.toBase58(),
    configPda: configPda.toBase58(),
    payloadLen: payload.length,
    digest: digest.toString("hex"),
    initSig,
    finalizeSig,
    conformance,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  publishConfig()
    .then((res) => {
      console.log(`Publication complete for program ${res.programId}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`Publication failed: ${err.message}`);
      process.exit(1);
    });
}
