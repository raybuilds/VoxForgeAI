"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type VoiceFieldState =
  | "idle"
  | "ready"
  | "listening"
  | "processing"
  | "speaking"
  | "ambient"
  | "cinematic"
  | "particles"
  | "error";

export type VoiceFieldIntensity = "subtle" | "normal" | "cinematic";

interface VoiceFieldProps {
  state?: VoiceFieldState;
  intensity?: VoiceFieldIntensity;
  className?: string;
  showParticles?: boolean;
  showRibbons?: boolean;
  showWaveform?: boolean;
  overlayOpacity?: number; // 0.0 to 1.0
  children?: React.ReactNode;
}

const frameMap: Record<VoiceFieldState, string> = {
  idle: "/visuals/frames/frame-idle.png",
  ready: "/visuals/frames/frame-ready.png",
  listening: "/visuals/frames/frame-listening.png",
  processing: "/visuals/frames/frame-processing.png",
  speaking: "/visuals/frames/frame-speaking.png",
  ambient: "/visuals/frames/frame-ambient.png",
  cinematic: "/visuals/frames/frame-cinematic.png",
  particles: "/visuals/frames/frame-particles.png",
  error: "/visuals/frames/frame-idle.png",
};

/**
 * Reusable Cinematic VoiceField Component.
 * Assembles multi-layered, interactive holographic voice aura using:
 * 1. Deep navy-void backdrop
 * 2. Particle wave field (/visuals/voice-field-particles.png)
 * 3. Flowing luminous ribbons (/visuals/voice-field-ribbons.png)
 * 4. Extracted state frame from atlas (/visuals/frames/...)
 * 5. Radial cyan & electric-blue optical glow
 * 6. Thin waveform accent (/visuals/voice-waveform.png)
 * 7. Non-blocking pointer events (`pointer-events-none` on visual layers)
 */
export function VoiceField({
  state = "ambient",
  intensity = "normal",
  className,
  showParticles = true,
  showRibbons = true,
  showWaveform = false,
  overlayOpacity,
  children,
}: VoiceFieldProps) {
  const intensityMap = {
    subtle: {
      particles: "opacity-20",
      ribbons: "opacity-25",
      frame: "opacity-35",
      glow: "opacity-25",
    },
    normal: {
      particles: "opacity-35",
      ribbons: "opacity-45",
      frame: "opacity-60",
      glow: "opacity-40",
    },
    cinematic: {
      particles: "opacity-55",
      ribbons: "opacity-75",
      frame: "opacity-90",
      glow: "opacity-65",
    },
  };

  const currentIntensity = intensityMap[intensity];
  const activeFrameSrc = frameMap[state] || frameMap.ambient;

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full select-none",
        className
      )}
    >
      {/* Visual Field Layers (Strictly pointer-events-none) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      >
        {/* Layer 1: Base Void Navy & Deep Radiant Radial Highlights */}
        <div className="absolute inset-0 bg-[#030810]" />
        <div
          className={cn(
            "absolute -top-32 -right-32 w-[42rem] h-[42rem] rounded-full bg-cyan/15 blur-[140px] transform-gpu transition-opacity duration-700",
            currentIntensity.glow,
            state === "speaking" && "bg-cyan/30 scale-110",
            state === "listening" && "bg-electric/25 scale-105",
            state === "error" && "bg-rose-500/15"
          )}
        />
        <div
          className={cn(
            "absolute -bottom-36 -left-36 w-[42rem] h-[42rem] rounded-full bg-electric/15 blur-[140px] transform-gpu transition-opacity duration-700",
            currentIntensity.glow,
            state === "speaking" && "bg-teal/20"
          )}
        />

        {/* Layer 2: Dotted Flowing Particle Field */}
        {showParticles && (
          <div
            className={cn(
              "absolute inset-0 bg-cover bg-center mix-blend-screen transition-opacity duration-1000 animate-drift-slow",
              currentIntensity.particles
            )}
            style={{
              backgroundImage: "url('/visuals/voice-field-particles.png')",
            }}
          />
        )}

        {/* Layer 3: Flowing Luminous Cyan Ribbon Waves */}
        {showRibbons && (
          <div
            className={cn(
              "absolute inset-0 bg-cover bg-center mix-blend-screen transition-opacity duration-700 animate-drift-reverse",
              currentIntensity.ribbons,
              state === "speaking" && "brightness-125 animate-wave-pulse"
            )}
            style={{
              backgroundImage: "url('/visuals/voice-field-ribbons.png')",
            }}
          />
        )}

        {/* Layer 4: State-Specific Extracted Atlas Frame (Clean, without labels or dividers) */}
        <div
          className={cn(
            "absolute inset-0 bg-cover bg-center mix-blend-screen transition-all duration-700",
            currentIntensity.frame,
            state === "listening" && "scale-105 brightness-110",
            state === "speaking" && "scale-105 brightness-125"
          )}
          style={{
            backgroundImage: `url('${activeFrameSrc}')`,
          }}
        />

        {/* Layer 5: Optional Horizontal Voice Waveform Accent */}
        {showWaveform && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-3/4 max-w-xl h-16 bg-contain bg-center bg-no-repeat opacity-40 mix-blend-screen animate-pulse"
            style={{
              backgroundImage: "url('/visuals/voice-waveform.png')",
            }}
          />
        )}

        {/* Layer 6: Atmospheric Vignette Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#030810] via-transparent to-[#030810]/70"
          style={{
            opacity: overlayOpacity !== undefined ? overlayOpacity : 0.65,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#030810_90%)] opacity-80" />
      </div>

      {/* Content Container (Interactive) */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
