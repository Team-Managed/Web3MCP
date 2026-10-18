"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import BlurText from "./BlurText";

const headlines = [
  ["Give Solana Programs", "Discoverable Tools with", "Web3MCP."],
  ["Say goodbye to old", "MCP servers on Solana", "with Web3MCP."],
];

export default function HeroCentered() {
  const [activeHeadline, setActiveHeadline] = useState(0);
  const [headlineVisible, setHeadlineVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let swapTimer: number | undefined;
    const cycleTimer = window.setInterval(() => {
      if (reducedMotion) {
        setActiveHeadline((current) => 1 - current);
        return;
      }
      setHeadlineVisible(false);
      swapTimer = window.setTimeout(() => {
        setActiveHeadline((current) => 1 - current);
        setHeadlineVisible(true);
      }, 500);
    }, 7000);
    return () => {
      window.clearInterval(cycleTimer);
      window.clearTimeout(swapTimer);
    };
  }, []);

  return (
    <div className="hero-centered-container">
      <h1 className={`hero-heading ${headlineVisible ? "" : "is-hidden"}`} aria-label={headlines[activeHeadline].join(" ")}>
        <span key={activeHeadline}>
          {headlines[activeHeadline].map((line) => (
            <BlurText key={line} text={line} highlightWord="Solana" />
          ))}
        </span>
      </h1>

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

        .hero-heading {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 3.1em;
          font-family: var(--font-serif);
          font-size: clamp(2.5rem, 5.2vw, 4.2rem);
          font-weight: 500;
          line-height: 1.03;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin: 0;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 500ms ease, transform 500ms ease;
        }

        .hero-heading.is-hidden {
          opacity: 0;
          transform: translateY(8px);
        }

        :global(.hero-gradient) {
          font-weight: 600;
          background: linear-gradient(100deg, #9945ff 0%, #14f195 25%, #9945ff 50%, #14f195 75%, #9945ff 100%);
          background-size: 200% 100%;
          background-position: 0% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: solana-gradient 8s ease-in-out infinite alternate;
        }

        @keyframes solana-gradient {
          to { background-position: 100% 50%; }
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 36px;
          margin-bottom: 0;
          flex-wrap: wrap;
        }

        :global(.cta-button) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 18px;
          font-family: var(--font-sans);
          font-size: 14px;
          font-weight: 500;
          border-radius: 4px;
          transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, color 0.2s ease, transform 0.2s ease;
          text-decoration: none;
        }

        :global(.cta-button.primary) {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
        }

        :global(.cta-button.primary:hover),
        :global(.cta-button.primary:focus-visible) {
          background: #0c2119;
          border-color: #14f195;
          box-shadow: 0 0 0 1px rgba(20, 241, 149, 0.35), 0 10px 24px rgba(20, 241, 149, 0.14);
          transform: translateY(-2px);
        }

        :global(.cta-button.secondary) {
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #94a3b8;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5);
        }

        :global(.cta-button.secondary:hover),
        :global(.cta-button.secondary:focus-visible) {
          background: #1a1125;
          border-color: #9945ff;
          color: #ffffff;
          box-shadow: 0 0 0 1px rgba(153, 69, 255, 0.35), 0 10px 24px rgba(153, 69, 255, 0.14);
          transform: translateY(-2px);
        }

        :global(.cta-button:focus-visible) {
          outline: 2px solid #ffffff;
          outline-offset: 3px;
        }

        @media (max-width: 640px) {
          .hero-centered-container {
            padding: 24px 16px 36px 16px;
          }
        }

        @media (max-width: 480px) {
          .hero-heading {
            min-height: 5.2em;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.hero-gradient) {
            animation: none;
            background-position: 50% 50%;
          }
          .hero-heading {
            transition: none;
            transform: none;
          }
          :global(.cta-button) {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
