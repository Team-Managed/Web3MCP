import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Web3McpSdk } from "@web3mcp/sdk";
import { publishConfig } from "../reference-programs/reference-protocol-guard/scripts/publish.js";

if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = path.resolve(os.homedir(), ".config/solana/id.json");
}

describe("reference-protocol-guard: generic host discovery and risk management", () => {
  const url = process.env.ANCHOR_PROVIDER_URL || "http://127.0.0.1:8899";
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(url)) {
    throw new Error("Integration tests require a local validator RPC URL");
  }

  it("discovers, reads state, simulates, and executes risk controls using @web3mcp/sdk", async () => {
    const connection = new Connection(url, "confirmed");
    const authority = anchor.Wallet.local();
    const provider = new anchor.AnchorProvider(connection, authority, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
    anchor.setProvider(provider);

    // 1. Publish Web3MCP Config PDA
    const { programId } = await publishConfig({ url });
    const programPubkey = new PublicKey(programId);

    // 2. Initialize protocol guard state PDA if uninitialized
    const [guardPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("protocol_guard")],
      programPubkey
    );

    const operator = Keypair.generate();
    const airdropOp = await connection.requestAirdrop(operator.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropOp, "confirmed");

    const existing = await connection.getAccountInfo(guardPda, "confirmed");
    if (!existing) {
      const idlPath = new URL("../target/idl/reference_protocol_guard.json", import.meta.url);
      const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
      const program = new anchor.Program(idl, provider);

      await program.methods
        .initialize(
          operator.publicKey,
          new anchor.BN(25),
          new anchor.BN(8500),
          new anchor.BN(1_000_000_000)
        )
        .accounts({
          authority: authority.publicKey,
          guard: guardPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    }

    // 3. Discover using @web3mcp/sdk (WITHOUT importing program source or IDL)
    const host = new Web3McpSdk({ connection });
    await host.discover(programId);

    const toolNames = host.getTools(programId).map((t) => t.name).sort();
    assert.deepEqual(toolNames, [
      "get_protocol_status",
      "resume_protocol",
      "set_operator",
      "trip_circuit_breaker",
      "update_risk_parameters",
    ]);

    // 4. Test accountRead: get_protocol_status
    const statusBefore = await host.executeRead("get_protocol_status", {}, { programId });
    assert.equal(statusBefore.exists, true);
    assert.equal(statusBefore.data.authority, authority.publicKey.toBase58());
    assert.equal(statusBefore.data.is_paused, false);
    assert.equal(statusBefore.data.fee_basis_points, "25");
    assert.equal(statusBefore.data.max_utilization_bps, "8500");

    // 5. Test instruction: update_risk_parameters
    const updatePrepared = await host.prepareInstruction(
      "update_risk_parameters",
      {
        fee_basis_points: "50",
        max_utilization_bps: "8000",
        epoch_volume_limit: "2000000000",
      },
      {
        programId,
        signer: authority.publicKey,
      }
    );
    assert.equal(updatePrepared.simulation.err, null);
    const signedUpdate = await authority.signTransaction(updatePrepared.transaction);
    await host.submitSignedTransaction(updatePrepared, signedUpdate);

    // Verify on-chain update took effect
    const statusUpdated = await host.executeRead("get_protocol_status", {}, { programId });
    assert.equal(statusUpdated.data.fee_basis_points, "50");
    assert.equal(statusUpdated.data.max_utilization_bps, "8000");

    // 6. Test instruction: trip_circuit_breaker using operator key
    const tripPrepared = await host.prepareInstruction(
      "trip_circuit_breaker",
      {},
      {
        programId,
        signer: operator.publicKey,
      }
    );
    assert.equal(tripPrepared.simulation.err, null);
    tripPrepared.transaction.sign(operator);
    await host.submitSignedTransaction(tripPrepared, tripPrepared.transaction);

    // Verify circuit breaker state on-chain
    const statusPaused = await host.executeRead("get_protocol_status", {}, { programId });
    assert.equal(statusPaused.data.is_paused, true);
    assert.equal(statusPaused.data.operational_mode, 2);

    // 7. Test instruction: resume_protocol using authority key
    const resumePrepared = await host.prepareInstruction(
      "resume_protocol",
      {},
      {
        programId,
        signer: authority.publicKey,
      }
    );
    assert.equal(resumePrepared.simulation.err, null);
    const signedResume = await authority.signTransaction(resumePrepared.transaction);
    await host.submitSignedTransaction(resumePrepared, signedResume);

    // Verify resume state on-chain
    const statusResumed = await host.executeRead("get_protocol_status", {}, { programId });
    assert.equal(statusResumed.data.is_paused, false);
    assert.equal(statusResumed.data.operational_mode, 0);

    // 8. Test fail-closed security: unauthorized signer attempting update_risk_parameters
    const unauthorized = Keypair.generate();
    await assert.rejects(async () => {
      const badPrepared = await host.prepareInstruction(
        "update_risk_parameters",
        {
          fee_basis_points: "100",
          max_utilization_bps: "9000",
          epoch_volume_limit: "5000000000",
        },
        {
          programId,
          signer: unauthorized.publicKey,
        }
      );
      if (badPrepared.simulation.err) {
        throw new Error(`Simulation failed as expected: ${JSON.stringify(badPrepared.simulation.err)}`);
      }
    }, /Simulation failed|Constraint/);
  });
});
