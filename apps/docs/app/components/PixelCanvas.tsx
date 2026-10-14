"use client";

import React, { useEffect, useRef } from "react";

export default function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Solid pitch black base
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Clean, large pixel blocks matching the slide deck proportions
      const size = Math.max(38, Math.min(52, Math.floor(width / 32)));
      const cols = Math.ceil(width / size);
      const rows = Math.ceil(height / size);

      // Cyber Neon Pink Palette
      const colors = {
        deep: { r: 38, g: 11, b: 24 },       // Deep shadow plum #260B18
        base: { r: 255, g: 42, b: 133 },    // Shade 1: Cyber Neon Pink #FF2A85
        light: { r: 255, g: 112, b: 184 },  // Shade 2: Bright Rose #FF70B8
        lightest: { r: 255, g: 184, b: 222 },// Shade 3: Soft Blush #FFB8DE
      };

      const rgba = (c: { r: number; g: number; b: number }, a: number) =>
        `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.max(0, Math.min(1, a))})`;

      const getNoise = (x: number, y: number, seed: number) => {
        const val = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.123) * 43758.5453;
        return val - Math.floor(val);
      };

      // 2x2 Dither checkerboard sub-pixels
      const drawDither = (
        px: number,
        py: number,
        c1: { r: number; g: number; b: number },
        a1: number,
        c2: { r: number; g: number; b: number },
        a2: number
      ) => {
        const half = size / 2;
        ctx.fillStyle = rgba(c1, a1);
        ctx.fillRect(px, py, size, size);
        ctx.fillStyle = rgba(c2, a2);
        ctx.fillRect(px, py, half, half);
        ctx.fillRect(px + half, py + half, half, half);
      };

      const centerX = width / 2;
      const centerY = height / 2;
      // Generous safe radius: keeps the entire center 75%-80% open and unobstructed
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

          // Multi-frequency harmonic cloud lobes
          const cloudLobe1 = Math.sin(angle * 4.0) * 0.22;
          const cloudLobe2 = Math.cos(angle * 6.0 + 0.8) * 0.15;
          const cellNoise1 = Math.sin(c * 0.35 + r * 0.28) * 0.14;
          const cellNoise2 = Math.cos(c * 0.22 - r * 0.32) * 0.1;

          const totalPerturbation = cloudLobe1 + cloudLobe2 + cellNoise1 + cellNoise2;
          const effectiveDist = radialDist - totalPerturbation;

          // Regional atmospheric fading
          const fadeZone = Math.sin(c * 0.16 + 1.1) * 0.5 + Math.cos(r * 0.2 + 0.6) * 0.5;
          const regionalAlpha = fadeZone < -0.2 ? 0.35 : fadeZone > 0.3 ? 0.95 : 0.65;

          // Cloud perimeter threshold (matching deck generator)
          if (effectiveDist > 0.88) {
            const depth = effectiveDist - 0.88;
            const noise = getNoise(c, r, 99);
            const px = c * size;
            const py = r * size;

            // Outer cloud clusters (highest density)
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
            }
            // Mid-cloud billows (faded with dither)
            else if (depth > 0.18) {
              const alpha = 0.55 * regionalAlpha;
              if (noise > 0.7) {
                drawDither(px, py, colors.base, alpha, colors.light, alpha * 0.8);
              } else if (noise > 0.35) {
                ctx.fillStyle = rgba(colors.light, alpha);
                ctx.fillRect(px, py, size, size);
              } else if (noise > 0.15) {
                drawDither(px, py, colors.light, alpha, colors.lightest, alpha * 0.7);
              } else {
                ctx.fillStyle = rgba(colors.deep, alpha * 0.6);
                ctx.fillRect(px, py, size, size);
              }
            }
            // Inner cloud wisps
            else {
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
    };

    render();
    window.addEventListener("resize", render);

    return () => {
      window.removeEventListener("resize", render);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        backgroundColor: "#000000",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
