"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

export default function AnnouncementBar() {
  const scrollToDocs = () => {
    const el = document.getElementById("story-grid");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <aside className="announcement-bar" aria-label="Announcement">
      <div className="announcement-inner">
        <span>
          People of Web3MCP: Protocol <strong>v0.1.0</strong> is frozen and deployed on Solana Devnet with Reference Vault.{" "}
          <button onClick={scrollToDocs} className="announcement-link">
            <span>Explore protocol</span>
            <ArrowRight size={12} />
          </button>
        </span>
      </div>

      <style jsx>{`
        .announcement-bar {
          width: 100%;
          background: rgba(10, 10, 15, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 8px 16px;
          text-align: center;
          font-family: var(--font-sans);
          font-size: 12.5px;
          color: #94a3b8;
          position: relative;
          z-index: 60;
        }

        .announcement-inner strong {
          color: #f1f5f9;
        }

        .announcement-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #38bdf8;
          text-decoration: underline;
          text-underline-offset: 3px;
          margin-left: 4px;
          font-weight: 500;
        }

        .announcement-link:hover {
          color: #7dd3fc;
        }
      `}</style>
    </aside>
  );
}
