"use client";

import React, { useState } from "react";
import { ExternalLink, Copy, Check, Terminal } from "lucide-react";

export default function DevnetPlayground() {
  const [copied, setCopied] = useState<string | null>(null);

  const PROGRAM_ID = "9zJzM4rHDPR4pd3vXHQjQ7whTVmx4zxB3ZH4Gb9iXRwD";
  const CONFIG_PDA = "J8Ph37LoQsv4yED6USdupCooCZzsVMqJkgBTm9uSkvCw";

  const TOOLS = [
    {
      name: "get_vault",
      kind: "accountRead",
      operation: "Read a Vault account by its exact PDA",
      effects: "No transaction or signature",
    },
    {
      name: "get_vault_by_owner",
      kind: "accountRead",
      operation: "Derive and read a vault from its owner's wallet address",
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
  ];

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="devnet-ref-wrapper">
      {/* Target Program & Config PDA Bar */}
      <div className="ref-header-box">
        <div className="ref-item">
          <span className="ref-label">PROGRAM ID</span>
          <div className="ref-val-row">
            <a
              href={`https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="ref-link"
              title="View on Solana Explorer"
            >
              <code>{PROGRAM_ID}</code>
              <ExternalLink size={11} />
            </a>
            <button
              onClick={() => handleCopy("prog", PROGRAM_ID)}
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
              href={`https://explorer.solana.com/address/${CONFIG_PDA}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="ref-link"
              title="View on Solana Explorer"
            >
              <code>{CONFIG_PDA}</code>
              <ExternalLink size={11} />
            </a>
            <button
              onClick={() => handleCopy("pda", CONFIG_PDA)}
              className="copy-mini-btn"
              title="Copy Config PDA"
            >
              {copied === "pda" ? <Check size={11} className="text-green" /> : <Copy size={11} />}
            </button>
          </div>
        </div>
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
            {TOOLS.map((t, i) => (
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
            npm run host -- --program {PROGRAM_ID}
          </code>
        </div>
        <button
          onClick={() =>
            handleCopy(
              "cli",
              `npm run host -- --program ${PROGRAM_ID}`
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
          gap: 16px;
          margin: 16px 0 24px 0;
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

        .ref-item {
          display: flex;
          flex-direction: column;
          gap: 5px;
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
        }

        .copy-mini-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color 0.15s ease;
        }

        .copy-mini-btn:hover {
          color: #ffffff;
        }

        /* Table Boxed Wrapper matching screenshot */
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
