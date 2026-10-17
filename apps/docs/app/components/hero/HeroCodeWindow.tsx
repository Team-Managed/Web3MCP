"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, FileCode } from "lucide-react";

export default function HeroCodeWindow() {
  const [copiedPane, setCopiedPane] = useState<string | null>(null);

  const serverCode = `// 1. Program publishes Tool Config PDA
import { Web3McpConfig } from "@web3mcp/protocol";

export const vaultToolConfig: Web3McpConfig = {
  version: 1,
  programId: "GgVnzvsMhHHKeeGnqQhU9KAj...",
  tools: [
    {
      name: "deposit_sol",
      description: "Deposit SOL into yield vault",
      kind: "instruction",
      inputs: {
        amount: { type: "u64", unit: "lamports" }
      },
      accounts: [
        { name: "vault", pda: ["vault", "owner"] },
        { name: "owner", signer: true }
      ]
    }
  ]
};`;

  const terminalText = `Current Balance: 35,001,000 lamports (~0.035 SOL)

Insufficient Vault Balance
You cannot withdraw 5 SOL right now.
 • Requested: 5 SOL (5,000,000,000 lamports)
 • Available in Vault: ~0.035001 SOL (35,001,000 lamports)
 • Shortfall: ~4.964999 SOL (4,964,999,000 lamports)

────────────────────────────────────────────────
gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv
> deposit 10% of my remaining wallet balance
⠋ Thinking...

• Wallet Balance Required
The available on-chain tools allow reading vault PDA state (get_vault), but do not include a direct query for external wallet balances.

How to Proceed:
1. State your current wallet SOL balance, or
2. Specify exact amount directly (e.g. "deposit 0.1 SOL")

Once provided, I will simulate and prepare the transaction for your wallet approval.

────────────────────────────────────────────────
gemini-3.8-flash | devnet | GgVnzvsM...4Lyrgv
> deposit 0.1 SOL`;

  const handleCopy = (pane: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPane(pane);
    setTimeout(() => setCopiedPane(null), 2000);
  };

  return (
    <div className="code-window-frame">
      {/* Window Title Bar */}
      <div className="window-header">
        <div className="window-controls">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>

        <div className="pane-tabs">
          <div className="tab-chip is-active">
            <FileCode size={12} className="tab-icon text-cyan" />
            <span>program.ts</span>
            <span className="tab-badge">ON-CHAIN PDA</span>
          </div>
          <div className="tab-chip is-active">
            <Terminal size={12} className="tab-icon text-emerald" />
            <span>host:agent</span>
            <span className="tab-badge">LIVE CLI</span>
          </div>
        </div>

        <div className="window-actions">
          <span className="live-status-dot" />
          <span className="live-status-text">DEVNET VERIFIED</span>
        </div>
      </div>

      {/* Editor Body: Side-by-Side Dual Panes */}
      <div className="editor-panes-grid">
        {/* Left Pane: Program / Config PDA */}
        <div className="code-pane left-pane">
          <div className="pane-header">
            <div className="pane-title">
              <span className="pane-dot cyan" />
              <span>Publisher (On-Chain)</span>
            </div>
            <button
              onClick={() => handleCopy("server", serverCode)}
              className="pane-copy-btn"
              title="Copy code"
            >
              {copiedPane === "server" ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedPane === "server" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="code-content">
            <div className="line-numbers" aria-hidden="true">
              {Array.from({ length: 22 }).map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <pre className="code-block">
              <code>
                <span className="token-comment">// 1. Program publishes Tool Config PDA</span>{"\n"}
                <span className="token-keyword">import</span> {"{ "}
                <span className="token-type">Web3McpConfig</span>
                {" }"} <span className="token-keyword">from</span>{" "}
                <span className="token-string">"@web3mcp/protocol"</span>;{"\n\n"}
                <span className="token-keyword">export const</span>{" "}
                <span className="token-def">vaultToolConfig</span>:{" "}
                <span className="token-type">Web3McpConfig</span> = {"{\n"}
                {"  "}version: <span className="token-number">1</span>,{"\n"}
                {"  "}programId: <span className="token-string">"GgVnzvs...Lyrgv"</span>,{"\n"}
                {"  "}tools: [{"\n"}
                {"    "}{"{\n"}
                {"      "}name: <span className="token-string">"deposit_sol"</span>,{"\n"}
                {"      "}description: <span className="token-string">"Deposit SOL into vault"</span>,{"\n"}
                {"      "}kind: <span className="token-string">"instruction"</span>,{"\n"}
                {"      "}inputs: {"{\n"}
                {"        "}amount: {"{ "}type: <span className="token-string">"u64"</span>
                {", unit: "}
                <span className="token-string">"lamports"</span>
                {" }"}{"\n"}
                {"      "}{"},\n"}
                {"      "}accounts: [{"\n"}
                {"        "}{"{ "}name: <span className="token-string">"vault"</span>
                {", pda: ["}
                <span className="token-string">"vault"</span>
                {", "}
                <span className="token-string">"owner"</span>
                {"] }\n"}
                {"      ]\n"}
                {"    }\n"}
                {"  ]\n"}
                {"};"}
              </code>
            </pre>
          </div>

          {/* Autocomplete hover preview pill */}
          <div className="code-hover-tooltip">
            <span className="tooltip-tag">PDA Derived</span>
            <code className="tooltip-content">seeds = [&quot;web3mcp&quot;, program_id.as_ref()]</code>
          </div>
        </div>

        {/* Right Pane: Live Agent Terminal CLI */}
        <div className="code-pane right-pane terminal-pane">
          <div className="pane-header">
            <div className="pane-title">
              <span className="pane-dot emerald" />
              <span>Agent Host Terminal</span>
            </div>
            <button
              onClick={() => handleCopy("terminal", terminalText)}
              className="pane-copy-btn"
              title="Copy session output"
            >
              {copiedPane === "terminal" ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedPane === "terminal" ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <div className="terminal-body">
            <div className="term-line term-dim">
              Current Balance: <span className="text-white">35,001,000 lamports</span> (~0.035 SOL)
            </div>
            <div className="term-line term-alert">
              Insufficient Vault Balance
            </div>
            <div className="term-line term-muted">
              You cannot withdraw 5 SOL right now.
            </div>
            <div className="term-indent-block">
              <div className="term-bullet">
                <span className="bullet-dot">•</span> Requested: 5 SOL (5,000,000,000 lamports)
              </div>
              <div className="term-bullet">
                <span className="bullet-dot">•</span> Available in Vault: ~0.035001 SOL (35,001,000 lamports)
              </div>
              <div className="term-bullet">
                <span className="bullet-dot">•</span> Shortfall: ~4.964999 SOL
              </div>
            </div>

            <div className="term-separator" />

            <div className="term-prompt-header">
              <span className="model-tag">gemini-3.8-flash</span>
              <span className="prompt-sep">|</span>
              <span className="cluster-tag">devnet</span>
              <span className="prompt-sep">|</span>
              <span className="pda-tag">GgVnzvsM...4Lyrgv</span>
            </div>
            <div className="term-user-input">
              <span className="prompt-char">&gt;</span> deposit 10% of my remaining wallet balance into the vault
            </div>
            <div className="term-thinking">
              <span className="thinking-spinner">⠋</span> Thinking...
            </div>

            <div className="term-reasoning-title">• Wallet Balance Required</div>
            <div className="term-reasoning-body">
              The available on-chain tools allow reading vault PDA state (<span className="text-purple">get_vault</span>), but do not include a direct query for external wallet balances.
            </div>

            <div className="term-how-to">
              <div className="how-title">How to Proceed</div>
              <div>1. State your current wallet SOL balance, or</div>
              <div>2. Specify the exact amount directly (e.g. &quot;deposit 0.1 SOL&quot;)</div>
            </div>

            <div className="term-separator" />

            <div className="term-prompt-header">
              <span className="model-tag">gemini-3.8-flash</span>
              <span className="prompt-sep">|</span>
              <span className="cluster-tag">devnet</span>
              <span className="prompt-sep">|</span>
              <span className="pda-tag">GgVnzvsM...4Lyrgv</span>
            </div>
            <div className="term-user-input active-input">
              <span className="prompt-char">&gt;</span> deposit 0.1 SOL
              <span className="cursor-block" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .code-window-frame {
          width: 100%;
          background: #090d16;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.08);
          font-family: var(--font-mono);
          position: relative;
        }

        .window-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #0d121f;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .window-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }

        .dot-red {
          background: #ef4444;
          opacity: 0.85;
        }

        .dot-yellow {
          background: #eab308;
          opacity: 0.85;
        }

        .dot-green {
          background: #10b981;
          opacity: 0.85;
        }

        .pane-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tab-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 11px;
          color: #cbd5e1;
          font-family: var(--font-mono);
        }

        .tab-icon.text-cyan {
          color: #38bdf8;
        }

        .tab-icon.text-emerald {
          color: #10b981;
        }

        .tab-badge {
          font-size: 8.5px;
          padding: 1px 4px;
          background: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
          border-radius: 2px;
          letter-spacing: 0.04em;
        }

        .window-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .live-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }

        .live-status-text {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: #34d399;
        }

        .editor-panes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
        }

        .code-pane {
          position: relative;
          background: #070a12;
          padding: 0;
          display: flex;
          flex-direction: column;
        }

        .left-pane {
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        .pane-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .pane-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
        }

        .pane-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .pane-dot.cyan {
          background: #38bdf8;
        }

        .pane-dot.emerald {
          background: #10b981;
        }

        .pane-copy-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          font-size: 10px;
          padding: 2px 7px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pane-copy-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .code-content {
          display: flex;
          padding: 12px 8px;
          overflow-x: auto;
          line-height: 1.55;
          font-size: 11px;
        }

        .line-numbers {
          display: flex;
          flex-direction: column;
          user-select: none;
          color: #334155;
          padding-right: 12px;
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          text-align: right;
          min-width: 24px;
        }

        .code-block {
          margin: 0;
          padding: 0 0 0 12px;
          font-family: var(--font-mono);
          white-space: pre;
          overflow-x: auto;
        }

        /* Syntax colors */
        .token-keyword {
          color: #c084fc;
        }

        .token-type {
          color: #38bdf8;
        }

        .token-def {
          color: #e2e8f0;
          font-weight: 600;
        }

        .token-string {
          color: #34d399;
        }

        .token-number {
          color: #fb923c;
        }

        .token-comment {
          color: #64748b;
          font-style: italic;
        }

        .code-hover-tooltip {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: #1e293b;
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 4px;
          padding: 5px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
          pointer-events: none;
        }

        .tooltip-tag {
          font-size: 8.5px;
          font-weight: 600;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .tooltip-content {
          font-size: 9.5px;
          color: #f1f5f9;
        }

        /* Terminal Pane Styling */
        .terminal-pane {
          background: #04070e;
        }

        .terminal-body {
          padding: 12px 14px;
          font-size: 11px;
          line-height: 1.5;
          overflow-y: auto;
          max-height: 400px;
        }

        .term-line {
          margin-bottom: 2px;
        }

        .term-dim {
          color: #94a3b8;
        }

        .text-white {
          color: #f1f5f9;
          font-weight: 600;
        }

        .term-alert {
          color: #f87171;
          font-weight: 600;
          margin-top: 6px;
        }

        .term-muted {
          color: #cbd5e1;
          margin-bottom: 4px;
        }

        .term-indent-block {
          padding-left: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 8px;
        }

        .term-bullet {
          color: #94a3b8;
          font-size: 10.5px;
        }

        .bullet-dot {
          color: #64748b;
        }

        .term-separator {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 10px 0;
        }

        .term-prompt-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .model-tag {
          color: #a78bfa;
        }

        .prompt-sep {
          color: #475569;
        }

        .cluster-tag {
          color: #34d399;
        }

        .pda-tag {
          color: #38bdf8;
        }

        .term-user-input {
          color: #ffffff;
          font-weight: 500;
          margin-bottom: 6px;
        }

        .prompt-char {
          color: #38bdf8;
          font-weight: 700;
          margin-right: 6px;
        }

        .term-thinking {
          color: #eab308;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          margin-bottom: 6px;
        }

        .thinking-spinner {
          animation: spin 1s steps(8) infinite;
          display: inline-block;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .term-reasoning-title {
          color: #f1f5f9;
          font-weight: 600;
          margin-top: 6px;
          font-size: 10.5px;
        }

        .term-reasoning-body {
          color: #94a3b8;
          font-size: 10.5px;
          margin-bottom: 6px;
        }

        .text-purple {
          color: #c084fc;
        }

        .term-how-to {
          padding-left: 8px;
          color: #cbd5e1;
          font-size: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 6px;
        }

        .how-title {
          font-weight: 600;
          color: #ffffff;
        }

        .active-input {
          display: flex;
          align-items: center;
        }

        .cursor-block {
          width: 7px;
          height: 13px;
          background: #ffffff;
          margin-left: 4px;
          animation: blinkCursor 1s step-end infinite;
          display: inline-block;
        }

        @keyframes blinkCursor {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        @media (max-width: 900px) {
          .editor-panes-grid {
            grid-template-columns: 1fr;
          }
          .left-pane {
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
        }
      `}</style>
    </div>
  );
}
