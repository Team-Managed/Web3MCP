"use client";

import React from "react";
import { Check, X } from "lucide-react";

/* ========================================================
   SVG 1: DISCOVERY (LEAN MINIMAL MONOCHROME VECTOR)
   Direct Solana RPC Discovery vs Off-Chain Daemon SPOF.
   ======================================================== */
function DiscoverySvg() {
  return (
    <svg
      viewBox="0 0 480 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="feature-vector-svg"
      aria-label="Direct Solana RPC Discovery vs Off-Chain Daemon SPOF"
    >
      <defs>
        <linearGradient id="discDirectBeam" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#737373" />
          <stop offset="60%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* Blueprint Alignment Guides */}
      <g opacity="0.12">
        <line x1="24" y1="64" x2="456" y2="64" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 6" />
        <line x1="24" y1="176" x2="456" y2="176" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 6" />
        <line x1="126" y1="30" x2="126" y2="210" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 6" />
        <line x1="344" y1="30" x2="344" y2="210" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 6" />
      </g>

      {/* Precision Corner Framing Marks */}
      <path d="M 12 24 L 24 24 M 12 24 L 12 36" stroke="#333333" strokeWidth="1.2" />
      <path d="M 468 24 L 456 24 M 468 24 L 468 36" stroke="#333333" strokeWidth="1.2" />
      <path d="M 12 220 L 24 220 M 12 220 L 12 208" stroke="#333333" strokeWidth="1.2" />
      <path d="M 468 220 L 456 220 M 468 220 L 468 208" stroke="#333333" strokeWidth="1.2" />

      {/* =========================================================
          LEFT ORIGIN: UNIFIED AGENT HOST
          ========================================================= */}
      <g transform="translate(24, 94)">
        <rect x="0" y="0" width="98" height="52" rx="5" fill="#0d0d0d" stroke="#ffffff" strokeWidth="1.4" />
        
        {/* Terminal Header Dots */}
        <circle cx="12" cy="11" r="2" fill="#525252" />
        <circle cx="19" cy="11" r="2" fill="#404040" />
        <circle cx="26" cy="11" r="2" fill="#333333" />
        <line x1="6" y1="20" x2="92" y2="20" stroke="#262626" strokeWidth="1" />

        {/* Terminal Prompt CLI Glyph */}
        <path d="M 12 31 L 17 35 L 12 39" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="20" y1="39" x2="26" y2="39" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />

        <text x="32" y="38" fill="#e5e5e5" fontFamily="var(--font-mono)" fontSize="9" fontWeight="600" letterSpacing="0.05em">
          AGENT HOST
        </text>
      </g>

      {/* =========================================================
          BRANCHING FORK (From Agent Host to Top / Bottom Pathways)
          ========================================================= */}
      {/* Upper Fork (Dashed Legacy Route) */}
      <path
        d="M 122 110 C 146 110, 154 64, 182 64"
        stroke="#525252"
        strokeWidth="1.4"
        strokeDasharray="4 3"
        fill="none"
      />
      <polygon points="180,60 188,64 180,68" fill="#525252" />

      {/* Lower Fork (Solid High-Speed Web3MCP Route) */}
      <path
        d="M 122 130 C 146 130, 154 176, 182 176"
        stroke="url(#discDirectBeam)"
        strokeWidth="2.2"
        fill="none"
      />
      <circle cx="146" cy="148" r="2.5" fill="#ffffff" />
      <polygon points="180,172 188,176 180,180" fill="#ffffff" />

      {/* Vertical Bypass Indicator Tag */}
      <g transform="translate(136, 112)">
        <rect x="0" y="0" width="38" height="15" rx="3" fill="#111111" stroke="#333333" strokeWidth="1" />
        <text x="19" y="10.5" fill="#737373" fontFamily="var(--font-mono)" fontSize="6.5" textAnchor="middle" letterSpacing="0.08em">
          BYPASS
        </text>
        <path d="M 19 18 L 19 25 M 16 23 L 19 26 L 22 23" stroke="#525252" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* =========================================================
          PATHWAY 1 (TOP): OFF-CHAIN DOCKER DAEMON MIDDLEMAN (SPOF)
          ========================================================= */}
      <g transform="translate(188, 40)">
        <rect x="0" y="0" width="108" height="48" rx="5" fill="#0d0d0d" stroke="#383838" strokeWidth="1.2" />

        {/* Vector Docker Whale Logo (No typed text) */}
        <g transform="translate(12, 10) scale(1.05)" fill="#ffffff">
          <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.186.185.186m0 2.715h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.186.185.186m-2.953 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.076a.185.185 0 00-.185.185v1.887c0 .102.083.186.185.186m-2.954 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.122a.185.185 0 00-.185.185v1.887c0 .102.084.186.185.186m5.907 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.953 0h2.12a.186.186 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.954 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186H5.122a.185.185 0 00-.185.185v1.888c0 .102.084.185.185.185m-2.954 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185M23.766 12.33c-.306-.454-.85-1.045-1.636-1.045-.244 0-.466.04-.66.115-.35-1.282-1.38-2.12-2.73-2.12-.132 0-.263.008-.393.024a5.184 5.184 0 00-2.48-1.583V4.96a.185.185 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v2.529a6.685 6.685 0 00-.98-.073H.186A.186.186 0 000 7.587v2.327c0 4.908 3.98 8.887 8.888 8.887 6.46 0 11.89-4.207 13.682-10.02.585.138 1.154.09 1.642-.144.332-.16.592-.416.754-.707.014-.025-.015-.05-.03-.037a3.02 3.02 0 01-1.17.437z" />
        </g>

        {/* Daemon Port Badge */}
        <rect x="46" y="12" width="50" height="13" rx="2" fill="#141414" stroke="#2d2d2d" />
        <text x="71" y="21.5" fill="#737373" fontFamily="var(--font-mono)" fontSize="7" textAnchor="middle">
          PORT :8080
        </text>

        {/* Server State Indicator Bars */}
        <rect x="46" y="30" width="30" height="4" rx="1" fill="#404040" />
        <rect x="80" y="30" width="16" height="4" rx="1" fill="#2d2d2d" />
      </g>

      {/* Severed Connection / 502 Timeout */}
      <path
        d="M 296 64 L 336 64"
        stroke="#525252"
        strokeWidth="1.4"
        strokeDasharray="3 3"
      />
      {/* SPOF Failure Badge */}
      <g transform="translate(336, 64)">
        <circle cx="0" cy="0" r="8" fill="#141414" stroke="#737373" strokeWidth="1.2" />
        <path d="M -2.8 -2.8 L 2.8 2.8 M 2.8 -2.8 L -2.8 2.8" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
        <text x="0" y="-12" fill="#737373" fontFamily="var(--font-mono)" fontSize="7" textAnchor="middle" letterSpacing="0.08em">
          502 TIMEOUT
        </text>
      </g>

      {/* Ghost Disconnected Target Node (Top Right) */}
      <g transform="translate(356, 42)" opacity="0.38">
        <rect x="0" y="0" width="96" height="44" rx="4" fill="#080808" stroke="#333333" strokeWidth="1.2" strokeDasharray="3 3" />
        
        {/* Slashed Circle */}
        <circle cx="18" cy="22" r="6" stroke="#737373" strokeWidth="1.2" fill="none" />
        <line x1="13.5" y1="17.5" x2="22.5" y2="26.5" stroke="#737373" strokeWidth="1.2" />

        <text x="32" y="19" fill="#737373" fontFamily="var(--font-mono)" fontSize="8" fontWeight="600">
          PROGRAM
        </text>
        <text x="32" y="29" fill="#525252" fontFamily="var(--font-mono)" fontSize="6.5">
          UNREACHABLE
        </text>
      </g>

      {/* =========================================================
          PATHWAY 2 (BOTTOM): DIRECT SOLANA RPC & CONFIG PDA
          ========================================================= */}
      {/* Node 1: Direct Solana RPC Engine */}
      <g transform="translate(188, 152)">
        <rect x="0" y="0" width="108" height="48" rx="5" fill="#0d0d0d" stroke="#525252" strokeWidth="1.4" />

        {/* Solana Three-Bar Official Glyph */}
        <g transform="translate(12, 13) scale(0.75)" fill="#ffffff">
          <path d="M3.9.23c.15-.146.35-.23.554-.23h19.153c.35 0 .525.422.277.67l-3.783 3.783a.785.785 0 0 1-.555.23H.393a.392.392 0 0 1-.277-.67L3.899.229z" />
          <path d="M20.1 7.247a.785.785 0 0 0-.554-.23H.393a.392.392 0 0 0-.277.67l3.783 3.784c.145.145.344.23.555.23h19.153c.35 0 .525-.423.277-.67l-3.783-3.784z" />
          <path d="M3.9 14.355a.785.785 0 0 1 .554-.23h19.153c.35 0 .525.423.277.67l-3.783 3.784a.785.785 0 0 1-.555.23H.393a.392.392 0 0 1-.277-.67l3.783-3.784z" />
        </g>

        <text x="44" y="24" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="8.5" fontWeight="600" letterSpacing="0.04em">
          SOLANA RPC
        </text>
        <text x="44" y="35" fill="#737373" fontFamily="var(--font-mono)" fontSize="7">
          getAccountInfo
        </text>
      </g>

      {/* Solid High-Speed Signal Line to On-Chain Program */}
      <path
        d="M 296 176 L 340 176"
        stroke="#ffffff"
        strokeWidth="2"
      />
      <circle cx="316" cy="176" r="2.5" fill="#ffffff" />
      <polygon points="334,172 342,176 334,180" fill="#ffffff" />

      {/* Node 2: On-Chain Canonical Config PDA Discovery Matrix */}
      <g transform="translate(346, 144)">
        <rect x="0" y="0" width="112" height="64" rx="5" fill="#0b0b0b" stroke="#ffffff" strokeWidth="1.6" />

        {/* Crosshair Precision Corner Accents */}
        <path d="M -3 6 L -3 -3 L 6 -3" stroke="#ffffff" strokeWidth="1" />
        <path d="M 115 6 L 115 -3 L 106 -3" stroke="#ffffff" strokeWidth="1" />
        <path d="M -3 58 L -3 67 L 6 67" stroke="#ffffff" strokeWidth="1" />
        <path d="M 115 58 L 115 67 L 106 67" stroke="#ffffff" strokeWidth="1" />

        {/* Canonical Seed Key Icon */}
        <circle cx="14" cy="18" r="3.5" stroke="#ffffff" strokeWidth="1.2" fill="none" />
        <line x1="17.5" y1="18" x2="25" y2="18" stroke="#ffffff" strokeWidth="1.4" />
        <line x1="22" y1="18" x2="22" y2="21" stroke="#ffffff" strokeWidth="1.2" />

        <text x="31" y="21" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="8.5" fontWeight="700" letterSpacing="0.05em">
          CONFIG PDA
        </text>

        {/* Verified Check Badge */}
        <circle cx="98" cy="18" r="6" fill="#171717" stroke="#ffffff" strokeWidth="1.2" />
        <path d="M 95.5 18 L 97.5 20 L 100.5 16" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />

        {/* Internal Divider */}
        <line x1="10" y1="30" x2="102" y2="30" stroke="#262626" strokeWidth="1" />

        {/* Verified Discovered Dynamic Tools */}
        <g transform="translate(10, 37)">
          <rect x="0" y="0" width="42" height="17" rx="3" fill="#141414" stroke="#404040" strokeWidth="1" />
          <text x="21" y="11.5" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="7" textAnchor="middle">
            get_vault
          </text>

          <rect x="48" y="0" width="44" height="17" rx="3" fill="#141414" stroke="#404040" strokeWidth="1" />
          <text x="70" y="11.5" fill="#d4d4d4" fontFamily="var(--font-mono)" fontSize="7" textAnchor="middle">
            deposit
          </text>
        </g>
      </g>
    </svg>
  );
}

