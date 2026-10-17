"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PixelCanvas from "./PixelCanvas";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer-container">
      {/* Solana Pixel Canvas framing the footer on scroll */}
      <PixelCanvas triggerOnView />

      <div className="footer-content">
        {/* Brand & Narrative: Solid White, Zero Gradient, Zero Pill Badges */}
        <div className="footer-brand-col">
          <div className="footer-brand" onClick={scrollToTop} role="button" tabIndex={0}>
            <span className="brand-name">Web3MCP</span>
          </div>
          <p className="footer-tagline">
            On-chain tool discovery protocol for Solana programs and autonomous AI agents.
          </p>
        </div>

        {/* Clean, essential links only */}
        <div className="footer-links-grid">
          <div className="footer-col">
            <span className="col-heading">Protocol</span>
            <Link href="/docs/latest" className="col-link">
              Docs
            </Link>
            <Link href="/quickstart" className="col-link">
              Quickstart
            </Link>
          </div>

          <div className="footer-col">
            <span className="col-heading">Community</span>
            <a
              href="https://github.com/Team-Managed/Web3MCP"
              target="_blank"
              rel="noopener noreferrer"
              className="col-link"
            >
              <span>GitHub</span>
              <ArrowUpRight size={11} />
            </a>
            <a
              href="https://github.com/Team-Managed/Web3MCP/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="col-link"
            >
              <span>Changelogs</span>
              <ArrowUpRight size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar Box: Solid black rectangular box preventing pixel overlap */}
      <div className="footer-bottom-box">
        <span className="bottom-copy">
          &copy; 2026 Web3MCP Team &middot; Open source under Apache-2.0 License
        </span>
        <button onClick={scrollToTop} className="back-to-top" type="button" aria-label="Back to top">
          <span>Back to Top &uarr;</span>
        </button>
      </div>

      <style jsx>{`
        .footer-container {
          width: 100%;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: #000000;
          position: relative;
          overflow: hidden;
          padding: 72px 20px 40px 20px;
          box-sizing: border-box;
          min-height: 280px;
        }

        /* Aligned directly with the 900px hero container */
        .footer-content {
          position: relative;
          z-index: 10;
          max-width: 900px;
          margin: 0 auto 36px auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 40px;
        }

        .footer-brand-col {
          max-width: 380px;
        }

        .footer-brand {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 500;
          margin-bottom: 10px;
        }

        .brand-name {
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .footer-tagline {
          font-family: var(--font-sans);
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        .footer-links-grid {
          display: flex;
          gap: 48px;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .col-heading {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 3px;
        }

        :global(.col-link) {
          font-family: var(--font-sans);
          font-size: 13px;
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s ease;
          text-decoration: none;
        }

        :global(.col-link:hover) {
          color: #ffffff;
        }

        .footer-bottom-box {
          position: relative;
          z-index: 10;
          max-width: 900px;
          margin: 0 auto;
          padding: 10px 18px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 4px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-sans);
          font-size: 12px;
          color: #94a3b8;
        }

        .bottom-copy {
          color: #94a3b8;
        }

        .back-to-top {
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: 12px;
          color: #ffffff;
          transition: color 0.15s ease;
          padding: 0;
        }

        .back-to-top:hover {
          color: #38bdf8;
        }

        @media (max-width: 640px) {
          .footer-content {
            flex-direction: column;
            gap: 28px;
          }
          .footer-links-grid {
            gap: 36px;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }
      `}</style>
    </footer>
  );
}
