"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Navbar({
  isSticky = false,
  maxWidth = "1360px",
}: {
  isSticky?: boolean;
  maxWidth?: string;
}) {
  return (
    <header className="navbar-floating-container">
      {/* Left Box: Background Black, Square/Rectangular Shaped */}
      <nav className="black-square-dock" aria-label="Main Navigation">
        {/* Square Brand Mark */}
        <Link href="/" className="dock-logo-btn" title="Web3MCP Home">
          <span className="dock-logo-glyph">W3</span>
        </Link>

        {/* Main Nav Links */}
        <div className="dock-links-row">
          <Link href="/docs/latest" className="dock-text-link">
            Docs
          </Link>
          <Link href="/quickstart" className="dock-text-link">
            Quickstart
          </Link>
          <a
            href="https://github.com/Team-Managed/Web3MCP/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="dock-text-link"
          >
            Changelogs
          </a>
        </div>
      </nav>

      {/* Right Box: Background Black, Square/Rectangular Shaped */}
      <div className="dock-right-action">
        <a
          href="https://github.com/Team-Managed/Web3MCP"
          target="_blank"
          rel="noopener noreferrer"
          className="black-action-box"
          title="Web3MCP on GitHub"
        >
          <span className="action-box-label">GitHub</span>
          <span className="action-square-arrow">
            <ArrowUpRight size={13} />
          </span>
        </a>
      </div>

      <style jsx>{`
        .navbar-floating-container {
          position: fixed;
          top: 20px;
          left: 0;
          right: 0;
          width: 100%;
          max-width: ${maxWidth};
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 100;
          pointer-events: none;
        }

        .black-square-dock,
        .dock-right-action {
          pointer-events: auto;
        }

        /* Solid Black Background, Sharp Technical Rectangular Box */
        .black-square-dock {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 6px 18px 6px 8px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 4px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
          transition: border-color 0.15s ease;
        }

        .black-square-dock:hover {
          border-color: rgba(255, 255, 255, 0.3);
        }

        .dock-logo-btn {
          width: 28px;
          height: 28px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: background 0.15s ease;
        }

        .dock-logo-btn:hover {
          background: rgba(255, 255, 255, 0.14);
        }

        .dock-logo-glyph {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.05em;
        }

        .dock-links-row {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        :global(.dock-text-link) {
          font-family: var(--font-sans);
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        :global(.dock-text-link:hover) {
          color: #ffffff;
        }

        /* Right Box: Solid Black Background, Sharp Square */
        .dock-right-action {
          display: flex;
          align-items: center;
        }

        .black-action-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px 6px 16px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 4px;
          color: #ffffff;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
          transition: all 0.15s ease;
        }

        .black-action-box:hover {
          border-color: rgba(255, 255, 255, 0.35);
          background: #0a0a0f;
          transform: translateY(-1px);
        }

        .action-box-label {
          font-family: var(--font-sans);
          font-size: 12.5px;
          font-weight: 500;
          color: #ffffff;
        }

        .action-square-arrow {
          width: 22px;
          height: 22px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transition: all 0.15s ease;
        }

        .black-action-box:hover .action-square-arrow {
          background: #ffffff;
          color: #000000;
        }

        @media (max-width: 640px) {
          .navbar-floating-container {
            padding: 0 16px;
            top: 16px;
          }
          .dock-links-row {
            gap: 12px;
          }
        }
      `}</style>
    </header>
  );
}
