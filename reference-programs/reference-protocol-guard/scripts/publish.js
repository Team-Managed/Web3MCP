import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, ComputeBudgetProgram } from "@solana/web3.js";
import { generateConfig } from "./generate-config.js";
import { validateDiscoveredConfig } from "../../../protocol/src/validator.js";

const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");

if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = path.resolve(os.homedir(), ".config/solana/id.json");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHUNK_SIZE = 800;
const CHUNK_DELAY_MS = 500;

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

export async function sendPublishedTransaction(method, { connection, wallet }) {
  const transaction = await method.transaction();
  const { blockhash, lastValidBlockHeight } = await retryOn429(() => connection.getLatestBlockhash("confirmed"));
  transaction.feePayer = wallet.publicKey;
  transaction.recentBlockhash = blockhash;
  const signed = await wallet.signTransaction(transaction);
  const signature = anchor.utils.bytes.bs58.encode(signed.signature);
  const raw = signed.serialize();

  try {
    await retryOn429(() => connection.sendRawTransaction(raw, { preflightCommitment: "confirmed" }));
    const result = await retryOn429(() => connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight }, "confirmed"
    ));
    if (result.value.err) throw new Error(JSON.stringify(result.value.err));
  } catch (error) {
    throw new Error(`Transaction ${signature} was not confirmed: ${error.message}`, { cause: error });
  }
  return signature;
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

  console.log("Generating Protocol Guard Web3MCP config manifest...");
  const config = generateConfig({ writeToFile: true });
  const rawJson = JSON.stringify(config);
  const payload = Buffer.from(rawJson, "utf8");
  const digest = crypto.createHash("sha256").update(payload).digest();

  const idlPath = path.resolve(__dirname, "../../../target/idl/reference_protocol_guard.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const program = new anchor.Program(idl, provider);

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

  console.log("Step 1/3: Initializing Config PDA in Uploading state (status = 1)...");
  const initSig = await sendPublishedTransaction(
    program.methods
      .initializeConfig(wallet.publicKey, payload.length, Array.from(digest))
      .accounts({
        authority: wallet.publicKey,
        program: program.programId,
        programData,
        config: configPda,
        systemProgram: SystemProgram.programId,
      }),
    { connection, wallet }
  );
  console.log(`Initialized Config PDA. Tx: ${initSig}`);

  const totalChunks = Math.ceil(payload.length / CHUNK_SIZE);
  console.log(`Step 2/3: Uploading ${totalChunks} chunks (~${CHUNK_SIZE} bytes/chunk)...`);

  for (let i = 0; i < totalChunks; i++) {
    const offset = i * CHUNK_SIZE;
    const chunk = payload.subarray(offset, Math.min(offset + CHUNK_SIZE, payload.length));

    console.log(`Uploading chunk ${i + 1}/${totalChunks} (offset: ${offset}, length: ${chunk.length})...`);
    await sendPublishedTransaction(
      program.methods
        .writeConfigChunk(offset, chunk)
        .accounts({
          authority: wallet.publicKey,
          program: program.programId,
          programData,
          config: configPda,
          systemProgram: SystemProgram.programId,
        }),
      { connection, wallet }
    );

    if (i < totalChunks - 1 && CHUNK_DELAY_MS > 0) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  console.log("Step 3/3: Finalizing config and verifying SHA-256 digest on-chain...");
  const finalizeSig = await sendPublishedTransaction(
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
      ]),
    { connection, wallet }
  );
  console.log(`Finalized Config PDA (status = 2 Published). Tx: ${finalizeSig}`);

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
