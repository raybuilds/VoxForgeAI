"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Curated background frames strictly for atmospheric ambient idle on the homepage:
 * Keeps steady luminance and avoids interaction states (listening/processing/speaking).
 */
const AMBIENT_BACKGROUND_FRAMES = [
  "/visuals/frames/frame-ambient.png",
  "/visuals/frames/frame-cinematic.png",
  "/visuals/frames/frame-idle.png",
  "/visuals/frames/frame-ready.png",
];

export type BackgroundState = "ambient" | "listening" | "processing" | "speaking";

interface AnimatedVoiceBackgroundProps {
  className?: string;
  cycleIntervalMs?: number; // Time each frame stays active before crossfading
  overlayOpacity?: number;
  showParticles?: boolean;
  showRibbons?: boolean;
  state?: BackgroundState;
}

export function AnimatedVoiceBackground({
  className,
  cycleIntervalMs = 5000,
  overlayOpacity = 0.45,
  showParticles = true,
  showRibbons = true,
  state = "ambient",
}: AnimatedVoiceBackgroundProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || state !== "ambient") return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AMBIENT_BACKGROUND_FRAMES.length);
    }, cycleIntervalMs);

    return () => clearInterval(timer);
  }, [cycleIntervalMs, prefersReducedMotion, state]);

  // Determine frames to display based on state
  const isInteractiveState = state !== "ambient";
  const interactiveFrame =
    state === "listening"
      ? "/visuals/frames/frame-listening.png"
      : state === "processing"
      ? "/visuals/frames/frame-processing.png"
      : "/visuals/frames/frame-speaking.png";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 pointer-events-none select-none overflow-hidden bg-navy-void",
        className
      )}
    >
      {/* 1. Deep Holographic Radial Vignette: Darkens edges while keeping central stage deep navy */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,8,16,0.6)_55%,#030810_92%)]" />

      {/* 2. Ambient Flowing Particles Layer with feathered soft mask */}
      {showParticles && (
        <div
          className="absolute inset-0 z-2 opacity-35 bg-cover bg-center mix-blend-screen transition-opacity duration-1000"
          style={{
            backgroundImage: `url('/visuals/voice-field-particles.png')`,
            maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)",
          }}
        />
      )}

      {/* 3. Ambient Ribbons & Plasma Layer with slow rhythmic pulse and feathered mask */}
      {showRibbons && (
        <div
          className="absolute inset-0 z-3 opacity-30 bg-cover bg-center mix-blend-screen animate-pulse"
          style={{
            backgroundImage: `url('/visuals/voice-field-ribbons.png')`,
            animationDuration: "9s",
            maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 75%)",
          }}
        />
      )}

      {/* 4. Continuously Crossfading Frames with feathered boundary mask */}
      <div
        className="absolute inset-0 z-4"
        style={{
          maskImage: "radial-gradient(ellipse at 50% 45%, black 45%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 45%, transparent 75%)",
        }}
      >
        {isInteractiveState ? (
          <div
            className="absolute inset-0 bg-cover bg-center mix-blend-screen opacity-80 transition-opacity duration-1000"
            style={{ backgroundImage: `url('${interactiveFrame}')` }}
          />
        ) : (
          AMBIENT_BACKGROUND_FRAMES.map((frameSrc, idx) => {
            const isActive = idx === currentIndex || prefersReducedMotion;
            if (prefersReducedMotion && idx !== 1) return null;

            return (
              <div
                key={frameSrc}
                className={cn(
                  "absolute inset-0 bg-cover bg-center mix-blend-screen transition-opacity ease-in-out",
                  isActive ? "opacity-65 z-20" : "opacity-0 z-10"
                )}
                style={{
                  backgroundImage: `url('${frameSrc}')`,
                  transitionDuration: prefersReducedMotion ? "0ms" : "2000ms",
                }}
              />
            );
          })
        )}
      </div>

      {/* 5. Center Radial Illumination Glow */}
      <div
        className="absolute inset-0 z-5 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(0, 229, 255, 0.14) 0%, rgba(22, 119, 255, 0.06) 45%, transparent 70%)`,
        }}
      />

      {/* 6. Darkening Veil to Guarantee Text Contrast */}
      <div
        className="absolute inset-0 z-6 pointer-events-none"
        style={{ backgroundColor: `rgba(3, 8, 16, ${overlayOpacity})` }}
      />
    </div>
  );
}
