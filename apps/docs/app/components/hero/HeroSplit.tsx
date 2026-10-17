"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Copy, Check, Terminal } from "lucide-react";
import HeroCodeWindow from "./HeroCodeWindow";

export default function HeroSplit() {
  const [activeTab, setActiveTab] = useState<string>("inspect");
  const [copied, setCopied] = useState<boolean>(false);

  const PROTOCOL_COMMANDS: Record<string, string> = {
    inspect: "npx @web3mcp/host GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv",
    agent: "npm run host:agent -- --model gemini-3.8-flash",
    protocol: "npm --prefix protocol test",
    devnet: "solana account HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD --url devnet",
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(PROTOCOL_COMMANDS[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="hero-split-container">
      {/* Left Column: Headline, Narrative, CTAs, and Quick CLI */}
      <div className="hero-left-col">
        <div className="protocol-badge">
          <span className="badge-dot" />
          <span className="badge-text">SOLANA PROTOCOL v0.1.0</span>
        </div>

        <h1 className="hero-heading">
          <span className="headline-solid">The Open Tool Protocol for</span>{" "}
          <span className="headline-gradient">Solana AI Agents.</span>
        </h1>

        <p className="hero-description">
          Solana programs publish typed tool declarations into canonical, program-owned PDAs.
          AI agents discover, decode, and simulate capabilities directly via standard RPC.
          <strong> Zero off-chain servers. Zero IDL imports. Zero LLM key custody.</strong>
        </p>

        {/* Action Buttons (Strictly rectangular/technical borders, NO pills) */}
        <div className="hero-cta-group">
          <Link href="/docs/latest" className="cta-button primary">
            <span>Read Documentation</span>
            <ArrowRight size={14} />
          </Link>

          <a
            href="https://solscan.io/account/HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button secondary"
          >
            <span>Devnet PDA</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Quick CLI Runner switcher */}
        <div className="hero-cli-switcher">
          <div className="cli-tabs" role="tablist">
            {(["inspect", "agent", "protocol", "devnet"] as const).map((tab) => (
              <button
                key={tab}
                className={`cli-tab ${activeTab === tab ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab)}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="cli-command-row">
            <div className="cli-text-group">
              <span className="cli-symbol">$</span>
              <code className="cli-code">{PROTOCOL_COMMANDS[activeTab]}</code>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className={`cli-copy-btn ${copied ? "is-copied" : ""}`}
              aria-label="Copy CLI command"
            >
              {copied ? (
                <>
                  <Check size={12} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: tRPC-Style Dual-Pane Code Editor */}
      <div className="hero-right-col">
        <HeroCodeWindow />
      </div>

      <style jsx>{`
        .hero-split-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
          padding: 64px 32px 56px 32px;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 48px;
          align-items: center;
        }

        .hero-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .protocol-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 10px;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.25);
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 8px #38bdf8;
        }

        .badge-text {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .hero-heading {
          font-family: var(--font-serif);
          font-size: clamp(2.4rem, 4.4vw, 3.8rem);
          font-weight: 500;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0 0 20px 0;
        }

        .headline-solid {
          color: #ffffff;
        }

        .headline-gradient {
          background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 45%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-description {
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.65;
          color: #94a3b8;
          margin: 0 0 28px 0;
          max-width: 580px;
        }

        .hero-description strong {
          color: #e2e8f0;
          font-weight: 600;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 600;
          border-radius: 4px;
          transition: all 0.15s ease;
          text-decoration: none;
        }

        .cta-button.primary {
          background: #38bdf8;
          color: #000000;
          box-shadow: 0 4px 14px rgba(56, 189, 248, 0.35);
        }

        .cta-button.primary:hover {
          background: #7dd3fc;
          transform: translateY(-1px);
        }

        .cta-button.secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .cta-button.secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .hero-cli-switcher {
          width: 100%;
          max-width: 580px;
          background: rgba(10, 14, 23, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          backdrop-filter: blur(16px);
          overflow: hidden;
        }

        .cli-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 3px;
          gap: 3px;
        }

        .cli-tab {
          font-family: var(--font-mono);
          font-size: 11.5px;
          color: #64748b;
          padding: 5px 12px;
          border-radius: 3px;
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
          padding: 5px 10px;
          border-radius: 4px;
          font-family: var(--font-sans);
          font-size: 11.5px;
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

        .hero-right-col {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        @media (max-width: 1080px) {
          .hero-split-container {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 48px 24px;
          }
          .hero-left-col {
            align-items: center;
            text-align: center;
          }
          .hero-description {
            text-align: center;
          }
          .hero-cta-group {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
