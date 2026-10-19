"use client";

import React, { useState } from "react";
import { ExternalLink, Copy, Check, Terminal } from "lucide-react";

interface ProgramInfo {
  id: string;
  name: string;
  badge: string;
  programId: string;
  configPda: string;
  statePda?: string;
  tools: {
    name: string;
    kind: "accountRead" | "instruction";
    operation: string;
    effects: string;
  }[];
}

const PROGRAMS: ProgramInfo[] = [
  {
    id: "vault",
    name: "Reference Vault",
    badge: "Custodial SOL Vault",
    programId: "9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD",
    configPda: "J8Ph37LoQsv4yED6USdupCooCZzsVMqJkgBTm9uSkvCw",
    tools: [
      {
        name: "get_vault",
        kind: "accountRead",
        operation: "Read a Vault account by its exact PDA address",
        effects: "No transaction or signature",
      },
      {
        name: "get_vault_by_owner",
        kind: "accountRead",
        operation: "Derive and read a vault from owner's wallet (v0.2 PDA seed)",
        effects: "No transaction or signature",
      },
      {
        name: "initialize",
        kind: "instruction",
        operation: "Allocates rent-exempt segregated vault PDA",
        effects: "Creates a rent-funded vault account",
      },
      {
        name: "deposit",
        kind: "instruction",
        operation: "Transfers SOL lamports from signer to vault PDA",
        effects: "Transfers SOL from wallet to vault",
      },
      {
        name: "withdraw",
        kind: "instruction",
        operation: "Transfers SOL lamports from vault back to signer",
        effects: "Transfers SOL from vault to wallet",
      },
    ],
  },
  {
    id: "guard",
    name: "Protocol Guard",
    badge: "Non-Custodial Risk Guard",
    programId: "BDwiU9GGqf7zxNNxD3QxyZ4PzKBWr8QMfUeYknbsXzFA",
    configPda: "FnN43zVgGkqKWbs5D83AEs4cTrKfjrmodafTB7J69vB4",
    statePda: "EWXdUTZGa1uQ1g1aLPeJv3J6oKFTSNgvJpueZ1fnN2dB",
    tools: [
      {
        name: "get_protocol_status",
        kind: "accountRead",
        operation: "Read global protocol status, circuit breaker flag, fee bps, and volume limits",
        effects: "No transaction or signature",
      },
      {
        name: "trip_circuit_breaker",
        kind: "instruction",
        operation: "Instantly trip emergency circuit breaker and set mode to Emergency Paused",
        effects: "Halts protocol operations (operator or admin authority)",
      },
      {
        name: "resume_protocol",
        kind: "instruction",
        operation: "Resume normal protocol operations after incident resolution",
        effects: "Resumes protocol operations (admin authority only)",
      },
      {
        name: "update_risk_parameters",
        kind: "instruction",
        operation: "Update fee basis points, max utilization cap, and epoch volume limits",
        effects: "Modifies protocol risk boundaries (admin authority only)",
      },
      {
        name: "set_operator",
        kind: "instruction",
        operation: "Delegate hot operator key for automated circuit breaking",
        effects: "Updates authorized operator public key (admin authority only)",
      },
    ],
  },
];

