import pptxgen from "pptxgenjs";
import { createCanvas } from "@napi-rs/canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. High-Resolution 16:9 Cloud Vignette for Slide 1 (2560 x 1440)
function generateVignetteBackgroundBuffer() {
  const width = 2560;
  const height = 1440;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  const size = 52;
  const cols = Math.ceil(width / size);
  const rows = Math.ceil(height / size);

  const colors = {
    deep: { r: 38, g: 11, b: 24 },
    base: { r: 255, g: 42, b: 133 },
    light: { r: 255, g: 112, b: 184 },
    lightest: { r: 255, g: 184, b: 222 },
  };

  const rgba = (c, a) => `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.max(0, Math.min(1, a))})`;

  const getNoise = (x, y, seed) => {
    const val = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.123) * 43758.5453;
    return val - Math.floor(val);
  };

  const drawDither = (px, py, c1, a1, c2, a2) => {
    const half = size / 2;
    ctx.fillStyle = rgba(c1, a1);
    ctx.fillRect(px, py, size, size);
    ctx.fillStyle = rgba(c2, a2);
    ctx.fillRect(px, py, half, half);
    ctx.fillRect(px + half, py + half, half, half);
  };

  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width * 0.46;
  const radiusY = height * 0.44;

  for (let r = 0; r < rows; r++) {
    const y = r * size + size / 2;
    const dy = (y - centerY) / radiusY;

    for (let c = 0; c < cols; c++) {
      const x = c * size + size / 2;
      const dx = (x - centerX) / radiusX;

      const radialDist = Math.pow(Math.abs(dx), 2.4) + Math.pow(Math.abs(dy), 2.4);
      const angle = Math.atan2(dy, dx);

      const cloudLobe1 = Math.sin(angle * 4.0) * 0.22;
      const cloudLobe2 = Math.cos(angle * 6.0 + 0.8) * 0.15;
      const cellNoise1 = Math.sin(c * 0.35 + r * 0.28) * 0.14;
      const cellNoise2 = Math.cos(c * 0.22 - r * 0.32) * 0.1;

      const effectiveDist = radialDist - (cloudLobe1 + cloudLobe2 + cellNoise1 + cellNoise2);
      const fadeZone = Math.sin(c * 0.16 + 1.1) * 0.5 + Math.cos(r * 0.2 + 0.6) * 0.5;
      const regionalAlpha = fadeZone < -0.2 ? 0.35 : fadeZone > 0.3 ? 0.95 : 0.65;

      if (effectiveDist > 0.88) {
        const depth = effectiveDist - 0.88;
        const noise = getNoise(c, r, 99);
        const px = c * size;
        const py = r * size;

        if (depth > 0.4) {
          const alpha = Math.min(1.0, 0.75 * regionalAlpha + 0.25);
          if (noise > 0.45) {
            ctx.fillStyle = rgba(colors.base, alpha);
          } else if (noise > 0.2) {
            ctx.fillStyle = rgba(colors.light, alpha);
          } else {
            ctx.fillStyle = rgba(colors.deep, alpha * 0.8);
          }
          ctx.fillRect(px, py, size, size);
        } else if (depth > 0.18) {
          const alpha = 0.55 * regionalAlpha;
          if (noise > 0.7) {
            drawDither(px, py, colors.base, alpha, colors.light, alpha * 0.8);
          } else if (noise > 0.35) {
            ctx.fillStyle = rgba(colors.light, alpha);
            ctx.fillRect(px, py, size, size);
          } else {
            ctx.fillStyle = rgba(colors.deep, alpha * 0.6);
            ctx.fillRect(px, py, size, size);
          }
        } else {
          const alpha = 0.3 * regionalAlpha;
          if (noise > 0.65) {
            drawDither(px, py, { r: 0, g: 0, b: 0 }, 1.0, colors.lightest, alpha);
          } else if (noise > 0.35) {
            ctx.fillStyle = rgba(colors.lightest, alpha);
            ctx.fillRect(px, py, size, size);
          }
        }
      }
    }
  }

  return canvas.toBuffer("image/png");
}

