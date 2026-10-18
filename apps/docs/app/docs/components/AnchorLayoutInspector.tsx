"use client";

import React, { useState } from "react";
import { Info, Layers } from "lucide-react";

export default function AnchorLayoutInspector() {
  const [selectedByteOffset, setSelectedByteOffset] = useState<number>(0);

  const BYTE_SEGMENTS = [
    {
      name: "discriminator",
      range: "0 .. 8",
      size: "8 B",
      type: "[u8; 8]",
      color: "#a78bfa",
      desc: 'sha256("account:Web3McpConfig")[0..8] = 0x991dc793e1358b35. Enforces Anchor account type verification.',
    },
    {
      name: "authority",
      range: "8 .. 40",
      size: "32 B",
      type: "Pubkey",
      color: "#38bdf8",
      desc: "Authorized publisher wallet address. Only this signer is permitted to write chunks or finalize updates.",
    },
    {
      name: "status",
      range: "40 .. 41",
      size: "1 B",
      type: "u8",
      color: "#34d399",
      desc: "0 = Uninitialized (rejected), 1 = Uploading (fail-closed), 2 = Published (consumable by hosts).",
    },
    {
      name: "expected_len",
      range: "41 .. 45",
      size: "4 B",
      type: "u32 (LE)",
      color: "#fbbf24",
      desc: "Little-endian 32-bit integer specifying exact total byte count of complete UTF-8 JSON payload.",
    },
    {
      name: "digest",
      range: "45 .. 77",
      size: "32 B",
      type: "[u8; 32]",
      color: "#f472b6",
      desc: "SHA-256 digest of entire config JSON. Verified on-chain via native sol_sha256 syscall.",
    },
    {
      name: "config payload",
      range: "77 .. 77+N",
      size: "4 + N B",
      type: "Vec<u8>",
      color: "#60a5fa",
      desc: "4-byte LE length prefix + UTF-8 JSON envelope with embedded Anchor IDL.",
    },
  ];

  const activeSegment = BYTE_SEGMENTS[selectedByteOffset] || BYTE_SEGMENTS[0];

  return (
    <div className="layout-inspector-widget">
      <div className="widget-header">
        <div className="widget-title">
          <Layers size={13} className="text-cyan" />
          <span>Interactive On-Chain Layout Inspector (81-Byte Anchor Prefix)</span>
        </div>
        <span className="widget-badge">CANONICAL PDA</span>
      </div>

      <div className="byte-strip">
        {BYTE_SEGMENTS.map((seg, idx) => (
          <button
            key={seg.name}
            onClick={() => setSelectedByteOffset(idx)}
            className={`byte-cell ${selectedByteOffset === idx ? "is-selected" : ""}`}
            style={{
              borderColor: selectedByteOffset === idx ? seg.color : "rgba(255,255,255,0.12)",
              backgroundColor: selectedByteOffset === idx ? `${seg.color}15` : "rgba(255,255,255,0.02)",
            }}
          >
            <span className="seg-name" style={{ color: seg.color }}>
              {seg.name}
            </span>
            <span className="seg-range">{seg.range}</span>
            <span className="seg-size">{seg.size}</span>
          </button>
        ))}
      </div>

      <div className="segment-detail-card" style={{ borderLeftColor: activeSegment.color }}>
        <div className="detail-meta-row">
          <span className="detail-type" style={{ color: activeSegment.color }}>
            {activeSegment.type}
          </span>
          <span className="detail-range">Offsets {activeSegment.range} ({activeSegment.size})</span>
        </div>
        <p className="detail-desc">{activeSegment.desc}</p>
      </div>

      <style jsx>{`
        .layout-inspector-widget {
          margin: 24px 0;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 4px;
          padding: 16px;
        }

        .widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .widget-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 11.5px;
          font-weight: 600;
          color: #ffffff;
        }

        .text-cyan {
          color: #00c2ff;
        }

        .widget-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          color: #14f195;
          background: rgba(20, 241, 149, 0.1);
          border: 1px solid rgba(20, 241, 149, 0.25);
          padding: 1px 6px;
          border-radius: 2px;
        }

        .byte-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 6px;
          margin-bottom: 12px;
        }

        .byte-cell {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          padding: 8px 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 4px;
          background: #000000;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .byte-cell:hover {
          border-color: rgba(255, 255, 255, 0.35);
        }

        .seg-name {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
        }

        .seg-range {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #94a3b8;
        }

        .seg-size {
          font-family: var(--font-mono);
          font-size: 9.5px;
          color: #64748b;
        }

        .segment-detail-card {
          background: #050505;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-left-width: 3px;
          border-radius: 4px;
          padding: 12px 14px;
        }

        .detail-meta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }

        .detail-type {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
        }

        .detail-range {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: #64748b;
        }

        .detail-desc {
          font-family: var(--font-sans);
          font-size: 12.5px;
          line-height: 1.5;
          color: #cbd5e1;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
