"use client";

import React, { useState } from "react";
import { Terminal, Shield, Check, ArrowRight } from "lucide-react";

export default function DevnetPlayground() {
  const [selectedTool, setSelectedTool] = useState<string>("deposit");

  const REFERENCE_TOOLS = [
    {
      id: "initialize",
      name: "initialize",
      kind: "instruction",
      desc: "Initializes a personal segregated vault PDA derived from ['vault', owner] for depositing SOL.",
      program: "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
      pda: "HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD",
      inputs: [],
      accounts: [
        { name: "owner", source: "signer", detail: "Connected wallet (isSigner: true, writable)" },
        { name: "vault", source: "idl", detail: "Derived PDA: ['vault', owner.key()] (writable)" },
        { name: "systemProgram", source: "program", detail: "11111111111111111111111111111111" },
      ],
      effects: "Creates on-chain vault PDA and allocates rent-exempt storage",
      simulatedCUs: "3,820 CUs",
      simulatedFee: "5,000 lamports",
    },
    {
      id: "deposit",
      name: "deposit",
      kind: "instruction",
      desc: "Deposits native SOL into caller's segregated vault PDA derived from ['vault', owner].",
      program: "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
      pda: "HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD",
      inputs: [{ name: "amount", type: "u64", pattern: "^[1-9][0-9]*$", desc: "Lamports to deposit (decimal string, 64-bit)" }],
      accounts: [
        { name: "owner", source: "signer", detail: "Connected wallet (isSigner: true, writable)" },
        { name: "vault", source: "idl", detail: "Derived PDA: ['vault', owner.key()] (writable)" },
        { name: "systemProgram", source: "program", detail: "11111111111111111111111111111111" },
      ],
      effects: "Transfers native SOL from user wallet to on-chain vault PDA",
      simulatedCUs: "4,563 CUs",
      simulatedFee: "5,000 lamports",
    },
    {
      id: "get_vault",
      name: "get_vault",
      kind: "accountRead",
      desc: "Queries and decodes vault account state signature-free via Solana RPC.",
      program: "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
      pda: "HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD",
      inputs: [
        {
          name: "owner",
          type: "publicKey",
          pattern: "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
          desc: "Vault owner address (defaults to connected wallet)",
        },
      ],
      accounts: [{ name: "vault", source: "idl", detail: "Derived PDA: ['vault', owner.key()] (read-only)" }],
      effects: "Signature-free account read (zero fees, decodes { owner, balance, bump })",
      simulatedCUs: "0 CUs (RPC Read)",
      simulatedFee: "0 lamports",
    },
    {
      id: "withdraw",
      name: "withdraw",
      kind: "instruction",
      desc: "Withdraws native SOL from vault PDA back to wallet, maintaining rent exemption.",
      program: "GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
      pda: "HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD",
      inputs: [{ name: "amount", type: "u64", pattern: "^[1-9][0-9]*$", desc: "Lamports to withdraw (decimal string, 64-bit)" }],
      accounts: [
        { name: "owner", source: "signer", detail: "Connected wallet (isSigner: true, writable)" },
        { name: "vault", source: "idl", detail: "Derived PDA: ['vault', owner.key()] (writable)" },
        { name: "systemProgram", source: "program", detail: "11111111111111111111111111111111" },
      ],
      effects: "Transfers native SOL from vault PDA to user wallet",
      simulatedCUs: "5,120 CUs",
      simulatedFee: "5,000 lamports",
    },
  ];

  const currentTool = REFERENCE_TOOLS.find((t) => t.id === selectedTool) || REFERENCE_TOOLS[0];

  return (
    <div className="playground-container">
      {/* Top Terminal Bar */}
      <div className="playground-header">
        <div className="pg-title">
          <span className="prompt-glyph">&gt;_</span>
          <span>Devnet Reference Tool Explorer</span>
        </div>
        <div className="pg-chips">
          {REFERENCE_TOOLS.map((t) => {
            const isSelected = selectedTool === t.id;
            const isTx = t.kind === "instruction";
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTool(t.id)}
                className={`pg-tool-chip ${isSelected ? "is-selected" : ""}`}
              >
                <span>{t.name}</span>
                <span className={`chip-badge ${isTx ? "badge-tx" : "badge-read"}`}>
                  {isTx ? "TX" : "READ"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pg-body">
        {/* On-Chain Program Identity */}
        <div className="program-meta-strip">
          <div className="meta-item">
            <span className="meta-key">Program:</span>
            <code className="meta-val">{currentTool.program}</code>
          </div>
          <div className="meta-item">
            <span className="meta-key">Config PDA:</span>
            <code className="meta-val">{currentTool.pda}</code>
          </div>
        </div>

        {/* Tool Description */}
        <div className="pg-desc-row">
          <p className="pg-desc">{currentTool.desc}</p>
        </div>

        {/* 2-Column Inputs / Accounts Layout */}
        <div className="pg-grid">
          {/* Inputs Column */}
          <div className="pg-col">
            <span className="col-label">Declared Inputs</span>
            <div className="inputs-stack">
              {currentTool.inputs.length === 0 ? (
                <div className="empty-param-card">
                  <span className="empty-txt">No parameters required (empty schema)</span>
                </div>
              ) : (
                currentTool.inputs.map((inp) => (
                  <div key={inp.name} className="input-card">
                    <div className="input-name-row">
                      <span className="inp-name">{inp.name}</span>
                      <span className="inp-type">{inp.type}</span>
                    </div>
                    <div className="inp-desc">{inp.desc}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Accounts Column */}
          <div className="pg-col">
            <span className="col-label">Required Accounts</span>
            <div className="accounts-stack">
              {currentTool.accounts.map((acc) => (
                <div key={acc.name} className="acc-card">
                  <div className="acc-name-row">
                    <span className="acc-name">{acc.name}</span>
                    <span className={`acc-source source-${acc.source}`}>{acc.source}</span>
                  </div>
                  <div className="acc-detail">{acc.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Effects row */}
        <div className="effects-row">
          <span className="effects-key">Effects Claim:</span>
          <span className="effects-val">{currentTool.effects}</span>
        </div>

        {/* Simulation Footer Stats */}
        <div className="pg-sim-footer">
          <div className="sim-stat">
            <span className="stat-label">Execution Type:</span>
            <span className={`stat-val ${currentTool.kind === "instruction" ? "val-cyan" : "val-green"}`}>
              {currentTool.kind}
            </span>
          </div>
          <div className="sim-stat">
            <span className="stat-label">Simulated Cost:</span>
            <span className="stat-val val-green">{currentTool.simulatedCUs}</span>
          </div>
          <div className="sim-stat">
            <span className="stat-label">Network Fee:</span>
            <span className="stat-val">{currentTool.simulatedFee}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .playground-container {
          margin: 24px 0;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 4px;
          overflow: hidden;
        }

        .playground-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #050505;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-wrap: wrap;
          gap: 10px;
        }

        .pg-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 600;
          color: #ffffff;
          letter-spacing: 0.02em;
        }

        .prompt-glyph {
          color: #14f195;
          font-weight: 700;
        }

        .pg-chips {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pg-tool-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 4px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #94a3b8;
          font-family: var(--font-mono);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pg-tool-chip:hover {
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .pg-tool-chip.is-selected {
          background: rgba(0, 194, 255, 0.08);
          border-color: rgba(0, 194, 255, 0.5);
          color: #ffffff;
          font-weight: 600;
        }

        .chip-badge {
          font-family: var(--font-mono);
          font-size: 8.5px;
          font-weight: 700;
          padding: 1px 4px;
          border-radius: 2px;
          letter-spacing: 0.04em;
        }

        .chip-badge.badge-tx {
          background: rgba(153, 69, 255, 0.15);
          border: 1px solid rgba(153, 69, 255, 0.35);
          color: #c084fc;
        }

        .chip-badge.badge-read {
          background: rgba(20, 241, 149, 0.15);
          border: 1px solid rgba(20, 241, 149, 0.35);
          color: #14f195;
        }

        .pg-body {
          padding: 16px;
          background: #000000;
        }

        .program-meta-strip {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10.5px;
        }

        .meta-key {
          color: #64748b;
        }

        .meta-val {
          color: #cbd5e1;
        }

        .pg-desc-row {
          margin-bottom: 14px;
        }

        .pg-desc {
          font-family: var(--font-sans);
          font-size: 13px;
          color: #cbd5e1;
          margin: 0;
          line-height: 1.5;
        }

        .pg-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }

        .col-label {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 8px;
        }

        .inputs-stack,
        .accounts-stack {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-card,
        .acc-card,
        .empty-param-card {
          background: #050505;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 8px 10px;
        }

        .empty-txt {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #64748b;
        }

        .input-name-row,
        .acc-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }

        .inp-name,
        .acc-name {
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 600;
          color: #ffffff;
        }

        .inp-type {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #00c2ff;
          background: rgba(0, 194, 255, 0.08);
          border: 1px solid rgba(0, 194, 255, 0.25);
          padding: 1px 5px;
          border-radius: 2px;
        }

        .inp-desc {
          font-family: var(--font-sans);
          font-size: 11px;
          color: #94a3b8;
          line-height: 1.4;
        }

        .acc-source {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 1px 5px;
          border-radius: 2px;
        }

        .acc-source.source-signer {
          color: #00c2ff;
          background: rgba(0, 194, 255, 0.08);
          border: 1px solid rgba(0, 194, 255, 0.25);
        }

        .acc-source.source-idl {
          color: #c084fc;
          background: rgba(168, 85, 247, 0.08);
          border: 1px solid rgba(168, 85, 247, 0.25);
        }

        .acc-source.source-program {
          color: #14f195;
          background: rgba(20, 241, 149, 0.08);
          border: 1px solid rgba(20, 241, 149, 0.25);
        }

        .acc-detail {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: #94a3b8;
          word-break: break-all;
        }

        .effects-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: #050505;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          margin-bottom: 12px;
          font-family: var(--font-mono);
          font-size: 11px;
        }

        .effects-key {
          color: #64748b;
          flex-shrink: 0;
        }

        .effects-val {
          color: #cbd5e1;
        }

        .pg-sim-footer {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 10px 12px;
          background: #050505;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          flex-wrap: wrap;
        }

        .sim-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
        }

        .stat-label {
          color: #64748b;
        }

        .stat-val {
          color: #ffffff;
          font-weight: 600;
        }

        .val-cyan {
          color: #00c2ff;
        }

        .val-green {
          color: #14f195;
        }

        @media (max-width: 768px) {
          .pg-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

