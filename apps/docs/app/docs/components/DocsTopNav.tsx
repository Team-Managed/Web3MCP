"use client";

import React from "react";
import Link from "next/link";
import { Terminal, ExternalLink } from "lucide-react";

export default function DocsTopNav() {
  return (
    <header className="docs-top-nav">
      <div className="top-nav-inner">
        {/* Left: Square Brand Mark */}
        <Link href="/" className="brand-logo-square" title="Web3MCP Home">
          <span className="logo-glyph">W3</span>
        </Link>

        {/* Center / Right Links: Exact uppercase geometric monospace */}
        <nav className="top-nav-links" aria-label="Documentation header links">
          <Link href="/docs/latest" className="nav-link is-active">
            DOCUMENTATION
          </Link>

          <a
            href="https://solscan.io/account/HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD?cluster=devnet"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            EXPLORER
          </a>
          <a
            href="https://github.com/Team-Managed/Web3MCP"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link github-link"
          >
            <span>GITHUB</span>
            <ExternalLink size={11} />
          </a>
        </nav>
      </div>

      <style jsx>{`
        .docs-top-nav {
          width: 100%;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .top-nav-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-logo-square {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .brand-logo-square:hover {
          background: rgba(56, 189, 248, 0.1);
          border-color: #38bdf8;
        }

        .logo-glyph {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.05em;
        }

        .top-nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .nav-link {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.12em;
          text-decoration: none;
          transition: color 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .nav-link:hover {
          color: #ffffff;
        }

        .nav-link.is-active {
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .top-nav-inner {
            padding: 10px 16px;
          }
          .top-nav-links {
            gap: 16px;
          }
          .nav-link {
            font-size: 10px;
          }
        }
      `}</style>
    </header>
  );
}
