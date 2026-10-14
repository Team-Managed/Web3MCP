"use client";

import React from "react";
import { ArrowUpRight, Download } from "lucide-react";

export default function Navbar() {
  return (
    <header className="navbar-container">
      <nav className="nav-left">
        <a
          href="/Web3MCP_Pitch_Deck.pptx"
          download
          className="nav-item deck-link"
        >
          <Download size={13} />
          <span>Deck (.pptx)</span>
        </a>
        <a
          href="https://github.com/Team-Managed/Web3MCP/blob/main/protocol/SPEC.md"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item"
        >
          Spec
        </a>
        <a
          href="https://solscan.io/account/HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD?cluster=devnet"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item"
        >
          Devnet
        </a>
        <a
          href="https://github.com/Team-Managed/Web3MCP"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item"
        >
          Source
        </a>
      </nav>

      <div className="nav-right">
        <a
          href="https://github.com/Team-Managed/Web3MCP"
          target="_blank"
          rel="noopener noreferrer"
          className="cta-link"
        >
          <span>GitHub</span>
          <ArrowUpRight size={14} />
        </a>
      </div>

      <style jsx>{`
        .navbar-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          padding: 32px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 50;
          pointer-events: none;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 28px;
          pointer-events: auto;
        }

        .nav-item {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 13.5px;
          font-weight: 400;
          color: #7E8085;
          transition: color 0.15s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .nav-item:hover {
          color: #FFFFFF;
        }

        .deck-link {
          color: #FF2A85;
          font-weight: 500;
        }

        .deck-link:hover {
          color: #FF70B8;
        }

        .nav-right {
          pointer-events: auto;
        }

        .cta-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 13.5px;
          font-weight: 400;
          color: #FFFFFF;
          padding: 6px 14px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: #000000;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .cta-link:hover {
          border-color: #FFFFFF;
          background: #111111;
        }

        @media (max-width: 640px) {
          .navbar-container {
            padding: 20px 24px;
          }
          .nav-left {
            gap: 16px;
          }
        }
      `}</style>
    </header>
  );
}
