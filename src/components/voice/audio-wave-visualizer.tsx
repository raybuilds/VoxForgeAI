"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type AudioWaveMode = "ambient" | "paused" | "reactive";
export type AudioWaveDensity = "compact" | "normal" | "dense";

interface AudioWaveVisualizerProps {
  mode?: AudioWaveMode;
  density?: AudioWaveDensity;
  amplitudes?: number[]; // Values 0.0 to 1.0 for reactive mode
  className?: string;
  accessibleLabel?: string;
  barCount?: number;
}

/**
 * Enhanced Audio Wave Visualizer.
 * Creates an organic, centered frequency spectrum using soft aqua and icy sea blue.
 * - Ambient: Elegant harmonic pulse with staggered wave offsets
 * - Paused: Restrained flatline preview
 * - Reactive: Follows external parent amplitude stream
 */
export function AudioWaveVisualizer({
  mode = "ambient",
  density = "normal",
  amplitudes,
  className,
  accessibleLabel = "Audio frequency wave visualizer",
  barCount = 19,
}: AudioWaveVisualizerProps) {
  // Generate symmetrical bell-curve height multipliers
  const bars = Array.from({ length: barCount }, (_, i) => {
    // If reactive amplitudes are passed from an actual audio stream
    if (mode === "reactive" && amplitudes && amplitudes.length > 0) {
      const ampIndex = i % amplitudes.length;
      return Math.max(0.1, Math.min(1.0, amplitudes[ampIndex] ?? 0.2));
    }
    // Paused flat state
    if (mode === "paused") {
      return 0.12;
    }
    // Ambient Mode: Centered harmonic bell curve with organic variance
    const center = (barCount - 1) / 2;
    const distFromCenter = Math.abs(i - center) / center; // 0 at center, 1 at ends
    const baseHeight = Math.max(0.18, 1 - Math.pow(distFromCenter, 1.6));
    // Add subtle alternating rhythm
    const rhythmOffset = (i % 2 === 0 ? 0.08 : -0.06);
    return Math.max(0.15, Math.min(1.0, baseHeight + rhythmOffset));
  });

  const densityStyles = {
    compact: { height: "h-6", barWidth: "w-1", gap: "gap-1", minH: "4px" },
    normal: { height: "h-11", barWidth: "w-1.5", gap: "gap-1.5", minH: "6px" },
    dense: { height: "h-16", barWidth: "w-2", gap: "gap-2", minH: "8px" },
  };

  const currentDensity = densityStyles[density];

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      className={cn(
        "flex items-center justify-center select-none py-1",
        currentDensity.height,
        currentDensity.gap,
        className
      )}
    >
      {bars.map((scale, index) => {
        // Natural center-outward animation delay for fluid harmonic waves
        const center = (barCount - 1) / 2;
        const distFromCenter = Math.abs(index - center);
        const animationDelay = `${(distFromCenter * 0.08).toFixed(2)}s`;

        return (
          <div
            key={index}
            style={{
              height: `${Math.round(scale * 100)}%`,
              minHeight: currentDensity.minH,
              animationDelay: mode === "ambient" ? animationDelay : "0s",
            }}
            className={cn(
              "rounded-full transition-all duration-300 transform-gpu",
              currentDensity.barWidth,
              // Alternating Soft Aqua & Icy Sea Blue with soft top luminous caps
              index % 2 === 0
                ? "bg-gradient-to-t from-aqua/40 via-aqua/80 to-aqua shadow-sm shadow-aqua/25"
                : "bg-gradient-to-t from-ice/30 via-ice/70 to-ice shadow-sm shadow-ice/20",
              mode === "ambient" && "animate-wave-harmonic"
            )}
          />
        );
      })}
    </div>
  );
}
