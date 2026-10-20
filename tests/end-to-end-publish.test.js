import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Connection, PublicKey } from "@solana/web3.js";
import { publishConfig } from "../reference-programs/reference-vault/scripts/publish.js";
import { validateDiscoveredConfig } from "../protocol/src/validator.js";

if (!process.env.ANCHOR_WALLET) {
  process.env.ANCHOR_WALLET = path.resolve(os.homedir(), ".config/solana/id.json");
}

describe("Ticket 04: End-to-End Publisher & On-Chain Protocol Conformance", () => {
  const url = process.env.ANCHOR_PROVIDER_URL || "http://127.0.0.1:8899";
  if (!/^https?:\/\/(127\.0\.0\.1|localhost|0\.0\.0\.0)(:\d+)?\/?$/.test(url)) {
    throw new Error("Integration tests require a local validator RPC URL");
  }
  const connection = new Connection(url, "confirmed");

  it("publishes complete Web3MCP config to on-chain Config PDA in chunks", async () => {
    const result = await publishConfig({ url });

    assert.ok(result.programId, "Target program ID must be present");
    assert.ok(result.configPda, "Config PDA must be present");
    assert.ok(result.initSig, "Init transaction signature must be present");
    assert.ok(result.finalizeSig, "Finalize transaction signature must be present");
    assert.equal(result.conformance.valid, true);
  });

  it("verifies live on-chain Config PDA account via standard Solana RPC getAccountInfo", async () => {
    const idlPath = new URL("../target/idl/reference_vault.json", import.meta.url);
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
    const programId = new PublicKey(idl.address);

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("web3mcp"), Buffer.from("config")],
      programId
    );

    const accountInfo = await connection.getAccountInfo(configPda, "confirmed");
    assert.ok(accountInfo, "Config PDA account must exist on-chain");
    assert.equal(accountInfo.owner.toBase58(), programId.toBase58());

    // Protocol conformance validation
    const conformance = validateDiscoveredConfig({
      programId: programId.toBase58(),
      programAccount: await connection.getAccountInfo(programId, "confirmed"),
      configAddress: configPda.toBase58(),
      configAccount: accountInfo,
    });
    if (!conformance.valid) {
      console.error("Conformance errors:", conformance.errors);
    }
    assert.equal(conformance.valid, true);

    const onChainConfig = conformance.config;
    assert.equal(onChainConfig.standard, "web3mcp");
    assert.equal(onChainConfig.version, "0.2.0");
    assert.equal(onChainConfig.programId, programId.toBase58());

    // Verify all 5 tools discovered purely from on-chain account data
    const toolNames = onChainConfig.tools.map((t) => t.name);
    assert.deepEqual(toolNames.sort(), ["deposit", "get_vault", "get_vault_by_owner", "initialize", "withdraw"].sort());
  });

  it("preserves strict host boundary: host packages do not import reference program source or static IDLs (ADR 0007)", () => {
    // Assert protocol and future host directories have zero imports of reference-programs/reference-vault or target/idl
    const dirsToCheck = ["../protocol/src"];
    const hostDir = new URL("../apps/host/src", import.meta.url);
    if (fs.existsSync(hostDir)) {
      dirsToCheck.push("../apps/host/src");
    }

    for (const dirPath of dirsToCheck) {
      const dirUrl = new URL(dirPath, import.meta.url);
      const files = fs.readdirSync(dirUrl);
      for (const file of files) {
        if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;
        const content = fs.readFileSync(new URL(`${dirPath}/${file}`, import.meta.url), "utf8");
        assert.equal(
          content.includes("reference_vault") || content.includes("reference-vault") || content.includes("target/idl"),
          false,
          `File ${dirPath}/${file} must never import reference program code or static IDLs (ADR 0007)`
        );
      }
    }
  });
});