async function createDeck() {
  console.log("Generating 4K cloud vignette background for Cover...");
  const bgBuffer = generateVignetteBackgroundBuffer();
  const bgBase64 = "image/png;base64," + bgBuffer.toString("base64");

  const pptx = new pptxgen();

  pptx.layout = "LAYOUT_16x9"; // 10 x 5.625 inches
  pptx.author = "Web3MCP Team";
  pptx.company = "Web3MCP Protocol";
  pptx.title = "Web3MCP — Native On-Chain Tool Discovery for Solana AI Agents";

  // Palette
  const COLOR_PINK = "FF2A85";       // Cyber Neon Pink
  const COLOR_PINK_LIGHT = "FF70B8"; // Bright Rose
  const COLOR_WHITE = "FFFFFF";
  const COLOR_GRAY = "8E929A";
  const COLOR_CARD_BG = "0D0F14";
  const COLOR_CARD_BORDER = "1E232E";
  const COLOR_ALERT_RED = "FF3366";

  // Fonts
  const FONT_TITLE = "Playfair Display";
  const FONT_SANS = "Helvetica";

  // Masters
  pptx.defineSlideMaster({
    title: "COVER_MASTER",
    background: { data: bgBase64 }
  });

  pptx.defineSlideMaster({
    title: "CLEAN_MASTER",
    background: { color: "000000" },
    objects: [
      {
        text: {
          text: "WEB3MCP // SOLANA PROTOCOL",
          options: {
            x: 0.8,
            y: 0.35,
            w: 4.0,
            h: 0.25,
            fontSize: 8,
            fontFace: FONT_SANS,
            bold: true,
            color: "444444",
            charSpacing: 2
          }
        }
      },
      {
        line: {
          x: 0.8,
          y: 5.15,
          w: 8.4,
          h: 0,
          line: { color: "1A1D24", width: 1 }
        }
      },
      {
        text: {
          text: "PROTOCOL SPECIFICATION v0.1.0 · STRICT ON-CHAIN DISCOVERY",
          options: {
            x: 0.8,
            y: 5.25,
            w: 6.0,
            h: 0.25,
            fontSize: 7.5,
            fontFace: FONT_SANS,
            color: "444444",
            charSpacing: 1.5
          }
        }
      }
    ]
  });

  const addHeader = (slide, eyebrow, title) => {
    slide.addText(eyebrow, {
      x: 0.8,
      y: 0.65,
      w: 8.4,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_PINK,
      charSpacing: 3,
      margin: 0
    });

    slide.addText(title, {
      x: 0.8,
      y: 0.95,
      w: 8.4,
      h: 0.75,
      fontSize: 30,
      fontFace: FONT_TITLE,
      color: COLOR_WHITE,
      margin: 0
    });
  };

  // -------------------------------------------------------------
  // SLIDE 1: COVER
  // -------------------------------------------------------------
  const slide1 = pptx.addSlide({ masterName: "COVER_MASTER" });

  slide1.addText("SOLANA PROTOCOL", {
    x: 1.3,
    y: 1.65,
    w: 7.4,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_SANS,
    bold: true,
    color: COLOR_PINK,
    charSpacing: 4,
    margin: 0
  });

  slide1.addText("Web3MCP", {
    x: 1.3,
    y: 1.95,
    w: 7.4,
    h: 1.15,
    fontSize: 64,
    fontFace: FONT_TITLE,
    color: COLOR_WHITE,
    margin: 0
  });

  slide1.addText("Native on-chain tool discovery for AI agents on\nSolana", {
    x: 1.3,
    y: 3.2,
    w: 7.4,
    h: 0.75,
    fontSize: 20,
    fontFace: FONT_SANS,
    color: COLOR_WHITE,
    lineSpacingMultiple: 1.25,
    margin: 0
  });

  slide1.addText("Open-source specification · reference implementation · frozen v0.1", {
    x: 1.3,
    y: 4.15,
    w: 7.4,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT_SANS,
    color: COLOR_GRAY,
    margin: 0
  });

  // -------------------------------------------------------------
  // SLIDE 2: THE PROBLEM (Visual Broken Pipeline)
  // -------------------------------------------------------------
  const slide2 = pptx.addSlide({ masterName: "CLEAN_MASTER" });
  addHeader(slide2, "THE PROBLEM", "The Fragile Off-Chain Model");

  // Diagram Pipeline Nodes
  const nodes = [
    { label: "AI AGENT", sub: "Autonomous LLM", x: 0.8 },
    { label: "OFF-CHAIN SERVER", sub: "Custom API / MCP", x: 3.7 },
    { label: "SOLANA PROGRAM", sub: "Target Smart Contract", x: 6.6 }
  ];

  nodes.forEach(n => {
    slide2.addShape(pptx.ShapeType.rect, {
      x: n.x,
      y: 1.95,
      w: 2.2,
      h: 1.0,
      fill: { color: COLOR_CARD_BG },
      line: { color: COLOR_CARD_BORDER, width: 1.5 }
    });
    slide2.addText(n.label, {
      x: n.x,
      y: 2.15,
      w: 2.2,
      h: 0.35,
      fontSize: 12,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_WHITE,
      align: "center",
      margin: 0
    });
    slide2.addText(n.sub, {
      x: n.x,
      y: 2.5,
      w: 2.2,
      h: 0.3,
      fontSize: 9.5,
      fontFace: FONT_SANS,
      color: COLOR_GRAY,
      align: "center",
      margin: 0
    });
  });

  // Broken Arrows
  slide2.addText("── ❌ ──>", {
    x: 2.95,
    y: 2.25,
    w: 0.85,
    h: 0.4,
    fontSize: 10,
    fontFace: FONT_SANS,
    bold: true,
    color: COLOR_ALERT_RED,
    align: "center",
    margin: 0
  });
  slide2.addText("── ❌ ──>", {
    x: 5.85,
    y: 2.25,
    w: 0.85,
    h: 0.4,
    fontSize: 10,
    fontFace: FONT_SANS,
    bold: true,
    color: COLOR_ALERT_RED,
    align: "center",
    margin: 0
  });

  // 3 Low-Text Impact Callout Cards
  const impactCards = [
    { title: "SILOED ADAPTERS", val: "Bespoke code required per project" },
    { title: "SINGLE POINT OF FAILURE", val: "Server crashes break agent workflows" },
    { title: "ZERO ON-CHAIN PROOF", val: "No cryptographic verification of tools" }
  ];

  impactCards.forEach((c, idx) => {
    const cardX = 0.8 + idx * 2.9;
    slide2.addShape(pptx.ShapeType.rect, {
      x: cardX,
      y: 3.3,
      w: 2.65,
      h: 1.35,
      fill: { color: COLOR_CARD_BG },
      line: { color: COLOR_CARD_BORDER, width: 1 }
    });
    slide2.addText(c.title, {
      x: cardX + 0.2,
      y: 3.55,
      w: 2.25,
      h: 0.35,
      fontSize: 11,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_PINK,
      margin: 0
    });
    slide2.addText(c.val, {
      x: cardX + 0.2,
      y: 3.95,
      w: 2.25,
      h: 0.55,
      fontSize: 10,
      fontFace: FONT_SANS,
      color: COLOR_GRAY,
      margin: 0
    });
  });

  // -------------------------------------------------------------
  // SLIDE 3: THE SOLUTION (Visual Pure On-Chain Architecture)
  // -------------------------------------------------------------
  const slide3 = pptx.addSlide({ masterName: "CLEAN_MASTER" });
  addHeader(slide3, "THE SOLUTION", "Direct On-Chain Discovery");

  // Visual Pipeline: Program -> Config PDA -> RPC -> Host
  const pipeline = [
    { step: "01", name: "TARGET PROGRAM", sub: "Anchor Contract", x: 0.8, w: 2.3 },
    { step: "02", name: "CONFIG PDA", sub: "[\"web3mcp\", \"config\"]", x: 3.4, w: 2.7 },
    { step: "03", name: "GENERIC HOST", sub: "Pure RPC Discovery", x: 6.4, w: 2.8 }
  ];

  pipeline.forEach((p, idx) => {
    slide3.addShape(pptx.ShapeType.rect, {
      x: p.x,
      y: 2.0,
      w: p.w,
      h: 1.25,
      fill: { color: COLOR_CARD_BG },
      line: { color: idx === 1 ? COLOR_PINK : COLOR_CARD_BORDER, width: idx === 1 ? 1.5 : 1 }
    });

    slide3.addText(p.step, {
      x: p.x + 0.2,
      y: 2.15,
      w: 1.0,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_PINK,
      margin: 0
    });

    slide3.addText(p.name, {
      x: p.x + 0.2,
      y: 2.45,
      w: p.w - 0.4,
      h: 0.35,
      fontSize: 13,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_WHITE,
      margin: 0
    });

    slide3.addText(p.sub, {
      x: p.x + 0.2,
      y: 2.8,
      w: p.w - 0.4,
      h: 0.3,
      fontSize: 9.5,
      fontFace: FONT_SANS,
      color: COLOR_GRAY,
      margin: 0
    });
  });

  // Visual Arrows
  slide3.addText("──>", {
    x: 3.05,
    y: 2.45,
    w: 0.4,
    h: 0.3,
    fontSize: 14,
    fontFace: FONT_SANS,
    color: COLOR_PINK,
    align: "center",
    margin: 0
  });
  slide3.addText("──>", {
    x: 6.05,
    y: 2.45,
    w: 0.4,
    h: 0.3,
    fontSize: 14,
    fontFace: FONT_SANS,
    color: COLOR_PINK,
    align: "center",
    margin: 0
  });

  // 3 Architectural Highlights
  const highlights = [
    { title: "ZERO MIDDLEWARE", desc: "No servers, no web scraping, no third-party APIs" },
    { title: "PROGRAM OWNED", desc: "Configuration PDA is strictly owned by the program ID" },
    { title: "STRICT DECOUPLING", desc: "Host never imports program source or IDL (ADR 0007)" }
  ];

  highlights.forEach((h, idx) => {
    const cardX = 0.8 + idx * 2.9;
    slide3.addShape(pptx.ShapeType.rect, {
      x: cardX,
      y: 3.55,
      w: 2.65,
      h: 1.15,
      fill: { color: COLOR_CARD_BG },
      line: { color: COLOR_CARD_BORDER, width: 1 }
    });

    slide3.addText(h.title, {
      x: cardX + 0.2,
      y: 3.75,
      w: 2.25,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_PINK,
      charSpacing: 1.5,
      margin: 0
    });

    slide3.addText(h.desc, {
      x: cardX + 0.2,
      y: 4.1,
      w: 2.25,
      h: 0.45,
      fontSize: 9.5,
      fontFace: FONT_SANS,
      color: COLOR_GRAY,
      margin: 0
    });
  });

  // -------------------------------------------------------------
  // SLIDE 4: SECURITY (Visual Split: Agent vs Wallet)
  // -------------------------------------------------------------
  const slide4 = pptx.addSlide({ masterName: "CLEAN_MASTER" });
  addHeader(slide4, "TRUST BOUNDARY", "The Agent Proposes. The Wallet Signs.");

  // Left Box: Agent Scope
  slide4.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.95,
    w: 3.9,
    h: 2.8,
    fill: { color: "100910" },
    line: { color: "331826", width: 1.5 }
  });

  slide4.addText("AGENT / LLM RUNTIME", {
    x: 1.1,
    y: 2.15,
    w: 3.3,
    h: 0.25,
    fontSize: 9.5,
    fontFace: FONT_SANS,
    bold: true,
    color: COLOR_PINK,
    charSpacing: 1.5,
    margin: 0
  });

  slide4.addText("Untrusted Proposals", {
    x: 1.1,
    y: 2.45,
    w: 3.3,
    h: 0.35,
    fontSize: 15,
    fontFace: FONT_SANS,
    bold: true,
    color: COLOR_WHITE,
    margin: 0
  });

  const leftTags = [
    "✓ Discovers tools via public RPC",
    "✓ Proposes parameters & instructions",
    "✓ Simulates transaction effects",
    "⛔ ZERO SIGNING AUTHORITY"
  ];

  leftTags.forEach((t, idx) => {
    slide4.addText(t, {
      x: 1.1,
      y: 3.0 + idx * 0.38,
      w: 3.3,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_SANS,
      color: idx === 3 ? COLOR_PINK : COLOR_GRAY,
      bold: idx === 3,
      margin: 0
    });
  });

  // Center Hand-off Indicator
  slide4.addText("SIMULATION\nGATEWAY\n───>", {
    x: 4.7,
    y: 2.7,
    w: 0.85,
    h: 0.9,
    fontSize: 7.5,
    fontFace: FONT_SANS,
    bold: true,
    color: COLOR_GRAY,
    align: "center",
    charSpacing: 1.5,
    margin: 0
  });

  // Right Box: Human Wallet
  slide4.addShape(pptx.ShapeType.rect, {
    x: 5.55,
    y: 1.95,
    w: 3.65,
    h: 2.8,
    fill: { color: COLOR_CARD_BG },
    line: { color: COLOR_PINK, width: 1.5 }
  });

  slide4.addText("HUMAN WALLET", {
    x: 5.85,
    y: 2.15,
    w: 3.0,
    h: 0.25,
    fontSize: 9.5,
    fontFace: FONT_SANS,
    bold: true,
    color: COLOR_WHITE,
    charSpacing: 1.5,
    margin: 0
  });

  slide4.addText("Sole Signing Authority", {
    x: 5.85,
    y: 2.45,
    w: 3.0,
    h: 0.35,
    fontSize: 15,
    fontFace: FONT_SANS,
    bold: true,
    color: COLOR_PINK,
    margin: 0
  });

  const rightTags = [
    "✓ Reviews exact accounts & lamports",
    "✓ Inspects simulation & network fee",
    "✓ Explicit human cryptographic sign",
    "⚡ IMMUTABLE CLUSTER BROADCAST"
  ];

  rightTags.forEach((t, idx) => {
    slide4.addText(t, {
      x: 5.85,
      y: 3.0 + idx * 0.38,
      w: 3.0,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_SANS,
      color: idx === 3 ? COLOR_WHITE : COLOR_GRAY,
      bold: idx === 3,
      margin: 0
    });
  });

  // -------------------------------------------------------------
  // SLIDE 5: LIVE ON DEVNET (Giant Stats + Address Chips)
  // -------------------------------------------------------------
  const slide5 = pptx.addSlide({ masterName: "CLEAN_MASTER" });
  addHeader(slide5, "LIVE ON DEVNET", "Proven On-Chain Reference Program");

  // 3 Giant Stats
  const statChips = [
    { num: "9", label: "CHUNKS STREAMED" },
    { num: "6.7KB", label: "IDL & TOOL MANIFEST" },
    { num: "100%", label: "SHA-256 INTEGRITY" }
  ];

  statChips.forEach((s, idx) => {
    const cardX = 0.8 + idx * 2.9;
    slide5.addShape(pptx.ShapeType.rect, {
      x: cardX,
      y: 1.95,
      w: 2.65,
      h: 1.15,
      fill: { color: COLOR_CARD_BG },
      line: { color: COLOR_CARD_BORDER, width: 1 }
    });
    slide5.addText(s.num, {
      x: cardX + 0.2,
      y: 2.1,
      w: 2.25,
      h: 0.55,
      fontSize: 32,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_PINK,
      margin: 0
    });
    slide5.addText(s.label, {
      x: cardX + 0.2,
      y: 2.7,
      w: 2.25,
      h: 0.25,
      fontSize: 8.5,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_GRAY,
      charSpacing: 1.5,
      margin: 0
    });
  });

  // On-Chain Address Block
  slide5.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 3.35,
    w: 8.4,
    h: 1.45,
    fill: { color: COLOR_CARD_BG },
    line: { color: COLOR_CARD_BORDER, width: 1 }
  });

  slide5.addText("PROGRAM ID", { x: 1.1, y: 3.55, w: 2.2, h: 0.25, fontSize: 8.5, fontFace: FONT_SANS, bold: true, color: COLOR_PINK, charSpacing: 1.5, margin: 0 });
  slide5.addText("GgVnzvsMhHHKeeGnqQhU9KAjBeCVhYiYmR17174Lyrgv", { x: 3.2, y: 3.55, w: 5.7, h: 0.25, fontSize: 10, fontFace: FONT_SANS, color: COLOR_WHITE, margin: 0 });

  slide5.addText("CONFIG PDA", { x: 1.1, y: 3.9, w: 2.2, h: 0.25, fontSize: 8.5, fontFace: FONT_SANS, bold: true, color: COLOR_PINK, charSpacing: 1.5, margin: 0 });
  slide5.addText("HfA1ExZS1cgYR5k5GEJmsQfyAcDK2J9NPi7p97dU3WLD  (seeds: [\"web3mcp\", \"config\"])", { x: 3.2, y: 3.9, w: 5.7, h: 0.25, fontSize: 10, fontFace: FONT_SANS, color: COLOR_WHITE, margin: 0 });

  slide5.addText("VERIFIED TOOLS", { x: 1.1, y: 4.25, w: 2.2, h: 0.25, fontSize: 8.5, fontFace: FONT_SANS, bold: true, color: COLOR_PINK, charSpacing: 1.5, margin: 0 });
  slide5.addText("get_vault (read) · initialize, deposit, withdraw (instructions)", { x: 3.2, y: 4.25, w: 5.7, h: 0.25, fontSize: 10, fontFace: FONT_SANS, color: COLOR_GRAY, margin: 0 });

  // -------------------------------------------------------------
  // SLIDE 6: ROADMAP (Visual Stepped Pipeline)
  // -------------------------------------------------------------
  const slide6 = pptx.addSlide({ masterName: "CLEAN_MASTER" });
  addHeader(slide6, "ROADMAP", "From Protocol Freeze to Production");

  const phases = [
    { num: "01", name: "SPEC v0.1", tag: "FROZEN", color: COLOR_PINK },
    { num: "02", name: "VAULT", tag: "DEVNET", color: COLOR_PINK },
    { num: "03", name: "HOST", tag: "ACTIVE", color: COLOR_WHITE },
    { num: "04", name: "WALLET", tag: "NEXT", color: COLOR_GRAY },
    { num: "05", name: "DEMO", tag: "Q1", color: COLOR_GRAY }
  ];

  phases.forEach((p, idx) => {
    const cardX = 0.8 + idx * 1.72;

    slide6.addShape(pptx.ShapeType.rect, {
      x: cardX,
      y: 2.1,
      w: 1.55,
      h: 2.5,
      fill: { color: COLOR_CARD_BG },
      line: { color: p.color === COLOR_PINK ? COLOR_PINK : COLOR_CARD_BORDER, width: p.color === COLOR_PINK ? 1.5 : 1 }
    });

    slide6.addText(p.num, {
      x: cardX + 0.15,
      y: 2.3,
      w: 1.25,
      h: 0.45,
      fontSize: 24,
      fontFace: FONT_SANS,
      bold: true,
      color: p.color,
      margin: 0
    });

    slide6.addText(p.tag, {
      x: cardX + 0.15,
      y: 2.85,
      w: 1.25,
      h: 0.25,
      fontSize: 8.5,
      fontFace: FONT_SANS,
      bold: true,
      color: p.color,
      charSpacing: 1.5,
      margin: 0
    });

    slide6.addText(p.name, {
      x: cardX + 0.15,
      y: 3.25,
      w: 1.25,
      h: 0.45,
      fontSize: 13,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_WHITE,
      margin: 0
    });
  });

  // -------------------------------------------------------------
  // SLIDE 7: CLOSING (Minimal Visual Action Tiles)
  // -------------------------------------------------------------
  const slide7 = pptx.addSlide({ masterName: "CLEAN_MASTER" });

  slide7.addText("THE OPEN STANDARD", {
    x: 0.8,
    y: 1.4,
    w: 8.4,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT_SANS,
    bold: true,
    color: COLOR_PINK,
    charSpacing: 4,
    margin: 0
  });

  slide7.addText("Build with Web3MCP", {
    x: 0.8,
    y: 1.75,
    w: 8.4,
    h: 1.1,
    fontSize: 56,
    fontFace: FONT_TITLE,
    color: COLOR_WHITE,
    margin: 0
  });

  slide7.addText("Native on-chain tool discovery for AI agents on Solana.", {
    x: 0.8,
    y: 2.95,
    w: 8.0,
    h: 0.45,
    fontSize: 18,
    fontFace: FONT_SANS,
    color: COLOR_WHITE,
    margin: 0
  });

  const links = [
    { label: "GITHUB REPOSITORY", val: "github.com/Team-Managed/Web3MCP" },
    { label: "PROTOCOL SPEC", val: "protocol/SPEC.md" },
    { label: "LICENSE", val: "Apache 2.0 Open Source" }
  ];

  links.forEach((l, idx) => {
    const cardX = 0.8 + idx * 2.9;
    slide7.addShape(pptx.ShapeType.rect, {
      x: cardX,
      y: 3.75,
      w: 2.65,
      h: 0.95,
      fill: { color: COLOR_CARD_BG },
      line: { color: COLOR_CARD_BORDER, width: 1 }
    });

    slide7.addText(l.label, {
      x: cardX + 0.2,
      y: 3.95,
      w: 2.25,
      h: 0.25,
      fontSize: 8,
      fontFace: FONT_SANS,
      bold: true,
      color: COLOR_PINK,
      charSpacing: 1.5,
      margin: 0
    });

    slide7.addText(l.val, {
      x: cardX + 0.2,
      y: 4.25,
      w: 2.25,
      h: 0.35,
      fontSize: 11,
      fontFace: FONT_SANS,
      color: COLOR_WHITE,
      margin: 0
    });
  });

  const outputPath = path.join(__dirname, "../Web3MCP_Pitch_Deck.pptx");
  await pptx.writeFile({ fileName: outputPath });
  console.log(`Successfully generated pitch deck at: ${outputPath}`);
}

createDeck().catch(err => {
  console.error("Error generating deck:", err);
  process.exit(1);
});
