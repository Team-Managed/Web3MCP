import test, { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = path.resolve(os.homedir(), ".config/solana/id.json");
}

describe("reference-vault: SOL vault operations on devnet", () => {
  const url = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
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
  const user = wallet;
  const BN = anchor.BN || anchor.default?.BN;

  let vaultPda;
  let vaultBump;

  before(async () => {
    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), user.publicKey.toBuffer()],
      program.programId
    );
  });

  it("initializes a personal vault PDA", async () => {
    const existing = await provider.connection.getAccountInfo(vaultPda, "confirmed");
    if (!existing) {
      await program.methods
        .initialize()
        .accounts({
          owner: user.publicKey,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    assert.equal(vaultAccount.owner.toBase58(), user.publicKey.toBase58());
    assert.equal(vaultAccount.bump, vaultBump);
  });

  it("deposits SOL into the vault", async () => {
    const depositAmount = new BN(10_000_000); // 0.01 SOL
    const initialVaultLamports = await provider.connection.getBalance(vaultPda, "confirmed");
    const initialAccount = await program.account.vault.fetch(vaultPda);

    await program.methods
      .deposit(depositAmount)
      .accounts({
        owner: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    assert.equal(
      vaultAccount.balance.toNumber(),
      initialAccount.balance.toNumber() + depositAmount.toNumber()
    );

    const finalVaultLamports = await provider.connection.getBalance(vaultPda, "confirmed");
    assert.equal(finalVaultLamports, initialVaultLamports + depositAmount.toNumber());
  });

  it("withdraws SOL from the vault", async () => {
    const withdrawAmount = new BN(5_000_000); // 0.005 SOL
    const initialVaultLamports = await provider.connection.getBalance(vaultPda, "confirmed");
    const initialAccount = await program.account.vault.fetch(vaultPda);

    await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        owner: user.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const vaultAccount = await program.account.vault.fetch(vaultPda);
    assert.equal(
      vaultAccount.balance.toNumber(),
      initialAccount.balance.toNumber() - withdrawAmount.toNumber()
    );

    const finalVaultLamports = await provider.connection.getBalance(vaultPda, "confirmed");
    assert.equal(finalVaultLamports, initialVaultLamports - withdrawAmount.toNumber());
  });

  it("fails to withdraw beyond available balance or violating rent exemption", async () => {
    const excessiveAmount = new BN(100 * LAMPORTS_PER_SOL);

    await assert.rejects(
      async () => {
        await program.methods
          .withdraw(excessiveAmount)
          .accounts({
            owner: user.publicKey,
            vault: vaultPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      },
      /InsufficientFunds|RentViolation|Error|600/
    );
  });
});
