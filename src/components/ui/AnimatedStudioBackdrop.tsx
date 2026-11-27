"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedStudioBackdropProps {
  variant?: "hero" | "workspace";
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  phase: number;
  speed: number;
  tone: "brand" | "amber" | "sky" | "neutral";
}

function createParticles(count: number, width: number, height: number): Particle[] {
  const tones: Particle["tone"][] = ["brand", "amber", "sky", "neutral", "neutral"];
  return Array.from({ length: count }, (_, i) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.22,
    vy: -0.08 - Math.random() * 0.22,
    radius: 0.9 + Math.random() * 2.1,
    alpha: 0.16 + Math.random() * 0.45,
    phase: Math.random() * Math.PI * 2,
    speed: 0.008 + Math.random() * 0.015,
    tone: tones[i % tones.length],
  }));
}

/**
 * Multi-layered atmospheric studio backdrop:
 * 1. GPU-composited aurora light orbs + volumetric beams
 * 2. Pointer-reactive architectural studio grid
 * 3. Lightweight <canvas> cinema bokeh / dust field gated by content-visibility & reduced-motion
 * 4. Fine optical film-grain overlay
 */
export default function AnimatedStudioBackdrop({
  variant = "hero",
  className = "",
}: AnimatedStudioBackdropProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.25, active: false });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Subscribe to prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Pointer-reactive spotlight via CSS custom properties (zero React re-renders)
  useEffect(() => {
    if (variant !== "hero" || prefersReducedMotion) return;

    let rafId: number | null = null;
    let latestX = 0;
    let latestY = 0;

    const commitPointer = () => {
      rafId = null;
      const host = hostRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const relX = latestX - rect.left;
      const relY = latestY - rect.top;
      host.style.setProperty("--pointer-x", `${relX.toFixed(1)}px`);
      host.style.setProperty("--pointer-y", `${relY.toFixed(1)}px`);
      pointerRef.current = {
        x: Math.max(0, Math.min(1, relX / rect.width)),
        y: Math.max(0, Math.min(1, relY / rect.height)),
        active: true,
      };
    };

    const handlePointerMove = (e: PointerEvent) => {
      latestX = e.clientX;
      latestY = e.clientY;
      if (rafId === null) {
        rafId = window.requestAnimationFrame(commitPointer);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [variant, prefersReducedMotion]);

  // Ambient <canvas> particle field with contentvisibilityautostatechange + IntersectionObserver fallback
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isHero = variant === "hero";
    const particleCount = isHero ? 42 : 18;
    let width = host.clientWidth || window.innerWidth;
    let height = host.clientHeight || window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = createParticles(particleCount, width, height);

    let rafId: number | null = null;
    let isSkipped = false;
    let isDocumentHidden = document.hidden;

    const resize = () => {
      if (!host || !canvas) return;
      width = Math.max(1, host.clientWidth);
      height = Math.max(1, host.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(particleCount, width, height);
    };

    const getPalette = () => {
      const isDark = document.documentElement.classList.contains("dark");
      return isDark
        ? {
            brand: "244, 63, 94",
            amber: "251, 191, 36",
            sky: "56, 189, 248",
            neutral: "226, 232, 240",
            alphaScale: isHero ? 1 : 0.45,
          }
        : {
            brand: "225, 29, 72",
            amber: "217, 119, 6",
            sky: "14, 165, 233",
            neutral: "71, 85, 105",
            alphaScale: isHero ? 0.55 : 0.25,
          };
    };

    const drawFrame = (animate: boolean) => {
      ctx.clearRect(0, 0, width, height);
      const palette = getPalette();
      const px = pointerRef.current.x * width;
      const py = pointerRef.current.y * height;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (animate) {
          p.phase += p.speed;
          p.x += p.vx + Math.sin(p.phase) * 0.12;
          p.y += p.vy;

          if (p.y < -12) {
            p.y = height + 12;
            p.x = Math.random() * width;
          }
          if (p.x < -12) p.x = width + 12;
          if (p.x > width + 12) p.x = -12;
        }

        // Subtle brightness boost near pointer on hero
        let proximityBoost = 0;
        if (isHero && pointerRef.current.active) {
          const dx = p.x - px;
          const dy = p.y - py;
          const dist = Math.hypot(dx, dy);
          if (dist < 220) {
            proximityBoost = (1 - dist / 220) * 0.35;
          }
        }

        const twinkle = 0.72 + Math.sin(p.phase * 1.5) * 0.28;
        const opacity = Math.min(
          0.9,
          (p.alpha * twinkle + proximityBoost) * palette.alphaScale
        );
        const rgb = palette[p.tone];

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${opacity.toFixed(3)})`;
        ctx.fill();

        // Soft bokeh halo on larger particles
        if (p.radius > 2.15 && isHero) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb}, ${(opacity * 0.16).toFixed(3)})`;
          ctx.fill();
        }
      }

      // Faint constellation lines between nearby hero particles near cursor
      if (isHero && pointerRef.current.active) {
        ctx.lineWidth = 0.65;
        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          const distToPointer = Math.hypot(a.x - px, a.y - py);
          if (distToPointer > 210) continue;

          for (let j = i + 1; j < particles.length; j++) {
            const b = particles[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 95) {
              const lineAlpha =
                (1 - d / 95) * (1 - distToPointer / 210) * 0.22 * palette.alphaScale;
              if (lineAlpha > 0.01) {
                ctx.strokeStyle = `rgba(${palette.brand}, ${lineAlpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }
        }
      }
    };

    const shouldAnimate = () =>
      !prefersReducedMotion && !isSkipped && !isDocumentHidden;

    const tick = () => {
      if (!shouldAnimate()) {
        rafId = null;
        return;
      }
      drawFrame(true);
      rafId = window.requestAnimationFrame(tick);
    };

    const syncLoop = () => {
      if (shouldAnimate()) {
        if (rafId === null) {
          rafId = window.requestAnimationFrame(tick);
        }
      } else {
        if (rafId !== null) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        drawFrame(false);
      }
    };

    resize();
    syncLoop();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!shouldAnimate()) drawFrame(false);
    });
    resizeObserver.observe(host);

    const handleVisibility = () => {
      isDocumentHidden = document.hidden;
      syncLoop();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Pause canvas rendering when element is skipped by browser content-visibility
    const handleContentVisibility = (event: Event) => {
      const cvEvent = event as Event & { skipped?: boolean };
      isSkipped = Boolean(cvEvent.skipped);
      syncLoop();
    };
    host.addEventListener("contentvisibilityautostatechange", handleContentVisibility);

    // Fallback to IntersectionObserver if content-visibility is unsupported
    let intersectionObserver: IntersectionObserver | null = null;
    const supportsContentVisibility =
      typeof document !== "undefined" &&
      "contentVisibility" in document.documentElement.style;

    if (!supportsContentVisibility && "IntersectionObserver" in window) {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            isSkipped = !entry.isIntersecting;
            syncLoop();
          }
        },
        { rootMargin: "200px" }
      );
      intersectionObserver.observe(host);
    }

    // Re-tint static frame if theme class toggles while paused
    const themeObserver = new MutationObserver(() => {
      if (!shouldAnimate()) drawFrame(false);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      host.removeEventListener(
        "contentvisibilityautostatechange",
        handleContentVisibility
      );
    };
  }, [variant, prefersReducedMotion]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`studio-backdrop-host studio-canvas-host pointer-events-none select-none ${className}`}
    >
      {/* Layer 1: GPU-composited Aurora / Cinema Aperture Blooms */}
      <div className="studio-aurora-stage">
        <div
          className={`studio-aurora-orb studio-aurora-orb-1 ${
            variant === "workspace" ? "opacity-45" : ""
          }`}
        />
        <div
          className={`studio-aurora-orb studio-aurora-orb-2 ${
            variant === "workspace" ? "opacity-35" : ""
          }`}
        />
        {variant === "hero" && (
          <div className="studio-aurora-orb studio-aurora-orb-3" />
        )}
      </div>

      {/* Layer 2: Volumetric Projector Sweep Beams (Hero only) */}
      {variant === "hero" && (
        <div className="studio-beams-stage">
          <div className="studio-beam studio-beam-1" />
          <div className="studio-beam studio-beam-2" />
        </div>
      )}

      {/* Layer 3: Architectural Grid + Pointer Spotlight */}
      <div
        className={`studio-backdrop-grid ${
          variant === "workspace" ? "opacity-45" : "opacity-90"
        }`}
      />
      {variant === "hero" && <div className="studio-pointer-glow" />}

      {/* Layer 4: Ambient Bokeh / Dust Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
      />

      {/* Layer 5: Subtle Optical Film Grain */}
      <div className="studio-grain-overlay" />
    </div>
  );
}
