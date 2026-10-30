"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface ForegroundParticlesProps {
  className?: string;
  count?: number;
}

/**
 * Lightweight, zero-dependency atmospheric foreground micro-particles.
 * Floats gently across the camera plane with varied depths, opacities, and cyan glow.
 */
export function ForegroundParticles({
  className,
  count = 24,
}: ForegroundParticlesProps) {
  const baseId = useId();

  // Deterministic seed generation based on index to ensure hydration purity
  const particles = Array.from({ length: count }, (_, i) => {
    // Generate varied coordinates and timing
    const left = ((i * 37 + 13) % 96) + 2; // 2% to 98%
    const top = ((i * 43 + 19) % 90) + 5; // 5% to 95%
    const size = (i % 3) + 1.5; // 1.5px to 3.5px
    const opacity = ((i % 5) + 3) * 0.08; // 0.24 to 0.56
    const duration = 14 + (i % 8) * 2; // 14s to 28s
    const delay = (i % 6) * 1.5; // 0s to 7.5s
    const isCyan = i % 3 !== 0;

    return {
      id: `${baseId}-particle-${i}`,
      left: `${left}%`,
      top: `${top}%`,
      width: `${size}px`,
      height: `${size}px`,
      opacity,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      colorClass: isCyan ? "bg-cyan shadow-[0_0_8px_#00e5ff]" : "bg-electric shadow-[0_0_8px_#1677ff]",
    };
  });

  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 pointer-events-none select-none overflow-hidden z-25",
        className
      )}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className={cn(
            "absolute rounded-full animate-pulse transition-transform",
            p.colorClass
          )}
          style={{
            left: p.left,
            top: p.top,
            width: p.width,
            height: p.height,
            opacity: p.opacity,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
