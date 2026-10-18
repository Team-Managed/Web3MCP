"use client";

import React, { useEffect, useRef } from "react";

interface PixelBlock {
  c: number;
  r: number;
  x: number;
  targetY: number;
  startY: number;
  currentY: number;
  width: number;
  height: number;
  delay: number;
  duration: number;
  targetAlpha: number;
  currentAlpha: number;
  isDither: boolean;
  c1: { r: number; g: number; b: number };
  c2?: { r: number; g: number; b: number };
  a2?: number;
  settled: boolean;
}

interface PixelCanvasProps {
  triggerOnView?: boolean;
  density?: "normal" | "low";
  transparentBg?: boolean;
  isStatic?: boolean;
}

export default function PixelCanvas({
  triggerOnView = false,
  density = "normal",
  transparentBg = false,
  isStatic = false,
}: PixelCanvasProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let started = !triggerOnView;
    let animId: number;
    let blocks: PixelBlock[] = [];
    let startTime = performance.now();

    const rgba = (c: { r: number; g: number; b: number }, a: number) =>
      `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Math.max(0, Math.min(1, a))})`;

    // Dynamic color palette per column: Official Solana Purple (#9945FF) -> Solana Cyan (#00C2FF) -> Solana Green (#14F195)
    const getColorPalette = (ratioX: number) => {
      const purple = {
        deep: { r: 42, g: 10, b: 80 },
        base: { r: 153, g: 69, b: 255 }, // Canonical Solana Purple #9945FF
        light: { r: 185, g: 115, b: 255 }, // Solana Lavender #B973FF
        lightest: { r: 220, g: 180, b: 255 }, // Solana Glow #DCB4FF
      };

      const blue = {
        deep: { r: 8, g: 45, b: 85 },
        base: { r: 0, g: 194, b: 255 }, // Solana Electric Cyan #00C2FF
        light: { r: 56, g: 215, b: 255 }, // #38D7FF
        lightest: { r: 140, g: 235, b: 255 }, // #8CEBFF
      };

      const green = {
        deep: { r: 5, g: 65, b: 45 },
        base: { r: 20, g: 241, b: 149 }, // Canonical Solana Green #14F195
        light: { r: 70, g: 255, b: 180 }, // Solana Neon Mint #46FFB4
        lightest: { r: 175, g: 255, b: 220 }, // Solana Mint Glow #AFFFDC
      };

      const lerpColor = (
        c1: { r: number; g: number; b: number },
        c2: { r: number; g: number; b: number },
        t: number
      ) => ({
        r: c1.r * (1 - t) + c2.r * t,
        g: c1.g * (1 - t) + c2.g * t,
        b: c1.b * (1 - t) + c2.b * t,
      });

      if (ratioX < 0.38) {
        const t = Math.max(0, (ratioX - 0.12) / 0.26);
        return {
          deep: lerpColor(purple.deep, blue.deep, t),
          base: lerpColor(purple.base, blue.base, t),
          light: lerpColor(purple.light, blue.light, t),
          lightest: lerpColor(purple.lightest, blue.lightest, t),
        };
      } else if (ratioX < 0.65) {
        const t = (ratioX - 0.38) / 0.27;
        return {
          deep: lerpColor(blue.deep, green.deep, t),
          base: lerpColor(blue.base, green.base, t),
          light: lerpColor(blue.light, green.light, t),
          lightest: lerpColor(blue.lightest, green.lightest, t),
        };
      } else {
        return green;
      }
    };

    const getNoise = (x: number, y: number, seed: number) => {
      const val = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.123) * 43758.5453;
      return val - Math.floor(val);
    };

    // Smooth bounce easing function for falling blocks snapping into the grid
    const easeOutBounce = (x: number): number => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (x < 1 / d1) {
        return n1 * x * x;
      } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
      } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
      } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
      }
    };

    const initBlocks = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Sizing calibrated to cover full viewport width and height without any clipped blocks
      const targetSize = Math.max(38, Math.min(50, Math.floor(width / 32)));
      const cols = Math.max(12, Math.round(width / targetSize));
      const rows = Math.max(6, Math.round(height / targetSize));
      const blockW = width / cols;
      const blockH = height / rows;

      const newBlocks: PixelBlock[] = [];

      const isLowDensity = density === "low";
      const distThreshold = isLowDensity ? 0.94 : 0.82;
      const alphaScale = isLowDensity ? 0.4 : 1.0;

      for (let r = 0; r < rows; r++) {
        // Normalized Y distance from center (0 at center, ~1.0 at top/bottom edge)
        const normY = Math.abs((r + 0.5) - rows / 2) / (rows / 2);

        for (let c = 0; c < cols; c++) {
          // Normalized X distance from center (0 at center, ~1.0 at left/right edge)
          const normX = Math.abs((c + 0.5) - cols / 2) / (cols / 2);
          const ratioX = c / cols;
          const colors = getColorPalette(ratioX);

          // Superellipse framing: ~1.0 at all four edges, > 1.2 in corners, ~0 in center
          const frameDist = Math.pow(Math.pow(normX, 3.0) + Math.pow(normY, 3.0), 1 / 3.0);
          const angle = Math.atan2((r + 0.5) - rows / 2, (c + 0.5) - cols / 2);

          // Organic harmonic cloud lobes & cell perturbation
          const lobe1 = Math.sin(angle * 4.0) * 0.14;
          const lobe2 = Math.cos(angle * 6.0 + 0.8) * 0.09;
          const cellNoise1 = Math.sin(c * 0.35 + r * 0.28) * 0.12;
          const cellNoise2 = Math.cos(c * 0.22 - r * 0.32) * 0.08;

          const totalPerturbation = lobe1 + lobe2 + cellNoise1 + cellNoise2;
          const effectiveDist = frameDist - totalPerturbation;

          // Regional atmospheric fading
          const fadeZone = Math.sin(c * 0.16 + 1.1) * 0.5 + Math.cos(r * 0.2 + 0.6) * 0.5;
          const regionalAlpha = fadeZone < -0.2 ? 0.4 : fadeZone > 0.3 ? 0.95 : 0.7;

          // Threshold for spawning frame blocks
          if (effectiveDist > distThreshold) {
            const depth = effectiveDist - distThreshold;
            const noise = getNoise(c, r, 99);
            if (isLowDensity && noise < 0.45) continue;
            const targetX = c * blockW;
            const targetY = r * blockH;

            // Staggered falling delay: cascade from top and edges inward
            const colRatio = Math.abs(c - cols / 2) / (cols / 2);
            const delay = (r / rows) * 450 + colRatio * 350 + Math.random() * 450;
            const duration = 850 + Math.random() * 400;
            const startY = -blockH * 3 - Math.random() * (height * 0.5);

            // Outer cloud clusters (highest density)
            if (depth > 0.3) {
              const alpha = Math.min(1.0, 0.75 * regionalAlpha + 0.25) * alphaScale;
              const color =
                noise > 0.45 ? colors.base : noise > 0.2 ? colors.light : colors.deep;

              newBlocks.push({
                c,
                r,
                x: targetX,
                targetY,
                startY,
                currentY: startY,
                width: blockW,
                height: blockH,
                delay,
                duration,
                targetAlpha: alpha,
                currentAlpha: 0,
                isDither: false,
                c1: color,
                settled: false,
              });
            }
            // Mid-cloud billows (faded with dither)
            else if (depth > 0.12) {
              const alpha = 0.55 * regionalAlpha * alphaScale;
              if (noise > 0.7) {
                newBlocks.push({
                  c,
                  r,
                  x: targetX,
                  targetY,
                  startY,
                  currentY: startY,
                  width: blockW,
                  height: blockH,
                  delay,
                  duration,
                  targetAlpha: alpha,
                  currentAlpha: 0,
                  isDither: true,
                  c1: colors.base,
                  c2: colors.light,
                  a2: alpha * 0.8,
                  settled: false,
                });
              } else if (noise > 0.35) {
                newBlocks.push({
                  c,
                  r,
                  x: targetX,
                  targetY,
                  startY,
                  currentY: startY,
                  width: blockW,
                  height: blockH,
                  delay,
                  duration,
                  targetAlpha: alpha,
                  currentAlpha: 0,
                  isDither: false,
                  c1: colors.light,
                  settled: false,
                });
              } else if (noise > 0.15) {
                newBlocks.push({
                  c,
                  r,
                  x: targetX,
                  targetY,
                  startY,
                  currentY: startY,
                  width: blockW,
                  height: blockH,
                  delay,
                  duration,
                  targetAlpha: alpha,
                  currentAlpha: 0,
                  isDither: true,
                  c1: colors.light,
                  c2: colors.lightest,
                  a2: alpha * 0.7,
                  settled: false,
                });
              } else {
                newBlocks.push({
                  c,
                  r,
                  x: targetX,
                  targetY,
                  startY,
                  currentY: startY,
                  width: blockW,
                  height: blockH,
                  delay,
                  duration,
                  targetAlpha: alpha * 0.6,
                  currentAlpha: 0,
                  isDither: false,
                  c1: colors.deep,
                  settled: false,
                });
              }
            }
            // Inner cloud wisps
            else {
              const alpha = 0.32 * regionalAlpha;
              if (noise > 0.6) {
                newBlocks.push({
                  c,
                  r,
                  x: targetX,
                  targetY,
                  startY,
                  currentY: startY,
                  width: blockW,
                  height: blockH,
                  delay,
                  duration,
                  targetAlpha: alpha,
                  currentAlpha: 0,
                  isDither: true,
                  c1: { r: 0, g: 0, b: 0 },
                  c2: colors.lightest,
                  a2: alpha,
                  settled: false,
                });
              } else if (noise > 0.3) {
                newBlocks.push({
                  c,
                  r,
                  x: targetX,
                  targetY,
                  startY,
                  currentY: startY,
                  width: blockW,
                  height: blockH,
                  delay,
                  duration,
                  targetAlpha: alpha,
                  currentAlpha: 0,
                  isDither: false,
                  c1: colors.lightest,
                  settled: false,
                });
              }
            }
          }
        }
      }

      if (isStatic) {
        for (let i = 0; i < newBlocks.length; i++) {
          const b = newBlocks[i];
          b.startY = b.targetY;
          b.currentY = b.targetY;
          b.currentAlpha = b.targetAlpha;
          b.settled = true;
        }
      }

      blocks = newBlocks;
      startTime = performance.now();
    };

    const drawDitherBlock = (
      px: number,
      py: number,
      w: number,
      h: number,
      c1: { r: number; g: number; b: number },
      a1: number,
      c2: { r: number; g: number; b: number },
      a2: number
    ) => {
      const halfW = w / 2;
      const halfH = h / 2;
      ctx.fillStyle = rgba(c1, a1);
      ctx.fillRect(px, py, w, h);
      ctx.fillStyle = rgba(c2, a2);
      ctx.fillRect(px, py, halfW, halfH);
      ctx.fillRect(px + halfW, py + halfH, halfW, halfH);
    };

    const drawStaticFrame = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      if (width <= 0 || height <= 0) return;

      if (transparentBg) {
        ctx.clearRect(0, 0, width, height);
      } else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }

      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (b.isDither && b.c2 && b.a2 !== undefined) {
          drawDitherBlock(b.x, b.targetY, b.width, b.height, b.c1, b.targetAlpha, b.c2, b.a2);
        } else {
          ctx.fillStyle = rgba(b.c1, b.targetAlpha);
          ctx.fillRect(b.x, b.targetY, b.width, b.height);
        }
      }
    };

    const animate = (currentTime: number) => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;

      // Clear canvas base
      if (transparentBg) {
        ctx.clearRect(0, 0, width, height);
      } else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }

      if (!started) {
        animId = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - startTime;

      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];

        if (elapsed < b.delay) {
          // Block hasn't started falling yet
          continue;
        }

        const t = Math.min(1, (elapsed - b.delay) / b.duration);

        if (t < 1) {
          // In motion: falling with bounce easing into place
          b.currentY = b.startY + (b.targetY - b.startY) * easeOutBounce(t);
          b.currentAlpha = b.targetAlpha * Math.min(1, t * 1.8);
        } else {
          // Settled in final arranged position
          b.settled = true;
          b.currentY = b.targetY;
          // Subtle organic ambient shimmer
          const shimmer = Math.sin(currentTime * 0.002 + b.c * 0.3 + b.r * 0.25) * 0.08;
          b.currentAlpha = Math.max(0.05, Math.min(1.0, b.targetAlpha * (0.95 + shimmer)));
        }

        if (b.isDither && b.c2 && b.a2 !== undefined) {
          drawDitherBlock(b.x, b.currentY, b.width, b.height, b.c1, b.currentAlpha, b.c2, b.a2);
        } else {
          ctx.fillStyle = rgba(b.c1, b.currentAlpha);
          ctx.fillRect(b.x, b.currentY, b.width, b.height);
        }
      }

      animId = requestAnimationFrame(animate);
    };

    initBlocks();
    if (isStatic) {
      drawStaticFrame();
    } else {
      animId = requestAnimationFrame(animate);
    }

    const handleResize = () => {
      initBlocks();
      if (isStatic) {
        drawStaticFrame();
      }
    };

    window.addEventListener("resize", handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            initBlocks();
            if (isStatic) {
              drawStaticFrame();
            }
          }
        }
      });
      resizeObserver.observe(canvas.parentElement);
    }

    let io: IntersectionObserver | null = null;
    if (triggerOnView && typeof IntersectionObserver !== "undefined" && canvas.parentElement) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !started) {
              started = true;
              startTime = performance.now();
              initBlocks();
              if (isStatic) {
                drawStaticFrame();
              }
            }
          }
        },
        { threshold: 0.1 }
      );
      io.observe(canvas.parentElement);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (io) {
        io.disconnect();
      }
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
        backgroundColor: transparentBg ? "transparent" : "#000000",
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
