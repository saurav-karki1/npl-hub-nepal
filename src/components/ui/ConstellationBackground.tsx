"use client";

/**
 * ConstellationBackground
 *
 * Kinetic mesh canvas background with Hooke's Law spring-mass physics,
 * adapted from 21st.dev Constellation Grid by daiv09 for NPL Hub Nepal.
 *
 * Design guidelines:
 *   - Completely transparent canvas layer — parent hero/container controls the background color
 *   - NPL brand palette: subtle mint nodes (brand-light), understated gold accents,
 *     and connecting lines
 *   - Hooke's Law spring elasticity (F = -k * x) with velocity damping
 *   - Responsive, elastic cursor shockwave: nodes displace away and spring back
 *   - Non-blocking: canvas is pointer-events-none; global pointer tracker captures
 *     movement relative to container so all nested buttons, links, and text remain interactive
 */

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ConstellationBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  /** Grid spacing in pixels (default: 55px) */
  gridSpacing?: number;
  /** Maximum line opacity (default: 0.12) */
  lineOpacity?: number;
  /** Enable cursor spring reaction (default: true) */
  interactive?: boolean;
}

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
  isAccent: boolean;
}

export function ConstellationBackground({
  children,
  className,
  gridSpacing = 55,
  lineOpacity = 0.12,
  interactive = true,
  ...props
}: ConstellationBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Pure transparent canvas — let parent container control background color
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Mouse velocity & position tracking (240px interaction radius)
    const mouse = {
      x: -1000,
      y: -1000,
      prevX: -1000,
      prevY: -1000,
      vx: 0,
      vy: 0,
      radius: 240,
    };

    let gridCols = 0;
    let gridRows = 0;
    let nodes: Node[] = [];

    // NPL brand colors: Mint (#e8f5ef) and Trophy Gold (#c89f2a)
    const normalColor = "232, 245, 239";
    const accentColor = "200, 159, 42";

    const initGrid = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Adaptive spacing: slightly wider on small mobile screens
      const effectiveSpacing = width < 640 ? Math.max(gridSpacing, 65) : gridSpacing;
      gridCols = Math.ceil(width / effectiveSpacing) + 1;
      gridRows = Math.ceil(height / effectiveSpacing) + 1;

      nodes = [];
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const baseX = c * effectiveSpacing;
          const baseY = r * effectiveSpacing;

          // ~12% deterministic accent nodes (gold)
          const isAccent = (c * 17 + r * 31) % 8 === 0;

          nodes.push({
            x: baseX,
            y: baseY,
            baseX,
            baseY,
            vx: 0,
            vy: 0,
            radius: isAccent ? 1.8 : 1.3 + ((c + r) % 3) * 0.25,
            pulse: ((c * 13 + r * 7) % 100) * 0.0628,
            isAccent,
          });
        }
      }
    };

    initGrid();

    // Hooke's Law physics parameters
    const SPRING_K = 18;    // Spring stiffness
    const DAMPING = 0.82;   // Velocity resistance damping
    const effectiveSpacing = width < 640 ? Math.max(gridSpacing, 65) : gridSpacing;
    const maxLineDist = effectiveSpacing * 1.42;
    const maxLineDistSq = maxLineDist * maxLineDist;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Mouse velocity calculation
      if (interactive && mouse.x > -500) {
        mouse.vx = (mouse.x - mouse.prevX) / (dt * 1000 || 1);
        mouse.vy = (mouse.y - mouse.prevY) / (dt * 1000 || 1);
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y;
      } else {
        mouse.vx = 0;
        mouse.vy = 0;
      }

      const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);

      // Transparent frame wipe
      ctx.clearRect(0, 0, width, height);

      // Node Physics Engine (Hooke's Law Spring-Mass-Damping system)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulse += dt * 2.8;

        // Dynamic shockwave repulsion based on proximity and cursor speed
        if (interactive && mouse.x > -500) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const power = 1 - dist / mouse.radius;
            // Clearly perceptible shockwave: deflecting 15-25px,
            // while Hooke's Law spring elasticity pulls them gracefully back
            const force = power * (1200 + Math.min(speed, 20) * 80);
            const angle = Math.atan2(dy, dx);

            n.vx -= Math.cos(angle) * force * dt;
            n.vy -= Math.sin(angle) * force * dt;
          }
        }

        // Restoring force back to home anchor point (baseX, baseY)
        const homeDx = n.baseX - n.x;
        const homeDy = n.baseY - n.y;

        n.vx += homeDx * SPRING_K * dt;
        n.vy += homeDy * SPRING_K * dt;

        // Damping
        n.vx *= DAMPING;
        n.vy *= DAMPING;

        // Integrate position
        n.x += n.vx * dt * 60;
        n.y += n.vy * dt * 60;
      }

      // Draw Connections (Structured O(N) neighbor check)
      ctx.lineWidth = 0.65;
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const idx = r * gridCols + c;
          const n = nodes[idx];
          if (!n) continue;

          // Connect right
          if (c + 1 < gridCols) {
            const rightNode = nodes[idx + 1];
            const ndx = n.x - rightNode.x;
            const ndy = n.y - rightNode.y;
            const distSq = ndx * ndx + ndy * ndy;

            if (distSq < maxLineDistSq) {
              const nDist = Math.sqrt(distSq);
              const alpha = (1 - nDist / maxLineDist) * lineOpacity;
              ctx.strokeStyle = `rgba(${normalColor}, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y);
              ctx.lineTo(rightNode.x, rightNode.y);
              ctx.stroke();
            }
          }

          // Connect down
          if (r + 1 < gridRows) {
            const downNode = nodes[idx + gridCols];
            const ndx = n.x - downNode.x;
            const ndy = n.y - downNode.y;
            const distSq = ndx * ndx + ndy * ndy;

            if (distSq < maxLineDistSq) {
              const nDist = Math.sqrt(distSq);
              const alpha = (1 - nDist / maxLineDist) * lineOpacity;
              ctx.strokeStyle = `rgba(${normalColor}, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(nodeDown(idx, gridCols, nodes)?.x ?? n.x, nodeDown(idx, gridCols, nodes)?.y ?? n.y);
              ctx.stroke();
            }
          }

          // Diagonal connection for dynamic mesh feel
          if (c + 1 < gridCols && r + 1 < gridRows) {
            const diagNode = nodes[idx + gridCols + 1];
            const ndx = n.x - diagNode.x;
            const ndy = n.y - diagNode.y;
            const distSq = ndx * ndx + ndy * ndy;

            if (distSq < maxLineDistSq * 1.05) {
              const nDist = Math.sqrt(distSq);
              const alpha = (1 - nDist / (maxLineDist * 1.02)) * (lineOpacity * 0.4);
              if (alpha > 0.005) {
                ctx.strokeStyle = `rgba(${normalColor}, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(n.x, n.y);
                ctx.lineTo(diagNode.x, diagNode.y);
                ctx.stroke();
              }
            }
          }
        }
      }

      // Render Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        let isNear = false;
        let dist = 9999;

        if (interactive && mouse.x > -500) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            isNear = true;
          }
        }

        const pulseScale = Math.sin(n.pulse) * 0.15;
        // Expanded radius when near cursor for clear visual feedback
        const currentRadius = isNear
          ? n.radius * 1.75
          : Math.max(0.5, n.radius + pulseScale);

        // Bright, luminous feedback for interacting nodes
        const baseAlpha = isNear
          ? 0.95
          : n.isAccent
          ? 0.5 + Math.sin(n.pulse) * 0.1
          : 0.25 + Math.sin(n.pulse) * 0.08;

        const colorStr = isNear ? "255, 255, 255" : n.isAccent ? accentColor : normalColor;

        ctx.fillStyle = `rgba(${colorStr}, ${baseAlpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle highlight ring around immediate focal nodes
        if (isNear && dist < 85) {
          const ringAlpha = (1 - dist / 85) * 0.4;
          ctx.strokeStyle = `rgba(${accentColor}, ${ringAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(n.x, n.y, currentRadius + 3.5, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Helper for connecting down
    function nodeDown(idx: number, cols: number, list: Node[]) {
      return list[idx + cols];
    }

    // Non-blocking pointer tracking: listen on window and compute relative coordinates
    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;

      // Allow 40px outer margin so edge nodes deflect naturally before cursor fully enters
      if (
        relX >= -40 &&
        relX <= rect.width + 40 &&
        relY >= -40 &&
        relY <= rect.height + 40
      ) {
        if (mouse.x < -500) {
          mouse.prevX = relX;
          mouse.prevY = relY;
          mouse.vx = 0;
          mouse.vy = 0;
        }
        mouse.x = relX;
        mouse.y = relY;
      } else {
        mouse.x = -1000;
        mouse.y = -1000;
      }
    };

    const handlePointerLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    if (interactive) {
      window.addEventListener("mousemove", handlePointerMove, { passive: true });
      window.addEventListener("mouseleave", handlePointerLeave, { passive: true });
    }

    const resizeObserver = new ResizeObserver(() => {
      initGrid();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (interactive) {
        window.removeEventListener("mousemove", handlePointerMove);
        window.removeEventListener("mouseleave", handlePointerLeave);
      }
    };
  }, [gridSpacing, lineOpacity, interactive]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden", className)}
      {...props}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
