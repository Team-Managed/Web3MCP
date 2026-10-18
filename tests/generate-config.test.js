import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { generateConfig } from "../reference-programs/reference-vault/scripts/generate-config.js";
import { validateConfig } from "../protocol/src/validator.js";

const fixtureIdl = {
  address: "11111111111111111111111111111111",
  metadata: { name: "reference_vault", version: "0.1.0", spec: "0.1.0" },
  instructions: ["initialize", "deposit", "withdraw"].map((name) => ({
    name,
    discriminator: [1, 2, 3, 4, 5, 6, 7, 8],
    accounts: [
      { name: "owner", signer: true, writable: true },
      { name: "vault", writable: true, pda: { seeds: [
        { kind: "const", value: [118, 97, 117, 108, 116] },
        { kind: "account", path: "owner" },
      ] } },
      { name: "system_program", address: "11111111111111111111111111111111" },
    ],
    args: name === "initialize" ? [] : [{ name: "amount", type: "u64" }],
  })),
  accounts: [{ name: "Vault", discriminator: [8, 7, 6, 5, 4, 3, 2, 1] }],
  types: [{ name: "Vault", type: { kind: "struct", fields: [
    { name: "owner", type: "pubkey" }, { name: "balance", type: "u64" }, { name: "bump", type: "u8" },
  ] } }],
};

describe("Ticket 03: Web3MCP Config Generator & Packaging", () => {
  it("generates a Web3MCP v0.2 config that passes protocol validation", () => {
    const config = generateConfig({ idl: fixtureIdl });

    assert.equal(config.standard, "web3mcp");
    assert.equal(config.version, "0.2.0");
    assert.ok(config.programId, "programId must be defined");
    assert.ok(config.idl, "IDL must be embedded");
    assert.equal(Array.isArray(config.tools), true);

    const validation = validateConfig(config);
    if (!validation.valid) {
      console.error("Validation errors:", validation.errors);
    }
    assert.equal(validation.valid, true);
    assert.equal(validation.errors, undefined);
  });

  it("contains all required reference-vault tools with valid bindings", () => {
    const config = generateConfig({ idl: fixtureIdl });
    const toolNames = config.tools.map((t) => t.name);

    assert.ok(toolNames.includes("get_vault"), "Must contain get_vault");
    assert.ok(toolNames.includes("get_vault_by_owner"), "Must contain get_vault_by_owner");
    assert.ok(toolNames.includes("initialize"), "Must contain initialize");
    assert.ok(toolNames.includes("deposit"), "Must contain deposit");
    assert.ok(toolNames.includes("withdraw"), "Must contain withdraw");

    const getVault = config.tools.find((t) => t.name === "get_vault");
    assert.equal(getVault.solana.kind, "accountRead");
    assert.equal(getVault.solana.account, "Vault");
    assert.equal(getVault.effects, undefined, "accountRead must not declare effects");
    assert.equal(getVault.solana.accounts.vault.input, "vaultAddress");
    const byOwner = config.tools.find((t) => t.name === "get_vault_by_owner");
    assert.equal(byOwner.solana.accounts.vault.source, "pda");
    assert.deepEqual(byOwner.solana.accounts.vault.seeds, [
      { kind: "const", value: [...Buffer.from("vault")] },
      { kind: "input", input: "ownerAddress" },
    ]);

    const deposit = config.tools.find((t) => t.name === "deposit");
    assert.equal(deposit.solana.kind, "instruction");
    assert.equal(deposit.solana.instruction, "deposit");
    assert.equal(deposit.solana.effects.stateChanging, true);
    assert.equal(deposit.solana.effects.financial, true);

    const withdraw = config.tools.find((t) => t.name === "withdraw");
    assert.equal(withdraw.solana.kind, "instruction");
    assert.equal(withdraw.solana.instruction, "withdraw");
    assert.equal(withdraw.solana.effects.stateChanging, true);
    assert.equal(withdraw.solana.effects.financial, true);

    const initialize = config.tools.find((t) => t.name === "initialize");
    assert.equal(initialize.solana.kind, "instruction");
    assert.equal(initialize.solana.instruction, "initialize");
    assert.equal(initialize.solana.effects.stateChanging, true);
    assert.equal(initialize.solana.effects.financial, true);

    for (const tool of config.tools.filter((candidate) => candidate.solana.kind === "instruction")) {
      const instruction = fixtureIdl.instructions.find((candidate) => candidate.name === tool.solana.instruction);
      assert.deepEqual(Object.keys(tool.solana.accounts), instruction.accounts.map((account) => account.name));
    }
  });

  it("writes valid target/web3mcp.json file when executed as CLI script", () => {
    const outputPath = new URL("../target/web3mcp.json", import.meta.url);
    const config = generateConfig({ idl: fixtureIdl, writeToFile: true });

    assert.ok(fs.existsSync(outputPath), "target/web3mcp.json must exist");
    const raw = fs.readFileSync(outputPath, "utf8");
    const parsed = JSON.parse(raw);
    assert.equal(parsed.standard, "web3mcp");
    assert.deepEqual(parsed, config);
  });
});
