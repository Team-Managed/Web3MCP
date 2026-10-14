"use client";

import React from "react";

export default function Hero() {
  return (
    <section id="hero" className="hero-section">
      <div className="hero-container">
        <span className="eyebrow">SOLANA PROTOCOL</span>
        <h1 className="hero-title">Web3MCP</h1>
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

      <style jsx>{`
        .hero-section {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 40px;
          position: relative;
          z-index: 10;
        }

        .hero-container {
          max-width: 860px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .eyebrow {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #FF2A85;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
        }

        .hero-title {
          font-family: "Playfair Display", Georgia, "Times New Roman", serif;
          font-size: clamp(4.8rem, 10vw, 7.5rem);
          font-weight: 500;
          line-height: 1.0;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          margin: 0 0 16px 0;
        }

        .hero-subtitle {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(1.35rem, 2.7vw, 2rem);
          font-weight: 400;
          line-height: 1.32;
          letter-spacing: -0.015em;
          color: #FFFFFF;
          margin: 0 0 16px 0;
          max-width: 720px;
        }

        .hero-meta {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: clamp(0.9rem, 1.3vw, 1.05rem);
          font-weight: 400;
          color: #7E8085;
          line-height: 1.45;
          letter-spacing: -0.01em;
          margin: 0;
          max-width: 600px;
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
