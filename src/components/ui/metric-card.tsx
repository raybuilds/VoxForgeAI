import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: "violet" | "cyan" | "emerald" | "amber" | "aqua" | "ice";
  isDemo?: boolean;
}

/**
 * Technical HUD-style metric tile with fine accent lines.
 */
export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  subtitle,
  icon: Icon,
  iconColor = "cyan",
  isDemo = false,
}: MetricCardProps) {
  const iconColors = {
    cyan: "text-cyan bg-cyan/10 border-cyan/30 shadow-glow-cyan/15",
    ice: "text-electric bg-electric/10 border-electric/30",
    aqua: "text-cyan bg-cyan/10 border-cyan/30 shadow-glow-cyan/15",
    violet: "text-electric bg-electric/10 border-electric/30",
    emerald: "text-teal bg-teal/10 border-teal/30",
    amber: "text-amber-400 bg-amber-950/40 border-amber-600/30",
  };

  return (
    <div className="relative rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md p-4 transition-all duration-200 hover:border-cyan/40 group overflow-hidden">
      {/* Top technical accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan/30 to-transparent group-hover:via-cyan/70 transition-all" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-text-muted">
              {title}
            </span>
            {isDemo && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-navy-subtle/80 text-cyan/70 font-mono border border-cyan/20">
                DEMO
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
            {change && (
              <span
                className={cn(
                  "text-xs font-mono font-medium",
                  changeType === "positive" && "text-teal",
                  changeType === "negative" && "text-rose-400",
                  changeType === "neutral" && "text-text-muted"
                )}
              >
                {change}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-text-secondary leading-snug">{subtitle}</p>}
        </div>

        <div className={cn("p-2 rounded-lg border transition-transform duration-200 group-hover:scale-105", iconColors[iconColor])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
