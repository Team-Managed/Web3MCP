"use client";

import React from "react";
import { ArrowDown } from "lucide-react";

export default function Hero() {
  const scrollToDocs = () => {
    const el = document.getElementById("docs-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="hero-section">
      <div className="hero-container">
        <span className="eyebrow">SOLANA PROTOCOL</span>
        <h1 className="hero-title">
          <span className="title-white">Web3</span>
          <span className="title-gradient">MCP</span>
        </h1>
        <p className="hero-subtitle">
          Native on-chain tool discovery for AI agents on
          <br />
          Solana
        </p>
        <p className="hero-meta">
          Open-source specification &middot; reference implementation &middot; frozen
          <br />
          v0.1 protocol
        </p>
      </div>

      <div className="scroll-hint" onClick={scrollToDocs}>
        <span>Documentation &middot; Specifications &middot; Guides</span>
        <ArrowDown size={13} className="bounce-arrow" />
      </div>

      <style jsx>{`
        .hero-section {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 40px;
          position: relative;
          z-index: 10;
        }

        .hero-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 860px;
          width: 100%;
        }

        .eyebrow {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 14px;
          display: block;
        }

        .hero-title {
          font-family: "Playfair Display", Georgia, "Times New Roman", serif;
          font-size: clamp(4.8rem, 10vw, 7.8rem);
          font-weight: 500;
          line-height: 1.0;
          letter-spacing: -0.02em;
          margin: 0 0 18px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .title-white {
          color: #ffffff;
        }

        .title-gradient {
          background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 45%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(1.35rem, 2.7vw, 2rem);
          font-weight: 400;
          line-height: 1.32;
          letter-spacing: -0.015em;
          color: #ffffff;
          margin: 0 0 16px 0;
          max-width: 720px;
        }

        .hero-meta {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(0.9rem, 1.3vw, 1.05rem);
          font-weight: 400;
          color: #7e8085;
          line-height: 1.45;
          letter-spacing: -0.01em;
          margin: 0;
          max-width: 600px;
        }

        .scroll-hint {
          position: absolute;
          bottom: 28px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-sans);
          font-size: 11.5px;
          color: #64748b;
          cursor: pointer;
          transition: color 0.15s ease;
          padding: 6px 12px;
        }

        .scroll-hint:hover {
          color: #38bdf8;
        }

        .bounce-arrow {
          animation: bounce 1.8s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }

        @media (max-width: 640px) {
          .hero-section {
            padding: 0 24px;
          }
          .hero-title {
            font-size: 3.8rem;
          }
          .hero-subtitle {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </section>
  );
}
