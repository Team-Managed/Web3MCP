"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, ExternalLink } from "lucide-react";

export default function HeroZone() {
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
    <header className="hero-zone" id="heroIntro">
      <div className="hero-heading-group">
        <span className="hero-eyebrow">SOLANA PROTOCOL</span>
        <h1 className="hero-title">
          <span className="title-white">Web3</span>
          <span className="title-gradient">MCP</span>
        </h1>
        <p className="hero-tagline">
          <span className="tagline-line">The open tool discovery protocol</span>
          <span className="tagline-line">
            for Solana <span className="tagline-accent">AI agents</span>.
          </span>
        </p>
      </div>

      <p className="hero-orient">
        <span className="orient-line">
          Solana programs publish tool declarations into canonical, program-owned PDAs.
        </span>
        <span className="orient-line">
          AI agents discover, decode, and simulate capabilities directly via standard RPC. Zero off-chain servers.
        </span>
      </p>

      {/* Protocol CLI switcher */}
      <div className="install-switcher">
        <div className="install-tabs" role="tablist" aria-label="CLI commands">
          {(["inspect", "agent", "protocol", "devnet"] as const).map((tab) => (
            <button
              key={tab}
              className={`install-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab)}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="install-command-row">
          <div className="command-display">
            <span className="prompt-symbol">$</span>
            <code className="command-text">{PROTOCOL_COMMANDS[activeTab]}</code>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={`copy-button ${copied ? "is-copied" : ""}`}
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

      <style jsx>{`
        .hero-zone {
          padding: 80px 24px 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 10;
          max-width: 980px;
          margin: 0 auto;
        }

        .hero-heading-group {
          margin-bottom: 24px;
        }

        .hero-eyebrow {
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: inline-block;
          text-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
        }

        .hero-title {
          font-family: var(--font-serif);
          font-size: clamp(4.5rem, 9.5vw, 7.5rem);
          font-weight: 500;
          line-height: 0.98;
          letter-spacing: -0.02em;
          margin: 0 0 18px 0;
        }

        .title-white {
          color: #ffffff;
        }

        .title-gradient {
          background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 45%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-tagline {
          font-family: var(--font-serif);
          font-size: clamp(1.5rem, 3.2vw, 2.3rem);
          font-weight: 400;
          line-height: 1.25;
          letter-spacing: -0.015em;
          color: #e2e8f0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tagline-accent {
          color: #38bdf8;
          font-style: italic;
        }

        .hero-orient {
          font-family: var(--font-sans);
          font-size: 14.5px;
          line-height: 1.55;
          color: #94a3b8;
          max-width: 720px;
          margin: 0 0 36px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .install-switcher {
          width: 100%;
          max-width: 680px;
          background: rgba(10, 10, 14, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          backdrop-filter: blur(16px);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
        }

        .install-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 4px;
          gap: 4px;
        }

        .install-tab {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #64748b;
          padding: 6px 14px;
          border-radius: 6px;
          transition: all 0.15s ease;
          text-transform: lowercase;
        }

        .install-tab:hover {
          color: #f1f5f9;
        }

        .install-tab.is-active {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
          font-weight: 600;
        }

        .install-command-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          gap: 16px;
        }

        .command-display {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          font-family: var(--font-mono);
          font-size: 13px;
        }

        .prompt-symbol {
          color: #38bdf8;
          font-weight: 600;
        }

        .command-text {
          color: #f1f5f9;
          white-space: nowrap;
        }

        .copy-button {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: var(--font-sans);
          font-size: 12px;
          font-weight: 500;
          background: #ffffff;
          color: #000000;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .copy-button:hover {
          background: #e2e8f0;
        }

        .copy-button.is-copied {
          background: #10b981;
          color: #ffffff;
        }

        @media (max-width: 640px) {
          .hero-zone {
            padding: 60px 16px 36px 16px;
          }
          .install-command-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .copy-button {
            align-self: flex-end;
          }
        }
      `}</style>
    </header>
  );
}
