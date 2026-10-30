"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  PlusCircle,
  PlayCircle,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "My Agents", href: "/agents", icon: Bot },
  { name: "Create Agent", href: "/create", icon: PlusCircle },
  { name: "Voice Playground", href: "/playground", icon: PlayCircle },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border/80 bg-navy-void/90 backdrop-blur-xl flex flex-col justify-between shrink-0 h-screen sticky top-0 z-20">
      <div>
        {/* Holographic VoxForge Brand Mark */}
        <div className="h-16 px-6 flex items-center border-b border-border/60 gap-3">
          <div className="relative h-9 w-9 rounded-lg bg-navy-elevated border border-cyan/40 p-[1px] flex items-center justify-center shadow-glow-cyan/20 group">
            <div className="w-full h-full bg-navy-deep rounded-[7px] flex items-center justify-center relative overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-cyan shadow-glow-cyan animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan/20 to-electric/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Fine Technical Corner Markers */}
            <span className="absolute -top-1 -left-1 w-1.5 h-1.5 border-t border-l border-cyan/60" />
            <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 border-b border-r border-cyan/60" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">VoxForge</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan/15 text-cyan border border-cyan/30 tracking-wider">
                AI
              </span>
            </div>
            <p className="text-[9px] text-text-muted font-mono tracking-widest uppercase">Holographic Studio</p>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono tracking-widest text-text-muted uppercase">
            Workspace
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative font-mono text-xs",
                  isActive
                    ? "bg-navy-elevated text-cyan border border-cyan/30 shadow-glow-cyan/10 font-semibold"
                    : "text-text-secondary hover:text-white hover:bg-navy-elevated/50"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-cyan shadow-glow-cyan" />
                )}
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isActive
                      ? "text-cyan"
                      : "text-text-muted group-hover:text-text-secondary"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Provider Status Indicator */}
      <div className="p-4 border-t border-border/60 bg-navy-void/60">
        <div className="p-3 rounded-lg border border-border/80 bg-navy-elevated/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-mono text-[11px]">Provider State</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse shadow-glow-cyan" />
              <span className="text-[10px] font-mono font-semibold text-cyan tracking-wider uppercase">Standby</span>
            </div>
          </div>
          <p className="text-[10px] text-text-muted leading-relaxed font-mono">
            Holographic voice field engine active. ElevenLabs connects in M4.
          </p>
        </div>
      </div>
    </aside>
  );
}
