import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { generateConfig } from "../reference-programs/reference-protocol-guard/scripts/generate-config.js";
import { validateConfig } from "../protocol/src/validator.js";

describe("Protocol Guard: Web3MCP Config Generator & Validation", () => {
  it("generates a Web3MCP v0.2 config from compiled IDL that passes protocol validation", () => {
    const config = generateConfig({ writeToFile: true });

    assert.equal(config.standard, "web3mcp");
    assert.equal(config.version, "0.2.0");
    assert.equal(config.programId, "BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA");
    assert.ok(config.idl, "IDL must be embedded");
    assert.equal(Array.isArray(config.tools), true);

    const validation = validateConfig(config);
    if (!validation.valid) {
      console.error("Validation errors:", validation.errors);
    }
    assert.equal(validation.valid, true);
    assert.equal(validation.errors, undefined);
  });

  it("contains all 5 reference-protocol-guard tools with valid bindings and effects", () => {
    const config = generateConfig();
    const toolNames = config.tools.map((t) => t.name);

    assert.ok(toolNames.includes("get_protocol_status"), "Must contain get_protocol_status");
    assert.ok(toolNames.includes("trip_circuit_breaker"), "Must contain trip_circuit_breaker");
    assert.ok(toolNames.includes("resume_protocol"), "Must contain resume_protocol");
    assert.ok(toolNames.includes("update_risk_parameters"), "Must contain update_risk_parameters");
    assert.ok(toolNames.includes("set_operator"), "Must contain set_operator");

    const getStatus = config.tools.find((t) => t.name === "get_protocol_status");
    assert.equal(getStatus.solana.kind, "accountRead");
    assert.equal(getStatus.solana.account, "ProtocolGuard");
    assert.equal(getStatus.effects, undefined, "accountRead must not declare effects");
    assert.equal(getStatus.solana.accounts.guard.source, "pda");
    assert.deepEqual(getStatus.solana.accounts.guard.seeds, [
      { kind: "const", value: [...Buffer.from("protocol_guard")] },
    ]);

    const trip = config.tools.find((t) => t.name === "trip_circuit_breaker");
    assert.equal(trip.solana.kind, "instruction");
    assert.equal(trip.solana.instruction, "trip_circuit_breaker");
    assert.equal(trip.solana.effects.stateChanging, true);
    assert.equal(trip.solana.effects.financial, false);

    const resume = config.tools.find((t) => t.name === "resume_protocol");
    assert.equal(resume.solana.kind, "instruction");
    assert.equal(resume.solana.instruction, "resume_protocol");
    assert.equal(resume.solana.effects.stateChanging, true);
    assert.equal(resume.solana.effects.financial, false);

    const updateParams = config.tools.find((t) => t.name === "update_risk_parameters");
    assert.equal(updateParams.solana.kind, "instruction");
    assert.equal(updateParams.solana.instruction, "update_risk_parameters");
    assert.equal(updateParams.solana.effects.stateChanging, true);
    assert.equal(updateParams.solana.effects.financial, false);
    assert.deepEqual(updateParams.inputSchema.required, [
      "fee_basis_points",
      "max_utilization_bps",
      "epoch_volume_limit",
    ]);

    const setOp = config.tools.find((t) => t.name === "set_operator");
    assert.equal(setOp.solana.kind, "instruction");
    assert.equal(setOp.solana.instruction, "set_operator");
    assert.equal(setOp.solana.effects.stateChanging, true);
    assert.equal(setOp.solana.effects.financial, false);
    assert.deepEqual(setOp.inputSchema.required, ["new_operator"]);
  });

  it("writes valid target/web3mcp-protocol-guard.json file", () => {
    const outputPath = new URL("../target/web3mcp-protocol-guard.json", import.meta.url);
    const config = generateConfig({ writeToFile: true });

    assert.ok(fs.existsSync(outputPath), "target/web3mcp-protocol-guard.json must exist");
    const raw = fs.readFileSync(outputPath, "utf8");
    const parsed = JSON.parse(raw);
    assert.equal(parsed.standard, "web3mcp");
    assert.deepEqual(parsed, config);
  });
});
