import React from "react";
import { AppVideoBackground } from "./app-video-background";

interface AmbientBackgroundProps {
  className?: string;
  showOrbs?: boolean;
}

/**
 * Global atmospheric background for application shell pages.
 * Seamlessly delivers the rest_bg.mp4 video background while keeping
 * text, forms, charts, and tables perfectly legible and high-contrast.
 */
export function AmbientBackground({ className }: AmbientBackgroundProps) {
  return (
    <AppVideoBackground
      src="/visuals/rest_bg.mp4"
      overlayOpacity={0.7}
      className={className}
    />
  );
}