/* ========================================================
   SVG 2: SCHEMA INTEGRITY (LEAN MINIMAL MONOCHROME VECTOR)
   Atomic sol_sha256 Syscall & Borsh JIT Codec.
   ======================================================== */
function SchemaIntegritySvg() {
  return (
    <svg
      viewBox="0 0 480 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="feature-vector-svg"
      aria-label="Atomic syscall sol_sha256 parity verification compiling dynamic Borsh coders"
    >
      <defs>
        <linearGradient id="streamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#404040" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id="hasherGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Blueprint Alignment Guides */}
      <g opacity="0.15">
        <line x1="40" y1="120" x2="440" y2="120" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 6" />
        <line x1="240" y1="30" x2="240" y2="210" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 6" />
      </g>

      {/* --- LEFT: DUAL CONVERGING DATA STREAMS --- */}
      {/* STREAM A (Top): On-Chain Program Bytecode Matrix */}
      <g transform="translate(36, 52)">
        <rect x="0" y="0" width="84" height="28" rx="4" fill="#0d0d0d" stroke="#333333" strokeWidth="1.2" />
        <rect x="8" y="7" width="16" height="6" rx="1.5" fill="#ffffff" />
        <rect x="28" y="7" width="22" height="6" rx="1.5" fill="#737373" />
        <rect x="54" y="7" width="14" height="6" rx="1.5" fill="#404040" />
        <rect x="8" y="16" width="30" height="5" rx="1.5" fill="#525252" />
        <rect x="42" y="16" width="26" height="5" rx="1.5" fill="#a3a3a3" />

        <path
          d="M 84 14 L 140 14 C 168 14, 185 35, 195 72"
          stroke="#737373"
          strokeWidth="1.4"
        />
        <circle cx="140" cy="14" r="2.5" fill="#ffffff" />
      </g>

      {/* STREAM B (Bottom): Deployed Tool Manifest Schema */}
      <g transform="translate(36, 160)">
        <rect x="0" y="0" width="84" height="28" rx="4" fill="#0d0d0d" stroke="#333333" strokeWidth="1.2" />
        <rect x="8" y="7" width="24" height="6" rx="1.5" fill="#a3a3a3" />
        <rect x="36" y="7" width="18" height="6" rx="1.5" fill="#525252" />
        <rect x="58" y="7" width="16" height="6" rx="1.5" fill="#ffffff" />
        <rect x="8" y="16" width="20" height="5" rx="1.5" fill="#737373" />
        <rect x="32" y="16" width="34" height="5" rx="1.5" fill="#404040" />

        <path
          d="M 84 14 L 140 14 C 168 14, 185 -7, 195 -44"
          stroke="#737373"
          strokeWidth="1.4"
        />
        <circle cx="140" cy="14" r="2.5" fill="#ffffff" />
      </g>

      {/* --- CENTER: ATOMIC CRYPTOGRAPHIC HASHER (sol_sha256 SYSCALL) --- */}
      <g transform="translate(240, 120)">
        <circle cx="0" cy="0" r="54" fill="url(#hasherGlow)" stroke="#262626" strokeWidth="1" />
        <circle cx="0" cy="0" r="45" stroke="#404040" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="0" cy="0" r="32" fill="#0c0c0c" stroke="#ffffff" strokeWidth="1.6" />

        {/* Caliper Measurement Ticks */}
        <line x1="0" y1="-54" x2="0" y2="-47" stroke="#737373" strokeWidth="1" />
        <line x1="0" y1="47" x2="0" y2="54" stroke="#737373" strokeWidth="1" />
        <line x1="-54" y1="0" x2="-47" y2="0" stroke="#737373" strokeWidth="1" />
        <line x1="47" y1="0" x2="54" y2="0" stroke="#737373" strokeWidth="1" />

        <line x1="-38" y1="-38" x2="-33" y2="-33" stroke="#525252" strokeWidth="1" />
        <line x1="33" y1="33" x2="38" y2="38" stroke="#525252" strokeWidth="1" />
        <line x1="38" y1="-38" x2="33" y2="-33" stroke="#525252" strokeWidth="1" />
        <line x1="-33" y1="33" x2="-38" y2="38" stroke="#525252" strokeWidth="1" />

        {/* 1:1 Parity Interlock Mechanism (Zero-Tolerance Hash Match) */}
        <path
          d="M -16 -8 L -4 -8 L 0 -4 L 0 4 L -4 8 L -16 8 Z"
          fill="#ffffff"
        />
        <path
          d="M 16 -8 L 4 -8 L 0 -4 L 0 4 L 4 8 L 16 8 Z"
          fill="#737373"
        />
        <line x1="0" y1="-10" x2="0" y2="10" stroke="#000000" strokeWidth="1.5" />
      </g>

      {/* --- RIGHT: DYNAMIC BORSH JIT SERIALIZED STREAM --- */}
      <line x1="294" y1="120" x2="442" y2="120" stroke="url(#streamGrad1)" strokeWidth="2" />

      {/* Serialized Instruction Packets Moving Smoothly to Execution */}
      <g transform="translate(306, 107)">
        <rect x="0" y="0" width="24" height="26" rx="3" fill="#141414" stroke="#ffffff" strokeWidth="1.4" />
        <line x1="6" y1="13" x2="18" y2="13" stroke="#ffffff" strokeWidth="1.5" />

        <rect x="34" y="0" width="30" height="26" rx="3" fill="#141414" stroke="#d4d4d4" strokeWidth="1.2" />
        <line x1="42" y1="9" x2="56" y2="9" stroke="#d4d4d4" strokeWidth="1" />
        <line x1="42" y1="17" x2="52" y2="17" stroke="#888888" strokeWidth="1" />

        <rect x="74" y="0" width="24" height="26" rx="3" fill="#141414" stroke="#888888" strokeWidth="1.2" />
        <circle cx="86" cy="13" r="3.5" fill="#888888" />

        <path
          d="M 126 7 L 134 13 L 126 19"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* DEFLECTED 0x1771 CONSTRAINT REVERT LOOP (BLOCKED) */}
      <g opacity="0.6">
        <path
          d="M 265 152 C 285 188, 305 198, 345 198"
          stroke="#333333"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <line x1="345" y1="190" x2="345" y2="206" stroke="#737373" strokeWidth="2" strokeLinecap="round" />
        <path d="M 353 194 L 361 202 M 361 194 L 353 202" stroke="#737373" strokeWidth="1.4" strokeLinecap="round" />
      </g>

      {/* Precision Corner Brackets */}
      <path d="M 12 24 L 24 24 M 12 24 L 12 36" stroke="#333333" strokeWidth="1.2" />
      <path d="M 468 24 L 456 24 M 468 24 L 468 36" stroke="#333333" strokeWidth="1.2" />
      <path d="M 12 220 L 24 220 M 12 220 L 12 208" stroke="#333333" strokeWidth="1.2" />
      <path d="M 468 220 L 456 220 M 468 220 L 468 208" stroke="#333333" strokeWidth="1.2" />
    </svg>
  );
}

