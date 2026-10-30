"use client";

import Link from "next/link";
import { Plus, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border/70 bg-navy-void/80 backdrop-blur-xl px-6 md:px-8 flex items-center justify-between shrink-0 z-10 sticky top-0 transition-colors">
      <div className="min-w-0 pr-4">
        {title ? (
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide font-mono truncate">{title}</h1>
            {description && <p className="text-xs text-text-muted truncate">{description}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan bg-cyan/10 border border-cyan/30 px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-glow-cyan/15">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse"></span>
              VOICE FIELD ENGINE ACTIVE
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/playground"
          className="text-xs font-mono text-text-secondary hover:text-white px-3 py-1.5 rounded-lg border border-border bg-navy-deep/80 hover:bg-navy-elevated transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Activity className="w-3.5 h-3.5 text-cyan" />
          <span className="hidden sm:inline">Voice Console</span>
        </Link>

        <Link href="/create">
          <Button size="sm" className="gap-1.5 shadow-glow-cyan/25">
            <Plus className="w-3.5 h-3.5 text-navy-void" />
            <span className="hidden sm:inline">Create Agent</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