export default function DevnetPlayground() {
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("vault");

  const currentProg = PROGRAMS.find((p) => p.id === selectedId) || PROGRAMS[0];

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="devnet-ref-wrapper">
      {/* Program Selector Tabs */}
      <div className="program-tabs-row">
        {PROGRAMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`program-tab-btn ${selectedId === p.id ? "active" : ""}`}
          >
            <span className="tab-name">{p.name}</span>
            <span className="tab-badge">{p.badge}</span>
          </button>
        ))}
      </div>

      {/* Target Program & Config PDA Bar */}
      <div className={`ref-header-box ${currentProg.statePda ? "has-three" : ""}`}>
        <div className="ref-item">
          <span className="ref-label">PROGRAM ID</span>
          <div className="ref-val-row">
            <a
              href={`https://explorer.solana.com/address/${currentProg.programId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="ref-link"
              title="View on Solana Explorer"
            >
              <code>{currentProg.programId}</code>
              <ExternalLink size={11} />
            </a>
            <button
              onClick={() => handleCopy("prog", currentProg.programId)}
              className="copy-mini-btn"
              title="Copy Program ID"
            >
              {copied === "prog" ? <Check size={11} className="text-green" /> : <Copy size={11} />}
            </button>
          </div>
        </div>

        <div className="ref-item">
          <span className="ref-label">CONFIG PDA</span>
          <div className="ref-val-row">
            <a
              href={`https://explorer.solana.com/address/${currentProg.configPda}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="ref-link"
              title="View on Solana Explorer"
            >
              <code>{currentProg.configPda}</code>
              <ExternalLink size={11} />
            </a>
            <button
              onClick={() => handleCopy("pda", currentProg.configPda)}
              className="copy-mini-btn"
              title="Copy Config PDA"
            >
              {copied === "pda" ? <Check size={11} className="text-green" /> : <Copy size={11} />}
            </button>
          </div>
        </div>

        {currentProg.statePda && (
          <div className="ref-item">
            <span className="ref-label">STATE PDA</span>
            <div className="ref-val-row">
              <a
                href={`https://explorer.solana.com/address/${currentProg.statePda}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="ref-link"
                title="View on Solana Explorer"
              >
                <code>{currentProg.statePda}</code>
                <ExternalLink size={11} />
              </a>
              <button
                onClick={() => handleCopy("state", currentProg.statePda!)}
                className="copy-mini-btn"
                title="Copy State PDA"
              >
                {copied === "state" ? <Check size={11} className="text-green" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Discovered Tools Clean Table */}
      <div className="table-boxed-wrapper">
        <table className="pi-table">
          <thead>
            <tr>
              <th>Tool Name</th>
              <th>Kind</th>
              <th>Operation</th>
              <th>Effects Claim</th>
            </tr>
          </thead>
          <tbody>
            {currentProg.tools.map((t, i) => (
              <tr key={i}>
                <td>
                  <span className="code-token-badge">{t.name}</span>
                </td>
                <td>
                  <span className={t.kind === "instruction" ? "kind-tx" : "kind-read"}>
                    {t.kind}
                  </span>
                </td>
                <td className="op-cell">{t.operation}</td>
                <td className="effects-cell">{t.effects}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CLI Discovery Command Box */}
      <div className="cli-test-strip">
        <div className="cli-prompt-row">
          <Terminal size={12} className="cli-icon" />
          <code className="cli-cmd-text">
            npm run host -- --program {currentProg.programId}
          </code>
        </div>
        <button
          onClick={() =>
            handleCopy(
              "cli",
              `npm run host -- --program ${currentProg.programId}`
            )
          }
          className="cli-copy-btn"
        >
          {copied === "cli" ? <Check size={12} className="text-green" /> : <Copy size={12} />}
          <span>{copied === "cli" ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <style jsx>{`
        .devnet-ref-wrapper {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin: 16px 0 24px 0;
        }

        .program-tabs-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .program-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 7px 12px;
          cursor: pointer;
          color: #94a3b8;
          font-family: var(--font-sans);
          font-size: 12px;
          transition: all 0.15s ease;
        }

        .program-tab-btn:hover {
          border-color: rgba(255, 255, 255, 0.22);
          color: #f1f5f9;
        }

        .program-tab-btn.active {
          background: rgba(56, 189, 248, 0.08);
          border-color: rgba(56, 189, 248, 0.4);
          color: #38bdf8;
        }

        .tab-name {
          font-weight: 600;
        }

        .tab-badge {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #cbd5e1;
          background: rgba(255, 255, 255, 0.06);
          padding: 1px 6px;
          border-radius: 3px;
        }

        .program-tab-btn.active .tab-badge {
          color: #7dd3fc;
          background: rgba(56, 189, 248, 0.15);
        }

        .ref-header-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          padding: 14px 16px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .ref-header-box.has-three {
          grid-template-columns: 1fr 1fr 1fr;
        }

        .ref-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .ref-label {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #94a3b8;
        }

        .ref-val-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .ref-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #38bdf8;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .ref-link:hover {
          text-decoration: underline;
          color: #7dd3fc;
        }

        .ref-link code {
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.2);
          padding: 2px 6px;
          border-radius: 3px;
          color: #38bdf8;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .copy-mini-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
          flex-shrink: 0;
          transition: color 0.15s ease;
        }

        .copy-mini-btn:hover {
          color: #ffffff;
        }

        /* Table Boxed Wrapper */
        .table-boxed-wrapper {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          overflow-x: auto;
          background: #000000;
        }

        .pi-table {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-sans);
          font-size: 13px;
        }

        .pi-table th {
          background: #000000;
          padding: 10px 14px;
          text-align: left;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
        }

        .pi-table th:last-child {
          border-right: none;
        }

        .pi-table td {
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
          line-height: 1.5;
        }

        .pi-table tr:last-child td {
          border-bottom: none;
        }

        .pi-table td:last-child {
          border-right: none;
        }

        .code-token-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #f1f5f9;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 2px 7px;
          border-radius: 3px;
          white-space: nowrap;
        }

        .kind-tx {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #f59e0b;
        }

        .kind-read {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #38bdf8;
        }

        .op-cell {
          color: #cbd5e1;
          font-size: 12.5px;
        }

        .effects-cell {
          color: #94a3b8;
          font-size: 12px;
        }

        /* CLI Test Strip */
        .cli-test-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 10px 14px;
        }

        .cli-prompt-row {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
        }

        .cli-icon {
          color: #38bdf8;
          flex-shrink: 0;
        }

        .cli-cmd-text {
          font-family: var(--font-mono);
          font-size: 11.5px;
          color: #e2e8f0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cli-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 3px;
          color: #cbd5e1;
          font-family: var(--font-sans);
          font-size: 11px;
          padding: 4px 8px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .cli-copy-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .text-green {
          color: #14f195;
        }

        @media (max-width: 900px) {
          .ref-header-box.has-three {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .ref-header-box {
            grid-template-columns: 1fr;
          }
          .cli-test-strip {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
