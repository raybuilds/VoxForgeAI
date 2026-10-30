"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export type OrbAnimationSize = "sm" | "md" | "lg" | "xl" | "hero";
export type OrbAnimationState = "idle" | "ready" | "listening" | "processing" | "speaking" | "settling";

interface VoiceOrbAnimationProps {
  size?: OrbAnimationSize;
  className?: string;
  state?: OrbAnimationState;
  fps?: number; // Override default FPS if desired
  accessibleLabel?: string;
}

const sizeMap = {
  sm: "w-28 h-28",
  md: "w-40 h-40",
  lg: "w-60 h-60",
  xl: "w-72 h-72",
  hero: "w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px]",
};

// State-dependent target FPS and aura glow configuration
const stateConfig: Record<
  OrbAnimationState,
  {
    fps: number;
    glowColor: string;
    coreShadow: string;
    pulseScale: string;
    ambientOpacity: number;
  }
> = {
  idle: {
    fps: 12, // 12 FPS: smooth, organic idle breathing
    glowColor: "rgba(0, 229, 255, 0.45)",
    coreShadow: "0 0 50px rgba(0, 229, 255, 0.6), 0 0 100px rgba(22, 119, 255, 0.35)",
    pulseScale: "scale-100",
    ambientOpacity: 0.75,
  },
  ready: {
    fps: 12,
    glowColor: "rgba(0, 205, 186, 0.55)",
    coreShadow: "0 0 55px rgba(0, 205, 186, 0.7), 0 0 110px rgba(0, 229, 255, 0.4)",
    pulseScale: "scale-[1.02]",
    ambientOpacity: 0.8,
  },
  listening: {
    fps: 14, // 14 FPS: responsive acoustic reception
    glowColor: "rgba(0, 229, 255, 0.75)",
    coreShadow: "0 0 65px rgba(0, 229, 255, 0.85), 0 0 130px rgba(0, 229, 255, 0.5)",
    pulseScale: "scale-[1.05]",
    ambientOpacity: 0.9,
  },
  processing: {
    fps: 14,
    glowColor: "rgba(139, 92, 246, 0.65)",
    coreShadow: "0 0 60px rgba(139, 92, 246, 0.8), 0 0 120px rgba(22, 119, 255, 0.45)",
    pulseScale: "scale-[1.03]",
    ambientOpacity: 0.85,
  },
  speaking: {
    fps: 14,
    glowColor: "rgba(0, 229, 255, 0.9)",
    coreShadow: "0 0 75px rgba(0, 229, 255, 0.95), 0 0 150px rgba(22, 119, 255, 0.6)",
    pulseScale: "scale-[1.08]",
    ambientOpacity: 0.95,
  },
  settling: {
    fps: 11,
    glowColor: "rgba(147, 51, 234, 0.45)",
    coreShadow: "0 0 45px rgba(147, 51, 234, 0.55), 0 0 90px rgba(0, 229, 255, 0.3)",
    pulseScale: "scale-100",
    ambientOpacity: 0.7,
  },
};

// Generate list of 14 frame paths for a given state
function getFramePaths(state: OrbAnimationState): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const num = i < 10 ? `0${i}` : `${i}`;
    return `/visuals/orb-animation/${state}/frame-${num}.png`;
  });
}

/**
 * State-driven Holographic Voice Orb Component.
 * - Utilizes 84 normalized frames across 6 states (`idle`, `ready`, `listening`, `processing`, `speaking`, `settling`).
 * - Renders a single, coherent holographic sphere with 14-frame fluid playback (11–14 FPS).
 * - Preloads frames to avoid flickering.
 * - Respects `prefers-reduced-motion` by displaying static frame 0.
 */
export function VoiceOrbAnimation({
  size = "hero",
  className,
  state = "idle",
  fps,
  accessibleLabel = "VoxForge Holographic Voice Intelligence Orb",
}: VoiceOrbAnimationProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  // Track state changes to reset frame index cleanly
  const previousStateRef = useRef<OrbAnimationState>(state);

  useEffect(() => {
    if (previousStateRef.current !== state) {
      previousStateRef.current = state;
      setFrameIndex(0);
    }
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const targetFps = fps ?? stateConfig[state].fps;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = Math.round(1000 / targetFps);
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % 14);
    }, interval);

    return () => clearInterval(timer);
  }, [targetFps, prefersReducedMotion]);

  const cfg = stateConfig[state];
  const frames = useMemo(() => getFramePaths(state), [state]);
  const activeFrameSrc = frames[frameIndex] ?? frames[0];

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      className={cn(
        "relative flex items-center justify-center select-none transition-transform duration-700 ease-out",
        sizeMap[size],
        cfg.pulseScale,
        className
      )}
    >
      {/* 1. Volumetric Ambient Backlight (Bleeds into dark surroundings) */}
      <div
        className="absolute inset-[-20%] rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${cfg.glowColor} 0%, rgba(22, 119, 255, 0.2) 45%, transparent 75%)`,
          opacity: cfg.ambientOpacity,
        }}
      />

      {/* 2. Concentric Harmonic Filaments (Subtle, non-aggressive thin rings) */}
      <div
        className="absolute inset-[-4%] rounded-full border border-cyan/20 opacity-40 pointer-events-none"
        style={{
          boxShadow: "0 0 25px rgba(0, 229, 255, 0.12), inset 0 0 15px rgba(0, 229, 255, 0.08)",
          animation: prefersReducedMotion ? "none" : "orb-spin-slow 40s linear infinite",
        }}
      />
      <div
        className="absolute inset-[0%] rounded-full border border-teal/15 opacity-35 pointer-events-none"
        style={{
          animation: prefersReducedMotion ? "none" : "orb-spin-slow 28s linear infinite reverse",
        }}
      />

      {/* 3. The Core Holographic Sphere (Single Coherent Animated Orb) */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden transition-all duration-500 z-10 flex items-center justify-center"
        style={{
          boxShadow: cfg.coreShadow,
        }}
      >
        {/* Active Frame Presentation */}
        <div className="relative w-full h-full mix-blend-screen">
          <Image
            src={activeFrameSrc}
            alt={accessibleLabel}
            fill
            sizes="(max-width: 768px) 288px, (max-width: 1200px) 384px, 420px"
            priority={state === "idle"}
            className="object-contain pointer-events-none select-none drop-shadow-[0_0_25px_rgba(0,229,255,0.4)]"
            unoptimized
          />
        </div>

        {/* 4. Internal Liquid Specular Glint */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `radial-gradient(circle at 38% 30%, rgba(255, 255, 255, 0.3) 0%, rgba(0, 229, 255, 0.1) 32%, transparent 60%)`,
          }}
        />
      </div>

      {/* 5. Subtle Base Rim Highlight */}
      <div
        className="absolute bottom-[-2%] w-[80%] h-[10%] rounded-[100%] blur-sm pointer-events-none z-20 opacity-70"
        style={{
          background: `radial-gradient(ellipse at center, rgba(0, 229, 255, 0.75) 0%, rgba(0, 229, 255, 0) 75%)`,
        }}
      />
    </div>
  );
}
