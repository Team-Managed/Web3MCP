"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";

export default function HeroCentered() {
  type TabKey = "npm" | "bash" | "ps";
  const [activeTab, setActiveTab] = useState<TabKey>("npm");
  const [copied, setCopied] = useState<boolean>(false);

  const PROTOCOL_COMMANDS: Record<TabKey, { label: string; symbol: string; cmd: string }> = {
    npm: {
      label: "npm",
      symbol: "$",
      cmd: "npm i -g @web3mcp/host",
    },
    bash: {
      label: "bash (macOS / Linux)",
      symbol: "$",
      cmd: "curl -fsSL https://web3mcp.org/install.sh | bash",
    },
    ps: {
      label: "ps (Windows)",
      symbol: "PS>",
      cmd: "irm https://web3mcp.org/install.ps1 | iex",
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(PROTOCOL_COMMANDS[activeTab].cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="hero-centered-container">
      {/* Top Eyebrow Tag: Clean Monospace Text (NO blue box) */}
      <div className="protocol-badge">
        <span className="badge-dot" />
        <span className="badge-text">ON-CHAIN DISCOVERY PROTOCOL</span>
      </div>

      {/* Main Headline */}
      <h1 className="hero-heading">
        Turn Any Solana Program<br />
        Into an AI Tool with Web3MCP.
      </h1>

      {/* Tight, Punchy Sub-Hero Pitch */}
      <p className="hero-description">
        Programs self-publish typed tools to on-chain PDAs. AI agents discover and simulate capabilities directly over standard Solana RPC.
      </p>

      {/* Action Buttons: Clean sharp rectangular boxes, no arrows */}
      <div className="hero-cta-group">
        <Link href="/docs/latest" className="cta-button primary">
          <span>Read Documentation</span>
        </Link>

        <Link href="/quickstart" className="cta-button secondary">
          <span>Quickstart</span>
        </Link>
      </div>

      {/* Compact CLI Runner switcher */}
      <div className="hero-cli-switcher">
        <div className="cli-tabs" role="tablist">
          {(["npm", "bash", "ps"] as const).map((tab) => (
            <button
              key={tab}
              className={`cli-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
            >
              {PROTOCOL_COMMANDS[tab].label}
            </button>
          ))}
        </div>

        <div className="cli-command-row">
          <div className="cli-text-group">
            <span className="cli-symbol">{PROTOCOL_COMMANDS[activeTab].symbol}</span>
            <code className="cli-code">{PROTOCOL_COMMANDS[activeTab].cmd}</code>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`cli-copy-btn ${copied ? "is-copied" : ""}`}
            aria-label="Copy CLI command"
          >
            {copied ? (
              <>
                <Check size={11} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .hero-centered-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 16px 20px 24px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        /* Clean eyebrow text without any blue bounding box */
        .protocol-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0;
          background: transparent;
          border: none;
          margin-bottom: 12px;
        }

        .badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 1px;
          background: #38bdf8;
          box-shadow: 0 0 6px #38bdf8;
        }

        .badge-text {
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          color: #38bdf8;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* Tightened, prestigious display headline */
        .hero-heading {
          font-family: var(--font-serif);
          font-size: clamp(2.5rem, 5.2vw, 4.2rem);
          font-weight: 500;
          line-height: 1.03;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin: 0 0 14px 0;
        }

        /* Tightened, punchy narrative */
        .hero-description {
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.55;
          color: #94a3b8;
          margin: 0 0 24px 0;
          max-width: 580px;
        }

        /* Action button group with comfortable spacing */
        .hero-cta-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 26px;
          flex-wrap: wrap;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 18px;
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          border-radius: 4px;
          transition: all 0.15s ease;
          text-decoration: none;
        }

        .cta-button.primary {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
        }

        .cta-button.primary:hover {
          background: #0e1217;
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
        }

        .cta-button.secondary {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #94a3b8;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
        }

        .cta-button.secondary:hover {
          background: #0e1217;
          border-color: rgba(255, 255, 255, 0.35);
          color: #ffffff;
          transform: translateY(-1px);
        }

        /* Tighter CLI Switcher */
        .hero-cli-switcher {
          width: 100%;
          max-width: 580px;
          background: rgba(8, 12, 20, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          backdrop-filter: blur(16px);
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        }

        .cli-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 2px;
          gap: 2px;
        }

        .cli-tab {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #64748b;
          padding: 5px 12px;
          border-radius: 2px;
          transition: all 0.15s ease;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .cli-tab:hover {
          color: #f1f5f9;
        }

        .cli-tab.is-active {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          font-weight: 600;
        }

        .cli-command-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          gap: 12px;
        }

        .cli-text-group {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          font-family: var(--font-mono);
          font-size: 12px;
        }

        .cli-symbol {
          color: #38bdf8;
          font-weight: 600;
        }

        .cli-code {
          color: #f1f5f9;
          white-space: nowrap;
        }

        .cli-copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 9px;
          border-radius: 3px;
          font-family: var(--font-sans);
          font-size: 11px;
          font-weight: 500;
          background: #ffffff;
          color: #000000;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .cli-copy-btn:hover {
          background: #e2e8f0;
        }

        .cli-copy-btn.is-copied {
          background: #10b981;
          color: #ffffff;
        }

        @media (max-width: 640px) {
          .hero-centered-container {
            padding: 24px 16px 36px 16px;
          }
          .cli-command-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .cli-copy-btn {
            align-self: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
