import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "draft" | "published" | "testing" | "archived" | "cyan" | "violet" | "aqua" | "ice" | "mint";
  children: React.ReactNode;
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const styles = {
    default: "bg-navy-subtle/80 text-text-secondary border-border/60",
    draft: "bg-amber-950/40 text-amber-300 border-amber-600/40",
    testing: "bg-electric/15 text-electric-blue border-electric/30 shadow-glow-electric/10",
    published: "bg-cyan/15 text-cyan border-cyan/40 shadow-glow-cyan/20",
    archived: "bg-navy-subtle/50 text-text-muted border-border/40",
    // Brand Aliases
    cyan: "bg-cyan/15 text-cyan border-cyan/40 shadow-glow-cyan/20",
    aqua: "bg-cyan/15 text-cyan border-cyan/40 shadow-glow-cyan/20",
    ice: "bg-electric/15 text-electric-blue border-electric/30",
    mint: "bg-teal/15 text-teal border-teal/40",
    violet: "bg-electric/15 text-electric-blue border-electric/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border transition-colors",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
