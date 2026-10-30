import React from "react";
import { VoiceField } from "./voice-field";

interface AmbientBackgroundProps {
  className?: string;
  showOrbs?: boolean;
}

/**
 * Global atmospheric background using the dark voice-field identity.
 * Reuses VoiceField in subtle ambient mode with zero interaction blocking.
 */
export function AmbientBackground({
  className,
}: AmbientBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      <VoiceField
        state="ambient"
        intensity="subtle"
        showParticles={true}
        showRibbons={true}
        showWaveform={false}
        overlayOpacity={0.75}
        className={className || "w-full h-full"}
      />
    </div>
  );
}
