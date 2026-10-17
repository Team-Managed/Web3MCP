import test, { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Keypair, Transaction } from "@solana/web3.js";

const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");

if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = path.resolve(os.homedir(), ".config/solana/id.json");
}

describe("reference-vault: Web3MCP Config PDA chunked upload lifecycle", () => {
  const url = process.env.ANCHOR_PROVIDER_URL || "http://127.0.0.1:8899";
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(url)) {
    throw new Error("Integration tests require a local validator RPC URL");
  }
  const connection = new Connection(url, "confirmed");
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  anchor.setProvider(provider);

  const idlPath = new URL("../target/idl/reference_vault.json", import.meta.url);
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  const program = new anchor.Program(idl, provider);
  const authority = wallet;

  let configPda;
  let configBump;
  let programData;

  const samplePayload = Buffer.from(
    JSON.stringify({
      standard: "web3mcp",
      version: "0.1.0",
      programId: program.programId.toBase58(),
      idl: { version: "0.1.0", name: "reference_vault", instructions: [] },
      tools: [],
    })
  );
  const expectedLen = samplePayload.length;
  const correctDigest = crypto.createHash("sha256").update(samplePayload).digest();
  const wrongDigest = crypto.createHash("sha256").update("corrupted").digest();

  before(async () => {
    [configPda, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("web3mcp"), Buffer.from("config")],
      program.programId
    );
    [programData] = PublicKey.findProgramAddressSync(
      [program.programId.toBuffer()],
      BPF_LOADER_UPGRADEABLE_PROGRAM_ID
    );
  });

  it("rejects a first publisher that tries to appoint another authority", async () => {
    await assert.rejects(
      program.methods
        .initializeConfig(Keypair.generate().publicKey, expectedLen, Array.from(correctDigest))
        .accounts({
          authority: authority.publicKey,
          program: program.programId,
          programData,
          config: configPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc(),
      /Unauthorized|Constraint|600/
    );
  });

  it("rejects an unrelated funded signer from claiming the Config PDA", async () => {
    const attacker = Keypair.generate();
    await provider.sendAndConfirm(new Transaction().add(SystemProgram.transfer({
      fromPubkey: authority.publicKey,
      toPubkey: attacker.publicKey,
      lamports: 10_000_000,
    })));
    await assert.rejects(
      program.methods
        .initializeConfig(attacker.publicKey, expectedLen, Array.from(correctDigest))
        .accounts({
          authority: attacker.publicKey,
          program: program.programId,
          programData,
          config: configPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([attacker])
        .rpc(),
      /Unauthorized|Constraint|600/
    );
  });

  it("pre-funds the canonical PDA before initialization", async () => {
    assert.equal(await provider.connection.getAccountInfo(configPda, "confirmed"), null);
    const rentExemptLamports = await provider.connection.getMinimumBalanceForRentExemption(0);
    const transfer = new Transaction().add(SystemProgram.transfer({
      fromPubkey: authority.publicKey,
      toPubkey: configPda,
      lamports: rentExemptLamports,
    }));
    await provider.sendAndConfirm(transfer);
    const prefunded = await provider.connection.getAccountInfo(configPda, "confirmed");
    assert.equal(prefunded.owner.toBase58(), SystemProgram.programId.toBase58());
    assert.equal(prefunded.data.length, 0);
  });

  it("initializes config PDA in Uploading status (1)", async () => {
    await program.methods
      .initializeConfig(authority.publicKey, expectedLen, Array.from(correctDigest))
      .accounts({
        authority: authority.publicKey,
        program: program.programId,
        programData,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const configAccount = await program.account.web3McpConfig.fetch(configPda);
    assert.equal(configAccount.authority.toBase58(), authority.publicKey.toBase58());
    assert.equal(configAccount.status, 1); // 1 = Uploading
    assert.equal(configAccount.expectedLen, expectedLen);
    assert.deepEqual(Buffer.from(configAccount.digest), correctDigest);
    assert.equal(configAccount.config.length, 0);
  });

  it("writes chunks into config payload buffer with dynamic reallocation", async () => {
    // Split into 2 chunks
    const mid = Math.floor(samplePayload.length / 2);
    const chunk1 = samplePayload.subarray(0, mid);
    const chunk2 = samplePayload.subarray(mid);

    await program.methods
      .writeConfigChunk(0, chunk1)
      .accounts({
        authority: authority.publicKey,
        program: program.programId,
        programData,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    let account = await program.account.web3McpConfig.fetch(configPda);
    assert.equal(account.config.length, chunk1.length);

    await program.methods
      .writeConfigChunk(mid, chunk2)
      .accounts({
        authority: authority.publicKey,
        program: program.programId,
        programData,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    account = await program.account.web3McpConfig.fetch(configPda);
    assert.equal(account.config.length, expectedLen);
    assert.deepEqual(Buffer.from(account.config), samplePayload);
  });

  it("finalizes config and transitions status to Published (2) when digest matches", async () => {
    await program.methods
      .finalizeConfig()
      .accounts({
        authority: authority.publicKey,
        program: program.programId,
        programData,
        config: configPda,
      })
      .rpc();

    const account = await program.account.web3McpConfig.fetch(configPda);
    assert.equal(account.status, 2); // 2 = Published
  });

  it("verifies raw account binary layout conforms to SPEC §2.2", async () => {
    const info = await provider.connection.getAccountInfo(configPda, "confirmed");
    assert.ok(info, "Config account must exist on-chain");
    assert.equal(info.owner.toBase58(), program.programId.toBase58());

    const data = info.data;
    // Discriminator: sha256("account:Web3McpConfig")[0..8] = 0x991dc793e1358b35
    const expectedDiscriminator = Buffer.from([153, 29, 199, 147, 225, 53, 139, 53]);
    assert.deepEqual(data.subarray(0, 8), expectedDiscriminator);

    // Authority: 32 bytes
    assert.equal(new PublicKey(data.subarray(8, 40)).toBase58(), authority.publicKey.toBase58());

    // Status: offset 40, size 1 byte -> 2
    assert.equal(data.readUInt8(40), 2);

    // Expected len: offset 41, size 4 bytes (u32 LE)
    assert.equal(data.readUInt32LE(41), expectedLen);

    // Digest: offset 45, size 32 bytes
    assert.deepEqual(data.subarray(45, 77), correctDigest);

    // Config payload Vec<u8>: offset 77, length prefix 4 bytes
    assert.equal(data.readUInt32LE(77), expectedLen);
    assert.deepEqual(data.subarray(81, 81 + expectedLen), samplePayload);
  });

  it("fails to finalize if digest does not match (fail-closed integrity)", async () => {
    // Re-initialize with incorrect digest
    await program.methods
      .initializeConfig(authority.publicKey, expectedLen, Array.from(wrongDigest))
      .accounts({
        authority: authority.publicKey,
        program: program.programId,
        programData,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Upload payload
    await program.methods
      .writeConfigChunk(0, samplePayload)
      .accounts({
        authority: authority.publicKey,
        program: program.programId,
        programData,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Finalize should fail due to digest mismatch
    await assert.rejects(
      async () => {
        await program.methods
          .finalizeConfig()
          .accounts({
            authority: authority.publicKey,
            program: program.programId,
            programData,
            config: configPda,
          })
          .rpc();
      },
      /DigestMismatch|InvalidDigest|Error|600/
    );

    // Status remains 1 (Uploading), ensuring hosts fail closed
    const account = await program.account.web3McpConfig.fetch(configPda);
    assert.equal(account.status, 1);
  });
});
