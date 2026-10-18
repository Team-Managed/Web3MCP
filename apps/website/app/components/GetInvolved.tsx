"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, ArrowUpRight, BookOpen } from "lucide-react";
import GithubIcon from "./GithubIcon";

export default function GetInvolved() {
  type TabKey = "clone" | "build" | "run";
  const [activeTab, setActiveTab] = useState<TabKey>("clone");
  const [copied, setCopied] = useState<boolean>(false);

  const PROTOCOL_COMMANDS: Record<TabKey, { label: string; symbol: string; cmd: string }> = {
    clone: {
      label: "clone",
      symbol: "$",
      cmd: "git clone https://github.com/Team-Managed/Web3MCP.git",
    },
    build: {
      label: "build",
      symbol: "$",
      cmd: "cd Web3MCP && npm ci && npm --prefix packages/sdk run build && npm --prefix apps/host run build",
    },
    run: {
      label: "run",
      symbol: "$",
      cmd: "npm run host",
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(PROTOCOL_COMMANDS[activeTab].cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="get-involved-section" aria-labelledby="getInvolvedTitle">
      <div className="section-inner">
        <div className="split-grid">
          {/* Left Column: Heading, Pitch, and CLI Install Terminal */}
          <div className="involved-left">
            <h2 id="getInvolvedTitle" className="section-title">
              Get involved with Web3MCP
            </h2>

            {/* CLI Runner / Installation Switcher matching card dark aesthetic */}
            <div className="cli-switcher">
              <div className="cli-tabs" role="tablist">
                {(["clone", "build", "run"] as const).map((tab) => (
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
          </div>

          {/* Right Column: Stacked Resource Cards (2 cards) */}
          <div className="involved-right">
            <ul className="involved-stack">
              <li className="involved-item">
                <a
                  href="https://github.com/Team-Managed/Web3MCP/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="surface-panel content-card figure-frame"
                >
                  <span className="figure-corner figure-corner--tl" aria-hidden="true"></span>
                  <span className="figure-corner figure-corner--tr" aria-hidden="true"></span>
                  <span className="figure-corner figure-corner--bl" aria-hidden="true"></span>
                  <span className="figure-corner figure-corner--br" aria-hidden="true"></span>
                  <div className="card-body">
                    <div className="card-header-row">
                      <div className="card-icon-title">
                        <GithubIcon size={16} className="card-icon" />
                        <h3 className="card-title">Issues &amp; Contribution</h3>
                      </div>
                      <ArrowUpRight size={14} className="card-arrow" />
                    </div>
                  </div>
                </a>
              </li>

              <li className="involved-item">
                <Link href="/docs/latest" className="surface-panel content-card figure-frame">
                  <span className="figure-corner figure-corner--tl" aria-hidden="true"></span>
                  <span className="figure-corner figure-corner--tr" aria-hidden="true"></span>
                  <span className="figure-corner figure-corner--bl" aria-hidden="true"></span>
                  <span className="figure-corner figure-corner--br" aria-hidden="true"></span>
                  <div className="card-body">
                    <div className="card-header-row">
                      <div className="card-icon-title">
                        <BookOpen size={16} className="card-icon" />
                        <h3 className="card-title">Documentation &amp; Guides</h3>
                      </div>
                      <ArrowUpRight size={14} className="card-arrow" />
                    </div>
                  </div>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .get-involved-section {
          width: 100%;
          padding: 100px 24px 130px;
          position: relative;
          z-index: 10;
          background: #000000;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .section-inner {
          max-width: var(--site-content-inner-max);
          margin: 0 auto;
        }

        .split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        .involved-left {
          display: flex;
          flex-direction: column;
        }

        .section-title {
          font-family: var(--font-serif);
          font-size: clamp(2rem, 3.2vw, 2.75rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          line-height: 1.2;
          margin: 0 0 28px 0;
        }

        /* CLI Switcher Box - matched to exact card aesthetic */
        .cli-switcher {
          width: 100%;
          background: #080808;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          transition: border-color 0.2s ease;
        }

        .cli-switcher:hover {
          border-color: rgba(255, 255, 255, 0.16);
        }

        .cli-tabs {
          display: flex;
          background: #0d0d0d;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 3px;
          gap: 3px;
        }

        .cli-tab {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #737373;
          padding: 6px 14px;
          border-radius: 3px;
          transition: all 0.15s ease;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
        }

        .cli-tab:hover {
          color: #f1f5f9;
        }

        .cli-tab.is-active {
          color: #ffffff;
          background: #181818;
          border-color: rgba(255, 255, 255, 0.12);
          font-weight: 600;
        }

        .cli-command-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 16px;
          gap: 12px;
          background: #080808;
        }

        .cli-text-group {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow-x: auto;
          font-family: var(--font-mono);
          font-size: 13px;
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

        /* Right Stack */
        .involved-stack {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        :global(.content-card) {
          position: relative;
          display: block;
          text-decoration: none;
          border-radius: 6px;
          background: #080808;
          border: 1px solid rgba(255, 255, 255, 0.12);
          transition: all 0.2s ease;
          overflow: visible;
        }

        :global(.content-card:hover) {
          background: #0e0e0e;
          border-color: rgba(56, 189, 248, 0.4);
          transform: translateY(-2px);
        }

        .card-body {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
        }

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-icon-title {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        :global(.card-icon) {
          color: #38bdf8;
          flex-shrink: 0;
        }

        .card-title {
          font-family: var(--font-sans);
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        :global(.card-arrow) {
          color: #64748b;
          transition: all 0.15s ease;
        }

        :global(.content-card:hover .card-arrow) {
          color: #ffffff;
          transform: translate(2px, -2px);
        }

        @media (max-width: 960px) {
          .split-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }

          .get-involved-section {
            padding: 80px 16px;
          }

        }

        @media (max-width: 640px) {
          .cli-command-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .cli-copy-btn {
            align-self: flex-end;
          }
        }
      `}</style>
    </section>
  );
}
