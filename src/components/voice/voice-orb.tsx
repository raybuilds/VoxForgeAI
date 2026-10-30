"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type VoiceOrbState =
  | "idle"
  | "ready"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

export type VoiceOrbSize = "sm" | "md" | "lg" | "xl";

interface VoiceOrbProps {
  state?: VoiceOrbState;
  size?: VoiceOrbSize;
  className?: string;
  accessibleLabel?: string;
}

const sizeConfig = {
  sm: {
    container: "w-20 h-20",
    core: "w-11 h-11",
    ring1: "w-15 h-15",
    ring2: "w-19 h-19",
    specular: "w-4 h-4",
  },
  md: {
    container: "w-32 h-32",
    core: "w-16 h-16",
    ring1: "w-24 h-24",
    ring2: "w-30 h-30",
    specular: "w-6 h-6",
  },
  lg: {
    container: "w-44 h-44",
    core: "w-24 h-24",
    ring1: "w-34 h-34",
    ring2: "w-42 h-42",
    specular: "w-9 h-9",
  },
  xl: {
    container: "w-56 h-56",
    core: "w-32 h-32",
    ring1: "w-44 h-44",
    ring2: "w-54 h-54",
    specular: "w-12 h-12",
  },
};

/**
 * Luminous AI Voice Agent Orb.
 * Features:
 * - Layered dimensional concentric resonance rings
 * - Internal curved caustics & specular reflections
 * - Subtle harmonic breathing and rotation
 * - Strict CSS transforms for 60fps performance
 */
export function VoiceOrb({
  state = "idle",
  size = "md",
  className,
  accessibleLabel,
}: VoiceOrbProps) {
  const currentSize = sizeConfig[size];
  const label = accessibleLabel || `Voice Agent State: ${state}`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative flex items-center justify-center select-none animate-orb-float",
        currentSize.container,
        className
      )}
    >
      {/* Outer Diffuse Aura (Deep Sea Aqua Atmosphere) */}
      <div
        className={cn(
          "absolute inset-0 rounded-full blur-xl transition-all duration-700 ease-out pointer-events-none",
          state === "idle" && "bg-ice/15 opacity-50 scale-90",
          state === "ready" && "bg-aqua/25 opacity-75 scale-100",
          state === "listening" && "bg-aqua/40 opacity-90 scale-110",
          state === "processing" && "bg-ice/30 opacity-80 scale-100",
          state === "speaking" && "bg-gradient-to-r from-aqua/40 to-ice/40 opacity-95 scale-115",
          state === "error" && "bg-rose-500/20 opacity-60 scale-95"
        )}
      />

      {/* Outermost Resonant Ring with SVG Accent Arc */}
      <div
        className={cn(
          "absolute rounded-full border transition-all duration-700 ease-out flex items-center justify-center",
          currentSize.ring2,
          state === "idle" && "border-aqua/15 opacity-40 scale-95",
          state === "ready" && "border-aqua/30 opacity-70 scale-100 shadow-glow-aqua/20",
          state === "listening" && "border-aqua/60 opacity-90 scale-110 animate-ping duration-1000",
          state === "processing" && "border-ice/40 opacity-80 scale-105 animate-orb-spin-slow",
          state === "speaking" && "border-aqua/70 opacity-95 scale-115 shadow-glow-aqua/40",
          state === "error" && "border-rose-500/30 opacity-50 scale-95"
        )}
      >
        {/* Orbital SVG Sparkle Accent */}
        <svg className="w-full h-full absolute inset-0 animate-orb-spin-slow" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="5"
            r="1.8"
            className={cn(
              "transition-colors duration-500",
              state === "error" ? "fill-rose-400" : "fill-aqua"
            )}
          />
          <circle
            cx="50"
            cy="95"
            r="1.2"
            className={cn(
              "transition-colors duration-500",
              state === "error" ? "fill-rose-400/60" : "fill-ice"
            )}
          />
        </svg>
      </div>

      {/* Middle Concentric Wave Ring */}
      <div
        className={cn(
          "absolute rounded-full border transition-all duration-500 ease-out",
          currentSize.ring1,
          state === "idle" && "border-ice/20 bg-ice/5 scale-95 opacity-50",
          state === "ready" && "border-aqua/40 bg-aqua/5 scale-100 opacity-75 shadow-glow-aqua/25",
          state === "listening" && "border-aqua/70 bg-aqua/10 scale-105 opacity-90",
          state === "processing" && "border-ice/60 bg-ice/10 scale-100 opacity-85 animate-pulse",
          state === "speaking" && "border-aqua/80 bg-aqua/15 scale-110 opacity-95 shadow-glow-aqua/30",
          state === "error" && "border-rose-500/50 bg-rose-950/20 scale-100 opacity-70"
        )}
      />

      {/* Luminous Central Dimensional Core Sphere */}
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center transition-all duration-500 shadow-surface-dark overflow-hidden border",
          currentSize.core,
          state === "idle" && "bg-gradient-to-tr from-surface-elevated via-surface-subtle to-ice/25 border-aqua/30 shadow-glow-ice/20",
          state === "ready" && "bg-gradient-to-tr from-surface-elevated via-aqua/20 to-ice/35 border-aqua/60 shadow-glow-aqua",
          state === "listening" && "bg-gradient-to-tr from-aqua/30 via-ice/40 to-mint/60 border-aqua shadow-glow-aqua",
          state === "processing" && "bg-gradient-to-tr from-ice/30 via-surface-subtle to-aqua/40 border-ice shadow-glow-ice",
          state === "speaking" && "bg-gradient-to-tr from-aqua/40 via-ice/50 to-white/60 border-aqua shadow-glow-aqua",
          state === "error" && "bg-gradient-to-tr from-rose-950/90 via-rose-900/50 to-rose-700/60 border-rose-500/60"
        )}
      >
        {/* Specular Curved Highlight (Gives physical sphere glass depth) */}
        <div
          className={cn(
            "absolute top-1 left-2 rounded-full bg-gradient-to-br from-mint/80 to-transparent blur-[1px] pointer-events-none",
            currentSize.specular
          )}
        />

        {/* Ambient Internal Caustic Flare */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_75%,rgba(157,239,226,0.35),transparent_55%)] pointer-events-none" />

        {/* Dynamic Center Node */}
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all duration-300",
            state === "idle" && "bg-ice/80 shadow-sm",
            state === "ready" && "bg-aqua shadow-glow-aqua scale-105",
            state === "listening" && "bg-mint scale-125 shadow-glow-aqua animate-pulse",
            state === "processing" && "bg-ice animate-ping",
            state === "speaking" && "bg-white scale-130 shadow-glow-aqua",
            state === "error" && "bg-rose-400"
          )}
        />
      </div>
    </div>
  );
}
