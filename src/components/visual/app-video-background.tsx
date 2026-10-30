"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";

interface AppVideoBackgroundProps {
  src?: string;
  overlayOpacity?: number; // 0 to 1, default 0.65
  className?: string;
  positionMode?: "fixed" | "absolute";
}

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * Reusable full-viewport or section-level atmospheric video background.
 *
 * Features:
 * - Autoplay, muted, loop, playsInline
 * - Object-cover positioning with pointer-events-none (never intercepts clicks)
 * - Restrained dark gradient overlay for text readability & HUD contrast
 * - Supports fixed (global full-viewport) or absolute (section-level) positioning
 * - prefers-reduced-motion support via useSyncExternalStore (no cascading renders)
 * - Safe error handling (falls back to dark void background if video fails)
 */
export function AppVideoBackground({
  src = "/visuals/rest_bg.mp4",
  overlayOpacity = 0.65,
  className = "",
  positionMode = "fixed",
}: AppVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasError, setHasError] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  useEffect(() => {
    if (!prefersReducedMotion && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted or deferred by browser policy
      });
    }
  }, [src, prefersReducedMotion]);

  const posClass = positionMode === "fixed" ? "fixed inset-0" : "absolute inset-0";

  return (
    <div
      aria-hidden="true"
      className={`${posClass} pointer-events-none select-none overflow-hidden z-0 bg-[#030810] ${className}`}
    >
      {!prefersReducedMotion && !hasError && src ? (
        <video
          ref={videoRef}
          key={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setHasError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-85"
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}

      {/* Layered dark readability and atmospheric tint overlays */}
      <div
        className="absolute inset-0 bg-[#030810] pointer-events-none transition-opacity duration-500"
        style={{ opacity: overlayOpacity }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,8,16,0.6)_65%,#030810_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#030810]/50 via-transparent to-[#030810]/80 pointer-events-none" />
    </div>
  );
}