/* ========================================================
   SVG 3: EXECUTION SEAM (LEAN MINIMAL MONOCHROME VECTOR)
   Air-gapped seam: Agent proposal vs Phantom wallet approval.
   ======================================================== */
function ExecutionSeamSvg() {
  return (
    <svg
      viewBox="0 0 480 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="feature-vector-svg"
      aria-label="The Web3MCP air-gapped execution seam separating untrusted agent from signing wallet"
    >
      <defs>
        <radialGradient id="scannerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Blueprint Coordinates */}
      <g opacity="0.12">
        <line x1="20" y1="65" x2="460" y2="65" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 6" />
        <line x1="20" y1="154" x2="460" y2="154" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 6" />
      </g>

      {/* Framing Corner Brackets */}
      <path d="M 12 24 L 24 24 M 12 24 L 12 36" stroke="#333333" strokeWidth="1.2" />
      <path d="M 468 24 L 456 24 M 468 24 L 468 36" stroke="#333333" strokeWidth="1.2" />
      <path d="M 12 220 L 24 220 M 12 220 L 12 208" stroke="#333333" strokeWidth="1.2" />
      <path d="M 468 220 L 456 220 M 468 220 L 468 208" stroke="#333333" strokeWidth="1.2" />

      {/* ===================================================
          LEFT: UNTRUSTED AI MODEL / NEURAL CORE
          =================================================== */}
      <g transform="translate(24, 98)">
        {/* Chip Package Frame */}
        <rect x="0" y="0" width="84" height="52" rx="4" fill="#0d0d0d" stroke="#444444" strokeWidth="1.2" />
        
        {/* Micro-pins around Chip */}
        <line x1="-3" y1="16" x2="0" y2="16" stroke="#525252" strokeWidth="1.2" />
        <line x1="-3" y1="26" x2="0" y2="26" stroke="#525252" strokeWidth="1.2" />
        <line x1="-3" y1="36" x2="0" y2="36" stroke="#525252" strokeWidth="1.2" />
        
        <line x1="22" y1="-3" x2="22" y2="0" stroke="#525252" strokeWidth="1.2" />
        <line x1="42" y1="-3" x2="42" y2="0" stroke="#525252" strokeWidth="1.2" />
        <line x1="62" y1="-3" x2="62" y2="0" stroke="#525252" strokeWidth="1.2" />

        {/* AI Sparkle / Neural Core Icon */}
        <path
          d="M 22 26 Q 22 16, 26 16 Q 26 26, 36 26 Q 26 26, 26 36 Q 26 26, 22 26 Z"
          fill="#ffffff"
        />
        <circle cx="26" cy="26" r="1.5" fill="#000000" />

        {/* Chip Typography */}
        <text x="42" y="24" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="8.5" fontWeight="700">
          AI MODEL
        </text>
        <text x="42" y="35" fill="#737373" fontFamily="var(--font-mono)" fontSize="6.5">
          UNTRUSTED
        </text>
      </g>

      {/* --- ATTACK VECTOR 1 (TOP): PROMPT INJECTION (ATTEMPTED DRAIN) --- */}
      <g>
        <path
          d="M 108 112 C 126 65, 142 65, 172 65"
          stroke="#737373"
          strokeWidth="1.6"
          strokeDasharray="4 2"
        />
        <polygon points="170,61 178,65 170,69" fill="#737373" />

        {/* Attack Payload Tag */}
        <g transform="translate(112, 48)">
          <rect x="0" y="0" width="46" height="13" rx="2" fill="#141414" stroke="#333333" />
          <text x="23" y="9" fill="#888888" fontFamily="var(--font-mono)" fontSize="6" textAnchor="middle">
            drain_all()
          </text>
        </g>

        {/* DEFLECTION AT THE AIR-GAP SEAM */}
        <line x1="188" y1="42" x2="188" y2="88" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        {/* Reflected Ray Bouncing Backwards */}
        <path d="M 184 65 L 164 48" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <polygon points="163,53 160,45 168,48" fill="#ffffff" />

        {/* Blocked Stop Badge */}
        <g transform="translate(144, 45)">
          <circle cx="0" cy="0" r="8" fill="#181818" stroke="#ffffff" strokeWidth="1.2" />
          <path d="M -2.8 -2.8 L 2.8 2.8 M 2.8 -2.8 L -2.8 2.8" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
          <text x="0" y="-11" fill="#737373" fontFamily="var(--font-mono)" fontSize="6.5" textAnchor="middle">
            BLOCKED
          </text>
        </g>
      </g>

      {/* --- VECTOR 2 (BOTTOM): UNTRUSTED ARGUMENT PROPOSAL --- */}
      <path
        d="M 108 136 C 126 154, 142 154, 156 154"
        stroke="#525252"
        strokeWidth="1.6"
      />
      {/* Parameter Proposal Block */}
      <g transform="translate(122, 145)">
        <rect x="0" y="0" width="30" height="18" rx="2.5" fill="#141414" stroke="#a3a3a3" strokeWidth="1" />
        <line x1="5" y1="6" x2="25" y2="6" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
        <line x1="5" y1="12" x2="18" y2="12" stroke="#737373" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* ===================================================
          CENTER: THE UNBREAKABLE AIR-GAPPED SEAM & SIMULATION
          =================================================== */}
      {/* Vertical Armor Seam Wall */}
      <line x1="188" y1="26" x2="188" y2="214" stroke="#404040" strokeWidth="1.8" strokeDasharray="5 4" />
      <line x1="246" y1="26" x2="246" y2="214" stroke="#ffffff" strokeWidth="2" />

      {/* Top & Bottom Air-Gap Barrier Isolation Brackets */}
      <path d="M 188 26 L 246 26" stroke="#737373" strokeWidth="1.4" />
      <path d="M 188 214 L 246 214" stroke="#737373" strokeWidth="1.4" />
      
      {/* Air Gap Hatching Lines */}
      <line x1="202" y1="36" x2="232" y2="36" stroke="#262626" strokeWidth="1" />
      <line x1="202" y1="204" x2="232" y2="204" stroke="#262626" strokeWidth="1" />

      {/* CENTRAL PRE-SIMULATION INSPECTION CORE */}
      <g transform="translate(217, 154)">
        <circle cx="0" cy="0" r="34" fill="url(#scannerGlow)" stroke="#333333" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="0" cy="0" r="26" fill="#0d0d0d" stroke="#ffffff" strokeWidth="1.6" />
        
        {/* Caliper ticks */}
        <line x1="0" y1="-26" x2="0" y2="-21" stroke="#737373" strokeWidth="1" />
        <line x1="0" y1="21" x2="0" y2="26" stroke="#737373" strokeWidth="1" />
        <line x1="-26" y1="0" x2="-21" y2="0" stroke="#737373" strokeWidth="1" />
        <line x1="21" y1="0" x2="26" y2="0" stroke="#737373" strokeWidth="1" />

        {/* Official Solana Three-Bar Micro Glyph in Simulation Core */}
        <g transform="translate(-7, -16) scale(0.6)" fill="#ffffff">
          <path d="M3.9.23c.15-.146.35-.23.554-.23h19.153c.35 0 .525.422.277.67l-3.783 3.783a.785.785 0 0 1-.555.23H.393a.392.392 0 0 1-.277-.67L3.899.229z" />
          <path d="M20.1 7.247a.785.785 0 0 0-.554-.23H.393a.392.392 0 0 0-.277.67l3.783 3.784c.145.145.344.23.555.23h19.153c.35 0 .525-.423.277-.67l-3.783-3.784z" />
          <path d="M3.9 14.355a.785.785 0 0 1 .554-.23h19.153c.35 0 .525.423.277.67l-3.783 3.784a.785.785 0 0 1-.555.23H.393a.392.392 0 0 1-.277-.67l3.783-3.784z" />
        </g>

        {/* Balance Delta Readout */}
        <text x="0" y="3" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="6.5" fontWeight="700" textAnchor="middle">
          Δ SOL: 0.00
        </text>
        <text x="0" y="12" fill="#737373" fontFamily="var(--font-mono)" fontSize="5.5" textAnchor="middle">
          SIMULATED
        </text>
      </g>

      {/* ===================================================
          RIGHT: SOVEREIGN PHANTOM WALLET APPROVAL & VAULT
          =================================================== */}
      <line x1="246" y1="154" x2="284" y2="154" stroke="#ffffff" strokeWidth="2" />
      <polygon points="282,150 290,154 282,158" fill="#ffffff" />

      {/* OFFICIAL PHANTOM WALLET APPROVAL GATE */}
      <g transform="translate(294, 126)">
        <rect x="0" y="0" width="80" height="56" rx="5" fill="#0d0d0d" stroke="#ffffff" strokeWidth="1.5" />

        {/* Official Phantom Ghost Vector Logo */}
        <g transform="translate(8, 8) scale(0.9)" fill="#ffffff">
          <path d="M 12 3 C 6.5 3, 2.5 7.2, 2.5 12.8 C 2.5 18, 2.5 22.5, 2.5 22.5 C 4.5 20.8, 6.8 20.8, 8.8 22.5 C 10.8 20.8, 13.2 20.8, 15.2 22.5 C 17.2 20.8, 19.5 20.8, 21.5 22.5 C 21.5 22.5, 21.5 18, 21.5 12.8 C 21.5 7.2, 17.5 3, 12 3 Z" />
          {/* Phantom Eyes */}
          <circle cx="8.5" cy="11.5" r="1.4" fill="#0d0d0d" />
          <circle cx="15.5" cy="11.5" r="1.4" fill="#0d0d0d" />
        </g>

        {/* Phantom Wallet Title */}
        <text x="34" y="20" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="7.5" fontWeight="700" letterSpacing="0.05em">
          PHANTOM
        </text>
        <text x="34" y="29" fill="#737373" fontFamily="var(--font-mono)" fontSize="6">
          SIGNER
        </text>

        {/* User Approval Pill Button */}
        <g transform="translate(8, 36)">
          <rect x="0" y="0" width="64" height="14" rx="2" fill="#141414" stroke="#404040" />
          <text x="32" y="9.5" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="6.5" fontWeight="600" textAnchor="middle">
            APPROVE ✓
          </text>
        </g>
      </g>

      {/* Approved Signature Transmission Pulse to Vault */}
      <line x1="374" y1="154" x2="406" y2="154" stroke="#ffffff" strokeWidth="2.2" />
      <polygon points="404,150 412,154 404,158" fill="#ffffff" />

      {/* TREASURY VAULT (HEAVY CIRCULAR BANK VAULT DOOR WITH ED25519) */}
      <g transform="translate(438, 154)">
        {/* Outer Vault Bolting Ring with 8 Radial Locking Bolts */}
        <circle cx="0" cy="0" r="28" fill="#111111" stroke="#525252" strokeWidth="1.8" />
        {/* Radial Locking Bolts */}
        <line x1="0" y1="-28" x2="0" y2="-21" stroke="#ffffff" strokeWidth="2" />
        <line x1="0" y1="21" x2="0" y2="28" stroke="#ffffff" strokeWidth="2" />
        <line x1="-28" y1="0" x2="-21" y2="0" stroke="#ffffff" strokeWidth="2" />
        <line x1="21" y1="0" x2="28" y2="0" stroke="#ffffff" strokeWidth="2" />
        <line x1="-20" y1="-20" x2="-15" y2="-15" stroke="#ffffff" strokeWidth="1.8" />
        <line x1="15" y1="15" x2="20" y2="20" stroke="#ffffff" strokeWidth="1.8" />
        <line x1="20" y1="-20" x2="15" y2="-15" stroke="#ffffff" strokeWidth="1.8" />
        <line x1="-15" y1="15" x2="-20" y2="20" stroke="#ffffff" strokeWidth="1.8" />

        {/* Inner Rotating Vault Safe Door */}
        <circle cx="0" cy="0" r="17" fill="#1c1c1c" stroke="#ffffff" strokeWidth="1.6" />
        <text x="0" y="2.5" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="5.5" fontWeight="700" textAnchor="middle">
          Ed25519
        </text>
        <text x="0" y="9" fill="#737373" fontFamily="var(--font-mono)" fontSize="5" textAnchor="middle">
          VAULT
        </text>
      </g>
    </svg>
  );
}

