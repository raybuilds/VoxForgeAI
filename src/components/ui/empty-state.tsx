import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-cyan/25 bg-navy-deep/60 backdrop-blur-md max-w-lg mx-auto my-6 relative overflow-hidden group">
      <div className="w-12 h-12 rounded-xl bg-cyan/10 border border-cyan/30 flex items-center justify-center mb-3 text-cyan shadow-glow-cyan/20">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-white tracking-wide font-mono mb-1">{title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed max-w-sm mb-5">{description}</p>
      <div className="flex items-center gap-3">
        {actionHref && actionLabel && (
          <a href={actionHref}>
            <Button size="sm">{actionLabel}</Button>
          </a>
        )}
        {!actionHref && actionLabel && (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && (
          <Button size="sm" variant="outline" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
