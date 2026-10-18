"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DocSection } from "../../data/docsContent";

interface DocsPaginationProps {
  prevSection: DocSection | null;
  nextSection: DocSection | null;
  onSelectSection: (id: string) => void;
}

export default function DocsPagination({
  prevSection,
  nextSection,
  onSelectSection,
}: DocsPaginationProps) {
  return (
    <div className="docs-pagination-row">
      {prevSection ? (
        <button
          onClick={() => onSelectSection(prevSection.id)}
          className="page-nav-card prev"
        >
          <span className="nav-label">
            <ArrowLeft size={12} />
            <span>PREVIOUS</span>
          </span>
          <span className="nav-title">{prevSection.title}</span>
        </button>
      ) : (
        <div />
      )}

      {nextSection ? (
        <button
          onClick={() => onSelectSection(nextSection.id)}
          className="page-nav-card next"
        >
          <span className="nav-label">
            <span>NEXT</span>
            <ArrowRight size={12} />
          </span>
          <span className="nav-title">{nextSection.title}</span>
        </button>
      ) : (
        <div />
      )}

      <style jsx>{`
        .docs-pagination-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 48px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .page-nav-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .page-nav-card.next {
          text-align: right;
          align-items: flex-end;
        }

        .page-nav-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(56, 189, 248, 0.3);
        }

        .nav-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.08em;
        }

        .nav-title {
          font-family: var(--font-sans);
          font-size: 13.5px;
          font-weight: 600;
          color: #f1f5f9;
        }

        @media (max-width: 600px) {
          .docs-pagination-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