/* ========================================================
   SVG 4: STATE RESOLUTION (LEAN MINIMAL MONOCHROME VECTOR)
   4-tier declarative account resolution hierarchy.
   ======================================================== */
function StateResolutionSvg() {
  return (
    <svg
      viewBox="0 0 480 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="feature-vector-svg"
      aria-label="4-tier declarative account resolution hierarchy over Solana RPC"
    >
      <defs>
        <linearGradient id="scanBeamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#737373" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="outputBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#404040" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* Blueprint Coordinates */}
      <g opacity="0.12">
        <line x1="20" y1="120" x2="460" y2="120" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="3 6" />
      </g>

      {/* Framing Corner Brackets */}
      <path d="M 12 24 L 24 24 M 12 24 L 12 36" stroke="#333333" strokeWidth="1.2" />
      <path d="M 468 24 L 456 24 M 468 24 L 468 36" stroke="#333333" strokeWidth="1.2" />
      <path d="M 12 220 L 24 220 M 12 220 L 12 208" stroke="#333333" strokeWidth="1.2" />
      <path d="M 468 220 L 456 220 M 468 220 L 468 208" stroke="#333333" strokeWidth="1.2" />

      {/* ===================================================
          LEFT: LEGACY TRANSPORT BLOAT (NODE.JS STDIO PIPES)
          =================================================== */}
      <g transform="translate(24, 36)">
        <rect x="0" y="0" width="76" height="168" rx="5" fill="#0d0d0d" stroke="#383838" strokeWidth="1.2" strokeDasharray="3 3" />
        
        {/* Official Node.js Hexagon Logo */}
        <g transform="translate(14, 12)">
          <polygon
            points="12,1 22,6.8 22,18.2 12,24 2,18.2 2,6.8"
            fill="#171717"
            stroke="#737373"
            strokeWidth="1.2"
          />
          {/* Inner Node 'N' Geometric Path */}
          <path
            d="M 8 16 L 8 9 L 16 16 L 16 9"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text x="28" y="16" fill="#888888" fontFamily="var(--font-mono)" fontSize="7" fontWeight="600">
            STDIO
          </text>
        </g>

        {/* Bloated JSON Schema Token Stack */}
        <rect x="10" y="44" width="56" height="5" rx="1.5" fill="#404040" />
        <rect x="10" y="53" width="46" height="5" rx="1.5" fill="#333333" />
        <rect x="10" y="62" width="52" height="5" rx="1.5" fill="#404040" />
        <rect x="10" y="71" width="38" height="5" rx="1.5" fill="#333333" />
        <rect x="10" y="80" width="54" height="5" rx="1.5" fill="#404040" />
        <rect x="10" y="89" width="42" height="5" rx="1.5" fill="#333333" />
        <rect x="10" y="98" width="56" height="5" rx="1.5" fill="#404040" />

        {/* Token Exhaustion Overflow Readout */}
        <text x="38" y="124" fill="#a3a3a3" fontFamily="var(--font-mono)" fontSize="7" textAnchor="middle">
          85k TOKENS
        </text>
        <text x="38" y="135" fill="#525252" fontFamily="var(--font-mono)" fontSize="6" textAnchor="middle">
          CONTEXT EXHAUSTED
        </text>

        {/* Severed Pipe Slashed Circle */}
        <line x1="8" y1="148" x2="68" y2="148" stroke="#525252" strokeWidth="1.5" strokeDasharray="2 3" />
        <g transform="translate(38, 154)">
          <circle cx="0" cy="0" r="7.5" fill="#171717" stroke="#737373" strokeWidth="1.2" />
          <path d="M -2.5 -2.5 L 2.5 2.5 M 2.5 -2.5 L -2.5 2.5" stroke="#737373" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      </g>

      {/* ===================================================
          CENTER: 4 DECLARATIVE RESOLUTION TIERS (STRATIFIED STACK)
          =================================================== */}
      {/* TIER 1: SIGNER / AUTHORITY */}
      <g transform="translate(116, 36)">
        <rect x="0" y="0" width="194" height="34" rx="5" fill="#0f0f0f" stroke="#444444" strokeWidth="1.2" />
        <text x="12" y="21" fill="#737373" fontFamily="var(--font-mono)" fontSize="8.5" fontWeight="700">I</text>
        
        {/* User Keypair Key Glyph */}
        <circle cx="34" cy="17" r="4" stroke="#ffffff" strokeWidth="1.2" fill="none" />
        <line x1="38" y1="17" x2="48" y2="17" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="44" y1="17" x2="44" y2="21" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />

        <text x="56" y="17" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="8" fontWeight="600">
          SIGNER / AUTHORITY
        </text>
        <text x="56" y="26" fill="#737373" fontFamily="var(--font-mono)" fontSize="6.5">
          tx.feePayer
        </text>
      </g>

      {/* TIER 2: PDA SEED DERIVATION */}
      <g transform="translate(116, 78)">
        <rect x="0" y="0" width="194" height="34" rx="5" fill="#121212" stroke="#555555" strokeWidth="1.2" />
        <text x="12" y="21" fill="#737373" fontFamily="var(--font-mono)" fontSize="8.5" fontWeight="700">II</text>
        
        {/* Seed Derivation Chain Glyph */}
        <rect x="28" y="12" width="8" height="10" rx="2" stroke="#ffffff" strokeWidth="1.2" fill="none" />
        <rect x="40" y="12" width="8" height="10" rx="2" stroke="#ffffff" strokeWidth="1.2" fill="none" />
        <line x1="36" y1="17" x2="40" y2="17" stroke="#ffffff" strokeWidth="1.4" />

        <text x="56" y="17" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="8" fontWeight="600">
          PDA DERIVATION
        </text>
        <text x="56" y="26" fill="#737373" fontFamily="var(--font-mono)" fontSize="6.5">
          [b"vault", authority]
        </text>
      </g>

      {/* TIER 3: PROGRAM EXECUTABLE (OFFICIAL SOLANA LOGO) */}
      <g transform="translate(116, 120)">
        <rect x="0" y="0" width="194" height="34" rx="5" fill="#141414" stroke="#777777" strokeWidth="1.2" />
        <text x="12" y="21" fill="#737373" fontFamily="var(--font-mono)" fontSize="8.5" fontWeight="700">III</text>
        
        {/* Official Solana Three-Bar Glyph */}
        <g transform="translate(28, 10) scale(0.7)" fill="#ffffff">
          <path d="M3.9.23c.15-.146.35-.23.554-.23h19.153c.35 0 .525.422.277.67l-3.783 3.783a.785.785 0 0 1-.555.23H.393a.392.392 0 0 1-.277-.67L3.899.229z" />
          <path d="M20.1 7.247a.785.785 0 0 0-.554-.23H.393a.392.392 0 0 0-.277.67l3.783 3.784c.145.145.344.23.555.23h19.153c.35 0 .525-.423.277-.67l-3.783-3.784z" />
          <path d="M3.9 14.355a.785.785 0 0 1 .554-.23h19.153c.35 0 .525.423.277.67l-3.783 3.784a.785.785 0 0 1-.555.23H.393a.392.392 0 0 1-.277-.67l3.783-3.784z" />
        </g>

        <text x="56" y="17" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="8" fontWeight="600">
          PROGRAM EXECUTABLE
        </text>
        <text x="56" y="26" fill="#737373" fontFamily="var(--font-mono)" fontSize="6.5">
          Program ID & BPF
        </text>
      </g>

      {/* TIER 4: SYSTEM & STATE ACCOUNT STORAGE */}
      <g transform="translate(116, 162)">
        <rect x="0" y="0" width="194" height="34" rx="5" fill="#181818" stroke="#ffffff" strokeWidth="1.6" />
        <text x="12" y="21" fill="#737373" fontFamily="var(--font-mono)" fontSize="8.5" fontWeight="700">IV</text>
        
        {/* SPL Token / ATA Database Cylinders */}
        <ellipse cx="38" cy="13" rx="8" ry="3" stroke="#ffffff" strokeWidth="1" fill="#222222" />
        <ellipse cx="38" cy="18" rx="8" ry="3" stroke="#ffffff" strokeWidth="1" fill="#181818" />
        <ellipse cx="38" cy="23" rx="8" ry="3" stroke="#ffffff" strokeWidth="1" fill="#111111" />

        <text x="56" y="17" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="8" fontWeight="600">
          STATE / ATA STORAGE
        </text>
        <text x="56" y="26" fill="#a3a3a3" fontFamily="var(--font-mono)" fontSize="6.5">
          fee-free RPC reads
        </text>
      </g>

      {/* ===================================================
          THE DETERMINISTIC VERTICAL SCANNING PROBE
          Single collimated ray piercing through all 4 tiers
          =================================================== */}
      <line x1="250" y1="20" x2="250" y2="210" stroke="url(#scanBeamGrad)" strokeWidth="2.5" />
      <line x1="246" y1="24" x2="246" y2="206" stroke="#404040" strokeWidth="0.8" strokeDasharray="2 3" />
      <line x1="254" y1="24" x2="254" y2="206" stroke="#404040" strokeWidth="0.8" strokeDasharray="2 3" />

      {/* Optical Alignment Targets at Each Tier Intersection */}
      <g transform="translate(250, 53)">
        <circle cx="0" cy="0" r="8" stroke="#ffffff" strokeWidth="1.2" fill="#0f0f0f" />
        <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
      </g>
      <g transform="translate(250, 95)">
        <circle cx="0" cy="0" r="8" stroke="#ffffff" strokeWidth="1.2" fill="#121212" />
        <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
      </g>
      <g transform="translate(250, 137)">
        <circle cx="0" cy="0" r="8" stroke="#ffffff" strokeWidth="1.2" fill="#141414" />
        <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
      </g>
      <g transform="translate(250, 179)">
        <circle cx="0" cy="0" r="11" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeWidth="1.8" />
        <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
      </g>

      {/* ===================================================
          RIGHT: RESOLVED POINT-IN-TIME STATE DATA LEAF
          =================================================== */}
      <line x1="262" y1="179" x2="330" y2="179" stroke="url(#outputBeamGrad)" strokeWidth="2" />
      <polygon points="328,175 336,179 328,183" fill="#ffffff" />

      {/* Verified Resolution Manifest Card */}
      <g transform="translate(338, 148)">
        <rect x="0" y="0" width="124" height="62" rx="5" fill="#0b0b0b" stroke="#ffffff" strokeWidth="1.6" />

        {/* Crosshair Precision Accents */}
        <path d="M -2 5 L -2 -2 L 5 -2" stroke="#ffffff" strokeWidth="1" />
        <path d="M 126 5 L 126 -2 L 119 -2" stroke="#ffffff" strokeWidth="1" />
        <path d="M -2 57 L -2 64 L 5 64" stroke="#ffffff" strokeWidth="1" />
        <path d="M 126 57 L 126 64 L 119 64" stroke="#ffffff" strokeWidth="1" />

        {/* Instruction Header */}
        <text x="12" y="20" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="8" fontWeight="700" letterSpacing="0.04em">
          RESOLVED ACCOUNTS
        </text>

        {/* Verified Indicator Check */}
        <circle cx="110" cy="17" r="5" fill="#171717" stroke="#ffffff" strokeWidth="1" />
        <path d="M 108 17 L 109.5 18.5 L 112 15.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

        <line x1="10" y1="28" x2="114" y2="28" stroke="#262626" strokeWidth="1" />

        {/* Efficiency Indicators */}
        <g transform="translate(10, 36)">
          <rect x="0" y="0" width="48" height="17" rx="2" fill="#141414" stroke="#404040" strokeWidth="1" />
          <text x="24" y="11.5" fill="#ffffff" fontFamily="var(--font-mono)" fontSize="6.5" fontWeight="600" textAnchor="middle">
            0 TOKENS
          </text>

          <rect x="54" y="0" width="50" height="17" rx="2" fill="#141414" stroke="#404040" strokeWidth="1" />
          <text x="79" y="11.5" fill="#d4d4d4" fontFamily="var(--font-mono)" fontSize="6.5" fontWeight="600" textAnchor="middle">
            RPC READ ✓
          </text>
        </g>
      </g>
    </svg>
  );
}

