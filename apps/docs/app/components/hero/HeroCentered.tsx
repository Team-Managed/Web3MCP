"use client";

import React from "react";
import Link from "next/link";

export default function HeroCentered() {
  return (
    <div className="hero-centered-container">
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
          margin-bottom: 0;
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

        @media (max-width: 640px) {
          .hero-centered-container {
            padding: 24px 16px 36px 16px;
          }
        }
      `}</style>
    </div>
  );
}
