"use client";

import React from "react";

interface PipelineEnergyWaveProps {
  className?: string;
}

/**
 * Continuous flowing energy stream connecting Stage 01, Stage 02, and Stage 03.
 * Uses lightweight pure SVG with cyan and electric blue gradients and animated pulse markers.
 */
export function PipelineEnergyWave({ className = "" }: PipelineEnergyWaveProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none relative w-full h-10 overflow-hidden ${className}`}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 900 40"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pipelineWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.1" />
            <stop offset="20%" stopColor="#00E5FF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#2979FF" stopOpacity="0.9" />
            <stop offset="80%" stopColor="#00BFA5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.1" />
          </linearGradient>

          <filter id="waveGlow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient background glow path */}
        <path
          d="M 0 20 Q 150 5, 300 20 T 600 20 T 900 20"
          stroke="url(#pipelineWaveGradient)"
          strokeWidth="3"
          strokeOpacity="0.3"
          filter="url(#waveGlow)"
        />

        {/* Primary sharp sinus path */}
        <path
          d="M 0 20 Q 150 8, 300 20 T 600 20 T 900 20"
          stroke="url(#pipelineWaveGradient)"
          strokeWidth="1.5"
        />

        {/* Secondary out-of-phase harmonic path */}
        <path
          d="M 0 20 Q 150 32, 300 20 T 600 20 T 900 20"
          stroke="url(#pipelineWaveGradient)"
          strokeWidth="1"
          strokeDasharray="4 6"
          strokeOpacity="0.5"
        />

        {/* Pulse packet 1 traveling across the wave */}
        <circle r="3" fill="#00E5FF" filter="url(#waveGlow)">
          <animateMotion
            path="M 0 20 Q 150 8, 300 20 T 600 20 T 900 20"
            dur="4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Pulse packet 2 with offset timing */}
        <circle r="2.5" fill="#2979FF" filter="url(#waveGlow)">
          <animateMotion
            path="M 0 20 Q 150 8, 300 20 T 600 20 T 900 20"
            dur="4s"
            begin="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

/**
 * Stage 01 visual: Intricate rotating cyan particle gear / energy sphere
 */
export function PipelineStageOneIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-12 h-12 flex items-center justify-center ${className}`}>
      {/* Outer rotating dashed ring */}
      <div className="absolute inset-0 rounded-full border border-dashed border-cyan/40 animate-[spin_12s_linear_indefinite]" />
      {/* Middle reverse counter-rotating segmented ring */}
      <div className="absolute inset-1.5 rounded-full border border-cyan/30 border-t-transparent border-b-transparent animate-[spin_8s_linear_indefinite_reverse]" />
      {/* Inner pulsing core */}
      <div className="relative w-4 h-4 rounded-full bg-cyan/20 border border-cyan flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.7)]">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-ping opacity-75" />
      </div>
      {/* 4 cardinal technical crosshairs */}
      <span className="absolute -top-1 w-0.5 h-1.5 bg-cyan/70" />
      <span className="absolute -bottom-1 w-0.5 h-1.5 bg-cyan/70" />
      <span className="absolute -left-1 h-0.5 w-1.5 bg-cyan/70" />
      <span className="absolute -right-1 h-0.5 w-1.5 bg-cyan/70" />
    </div>
  );
}

/**
 * Stage 02 visual: Organic blue/cyan nodal wave structure
 */
export function PipelineStageTwoIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-12 h-12 flex items-center justify-center ${className}`}>
      {/* Dynamic soundwave bars */}
      <div className="flex items-center gap-1">
        <span className="w-1 h-3 rounded-full bg-electric/60 animate-[pulse_1.2s_ease-in-out_infinite]" />
        <span className="w-1 h-6 rounded-full bg-cyan animate-[pulse_1.6s_ease-in-out_infinite_0.2s] shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
        <span className="w-1 h-8 rounded-full bg-electric animate-[pulse_1.4s_ease-in-out_infinite_0.4s] shadow-[0_0_10px_rgba(41,121,255,0.8)]" />
        <span className="w-1 h-5 rounded-full bg-cyan animate-[pulse_1.5s_ease-in-out_infinite_0.1s]" />
        <span className="w-1 h-2 rounded-full bg-electric/60 animate-[pulse_1.3s_ease-in-out_infinite_0.3s]" />
      </div>
      {/* Subtle outer bounding circle */}
      <div className="absolute inset-0 rounded-full border border-electric/30 animate-pulse" />
    </div>
  );
}

/**
 * Stage 03 visual: Crystalline cyan energy core connected to subtle deployment symbol
 */
export function PipelineStageThreeIcon({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-12 h-12 flex items-center justify-center ${className}`}>
      {/* Diamond / Crystalline rotating prism */}
      <div className="absolute inset-1.5 border border-teal/50 rotate-45 animate-[spin_16s_linear_indefinite]" />
      <div className="absolute inset-3 border border-cyan/40 rotate-12 animate-[spin_10s_linear_indefinite_reverse]" />
      {/* Glowing core */}
      <div className="relative w-3.5 h-3.5 rounded-sm bg-teal/30 border border-teal flex items-center justify-center shadow-[0_0_12px_rgba(0,191,165,0.8)]">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
      </div>
      {/* Telephony / deployment radiating dots */}
      <span className="absolute top-0 right-0 w-1 h-1 rounded-full bg-teal animate-ping" />
    </div>
  );
}