/* ========================================================
   MAIN COMPONENT
   ======================================================== */
export default function WhyLegacyVsWeb3Mcp() {
  return (
    <section className="why-web3mcp-section" aria-labelledby="whySectionTitle">
      <div className="section-container">
        {/* Section Header */}
        <header className="section-header">
          <h2 id="whySectionTitle" className="section-main-title">
            Why traditional MCP breaks on Solana
          </h2>
          <p className="section-lead-subtitle">
            Off-chain servers break, schemas drift, and hot keys drain vaults. Web3MCP moves tool discovery, schema validation, and simulation directly on-chain.
          </p>
        </header>

        {/* 4 Zigzag Rows */}
        <div className="zigzag-rows-stack">
          {/* ========================================================
              ROW 1: INFRASTRUCTURE FRAGILITY (Text Left, Visual Right)
              ======================================================== */}
          <div className="zigzag-row row-normal">
            <div className="text-col">
              <div className="feature-eyebrow">
                <span className="eyebrow-num">01</span>
                <span className="eyebrow-sep">/</span>
                <span className="eyebrow-title">INFRASTRUCTURE FRAGILITY</span>
                <span className="eyebrow-sub">· DAEMON SPOFS VS ON-CHAIN PDAS</span>
              </div>
              <h3 className="feature-title">The Off-Chain Daemon Trap</h3>
              <p className="feature-desc">
                Standard MCP relies on external Node or Docker containers that crash, timeout, and require hosting fees. Web3MCP anchors tool manifests directly into program-owned Config PDAs discovered over standard Solana RPC.
              </p>
              <div className="comparison-points">
                <div className="point-item point-legacy">
                  <div className="point-icon-box icon-legacy">
                    <X size={12} />
                  </div>
                  <div className="point-text">
                    <strong>External Daemons:</strong> Containers crash, 502, and take autonomous agents offline.
                  </div>
                </div>
                <div className="point-item point-web3mcp">
                  <div className="point-icon-box icon-web3mcp">
                    <Check size={12} />
                  </div>
                  <div className="point-text">
                    <strong>Canonical PDAs:</strong> Direct RPC discovery. Zero servers, zero hosting costs, 100% uptime.
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-col">
              <DiscoverySvg />
            </div>
          </div>

          {/* ========================================================
              ROW 2: SCHEMA INTEGRITY (Visual Left, Text Right)
              ======================================================== */}
          <div className="zigzag-row row-reverse">
            <div className="text-col">
              <div className="feature-eyebrow">
                <span className="eyebrow-num">02</span>
                <span className="eyebrow-sep">/</span>
                <span className="eyebrow-title">SCHEMA INTEGRITY</span>
                <span className="eyebrow-sub">· VERSION DRIFT VS SYSCALL PROOFS</span>
              </div>
              <h3 className="feature-title">Silent Schema Drift</h3>
              <p className="feature-desc">
                When smart contracts upgrade, external servers continue serving stale IDLs, triggering <code>0x1771</code> constraint reverts and burning SOL. Web3MCP validates manifests on-chain via the native <code>sol_sha256</code> syscall, compiling dynamic Borsh codecs at runtime.
              </p>
              <div className="comparison-points">
                <div className="point-item point-legacy">
                  <div className="point-icon-box icon-legacy">
                    <X size={12} />
                  </div>
                  <div className="point-text">
                    <strong>Outdated IDLs:</strong> Stale interfaces cause silent transaction reverts and costly retry loops.
                  </div>
                </div>
                <div className="point-item point-web3mcp">
                  <div className="point-icon-box icon-web3mcp">
                    <Check size={12} />
                  </div>
                  <div className="point-text">
                    <strong>Syscall Parity:</strong> <code>sol_sha256</code> verification guarantees exact runtime bytecode alignment.
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-col">
              <SchemaIntegritySvg />
            </div>
          </div>

          {/* ========================================================
              ROW 3: EXECUTION SECURITY (Text Left, Visual Right)
              ======================================================== */}
          <div className="zigzag-row row-normal">
            <div className="text-col">
              <div className="feature-eyebrow">
                <span className="eyebrow-num">03</span>
                <span className="eyebrow-sep">/</span>
                <span className="eyebrow-title">EXECUTION SECURITY</span>
                <span className="eyebrow-sub">· THE CONFUSED DEPUTY ATTACK</span>
              </div>
              <h3 className="feature-title">Prompt Injections &amp; Hot Keys</h3>
              <p className="feature-desc">
                Giving autonomous agents private keys allows prompt injection attacks to drain treasury vaults with irreversible finality. Web3MCP air-gaps execution: the model proposes parameters, the host simulates balance deltas, and only the user&apos;s wallet signs.
              </p>
              <div className="comparison-points">
                <div className="point-item point-legacy">
                  <div className="point-icon-box icon-legacy">
                    <X size={12} />
                  </div>
                  <div className="point-text">
                    <strong>Autonomous Signing:</strong> Prompt injections trick agents into signing irreversible transfers.
                  </div>
                </div>
                <div className="point-item point-web3mcp">
                  <div className="point-icon-box icon-web3mcp">
                    <Check size={12} />
                  </div>
                  <div className="point-text">
                    <strong>Wallet Air-Gap:</strong> Model proposes, host simulates, user approves. Agents never hold keys.
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-col">
              <ExecutionSeamSvg />
            </div>
          </div>

          {/* ========================================================
              ROW 4: STATE RESOLUTION (Visual Left, Text Right)
              ======================================================== */}
          <div className="zigzag-row row-reverse">
            <div className="text-col">
              <div className="feature-eyebrow">
                <span className="eyebrow-num">04</span>
                <span className="eyebrow-sep">/</span>
                <span className="eyebrow-title">STATE RESOLUTION</span>
                <span className="eyebrow-sub">· STDIO BLOAT VS DECLARATIVE RPC</span>
              </div>
              <h3 className="feature-title">Context Bloat &amp; View Hacks</h3>
              <p className="feature-desc">
                Legacy MCP exhausts LLM context windows with verbose schemas and relies on heavy stdio pipes or synthetic view instructions. Web3MCP resolves accounts deterministically across 4 declarative tiers using signature-free Solana RPC reads.
              </p>
              <div className="comparison-points">
                <div className="point-item point-legacy">
                  <div className="point-icon-box icon-legacy">
                    <X size={12} />
                  </div>
                  <div className="point-text">
                    <strong>Transport Bloat:</strong> Heavy stdio pipes, synthetic view hacks, and token exhaustion.
                  </div>
                </div>
                <div className="point-item point-web3mcp">
                  <div className="point-icon-box icon-web3mcp">
                    <Check size={12} />
                  </div>
                  <div className="point-text">
                    <strong>4-Tier Resolution:</strong> Deterministic account derivation with fee-free RPC reads.
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-col">
              <StateResolutionSvg />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .why-web3mcp-section {
          width: 100%;
          padding: 120px 32px 150px 32px;
          position: relative;
          z-index: 10;
          background: #000000;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .section-container {
          max-width: 1260px;
          margin: 0 auto;
        }

        .section-header {
          max-width: 860px;
          margin: 0 auto 72px auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .section-main-title {
          font-family: var(--font-serif);
          font-size: clamp(2.4rem, 4.2vw, 3.2rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          line-height: 1.15;
          margin: 0 0 18px 0;
        }

        .section-lead-subtitle {
          font-family: var(--font-sans);
          font-size: clamp(1.05rem, 1.4vw, 1.15rem);
          line-height: 1.65;
          color: #a3a3a3;
          max-width: 780px;
          margin: 0;
        }

        /* Zigzag Rows Stack */
        .zigzag-rows-stack {
          display: flex;
          flex-direction: column;
          gap: 120px;
        }

        .zigzag-row {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 70px;
          align-items: center;
        }

        .row-reverse .text-col {
          order: 2;
        }

        .row-reverse .visual-col {
          order: 1;
        }

        /* Text Column */
        .text-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-eyebrow {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #888888;
        }

        .eyebrow-num {
          font-weight: 700;
          color: #a3a3a3;
        }

        .eyebrow-sep {
          color: rgba(255, 255, 255, 0.25);
        }

        .eyebrow-title {
          font-weight: 600;
          color: #e2e8f0;
        }

        .eyebrow-sub {
          color: #737373;
          font-size: 10px;
          letter-spacing: 0.04em;
        }

        .feature-title {
          font-family: var(--font-serif);
          font-size: clamp(1.6rem, 2.4vw, 2.1rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: -0.015em;
          line-height: 1.25;
          margin: 0;
        }

        .feature-desc {
          font-family: var(--font-sans);
          font-size: 15px;
          line-height: 1.65;
          color: #94a3b8;
          margin: 0;
        }

        .feature-desc code {
          font-family: var(--font-mono);
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(56, 189, 248, 0.2);
          padding: 1px 5px;
          border-radius: 2px;
          font-size: 13px;
        }

        /* Comparison Points */
        .comparison-points {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-top: 4px;
        }

        .point-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: 4px;
          font-family: var(--font-sans);
          font-size: 13px;
          line-height: 1.45;
          background: #080808;
          border: 1px solid #1c1c1c;
        }

        .point-legacy {
          color: #a3a3a3;
        }

        .point-legacy strong {
          color: #fca5a5;
        }

        .point-web3mcp {
          color: #e2e8f0;
        }

        .point-web3mcp strong {
          color: #6ee7b7;
        }

        .point-web3mcp code {
          font-family: var(--font-mono);
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.08);
          padding: 1px 4px;
          border-radius: 2px;
          font-size: 12px;
        }

        .point-icon-box {
          width: 18px;
          height: 18px;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #141414;
          color: #a3a3a3;
        }

        /* ========================================================
           FREEFORM SVG VECTOR VISUALS
           ======================================================== */
        .visual-col {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        :global(.feature-vector-svg) {
          width: 100%;
          max-width: 480px;
          height: auto;
          display: block;
          /* No outer box or card outline: floats completely freeform */
          background: transparent;
          filter: drop-shadow(0 0 24px rgba(255, 255, 255, 0.02));
        }

        /* Responsive Layout */
        @media (max-width: 1024px) {
          .zigzag-row {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .row-reverse .text-col {
            order: 1;
          }

          .row-reverse .visual-col {
            order: 2;
          }

          .zigzag-rows-stack {
            gap: 90px;
          }

          .why-web3mcp-section {
            padding: 100px 20px 120px 20px;
          }
        }
      `}</style>
    </section>
  );
}
