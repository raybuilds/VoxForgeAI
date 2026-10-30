"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bot,
  Globe2,
  PhoneCall,
  Plus,
  PlayCircle,
  ArrowRight,
  Sliders,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { defaultSessionRepository } from "@/lib/repositories/session-repository";
import { Agent } from "@/types";
import { ConversationSession } from "@/types/agent";

export default function OverviewPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [hasDemo, setHasDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [agentList, demoPresent, sessionList] = await Promise.all([
        defaultAgentRepository.list(),
        defaultAgentRepository.hasDemoData(),
        defaultSessionRepository.list({ limit: 4 }),
      ]);
      setAgents(agentList);
      setHasDemo(demoPresent);
      setSessions(sessionList);
    } catch (err) {
      console.error("Failed to load repo data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [agentList, demoPresent, sessionList] = await Promise.all([
          defaultAgentRepository.list(),
          defaultAgentRepository.hasDemoData(),
          defaultSessionRepository.list({ limit: 4 }),
        ]);
        if (isMounted) {
          setAgents(agentList);
          setHasDemo(demoPresent);
          setSessions(sessionList);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load repo data:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClearDemo = async () => {
    await defaultAgentRepository.clearDemoData();
    await loadData();
  };

  const handleRestoreDemo = async () => {
    await defaultAgentRepository.resetToDemo();
    await loadData();
  };

  const totalAgents = agents.length;
  const publishedAgents = agents.filter((a) => a.status === "published").length;

  return (
    <div className="min-h-screen bg-navy-void text-text-primary selection:bg-cyan/20 selection:text-cyan flex flex-col font-sans">
      {/* =========================================================================
          SECTION 1: MINIMAL CONCEPT HEADER (Exact Reference A Layout)
          - Left: VoxForge Brand Mark & Title + VOICE INTELLIGENCE STUDIO Subtitle
          - Right: Navigation Links + Concept Indicator
      ========================================================================== */}
      <header className="h-16 px-6 md:px-12 flex items-center justify-between border-b border-border/60 bg-navy-void/70 backdrop-blur-md sticky top-0 z-40">
        {/* Brand Mark */}
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-lg bg-navy-elevated border border-cyan/40 p-[1px] flex items-center justify-center shadow-glow-cyan/20">
            <div className="w-full h-full bg-navy-deep rounded-[6px] flex items-center justify-center relative overflow-hidden">
              <span className="w-2 h-2 rounded-full bg-cyan shadow-glow-cyan animate-pulse" />
            </div>
            {/* Fine Corner Accents */}
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t border-l border-cyan" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 border-b border-r border-cyan" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-sm uppercase">VoxForge</span>
              <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-cyan/15 text-cyan border border-cyan/30">
                AI
              </span>
            </div>
            <p className="text-[8px] text-text-muted font-mono tracking-widest uppercase">
              Voice Intelligence Studio
            </p>
          </div>
        </div>

        {/* Header Right Nav */}
        <div className="flex items-center text-xs font-mono">
          <nav className="flex items-center gap-6 text-text-secondary">
            <Link href="/agents" className="hover:text-cyan transition-colors">
              My Agents
            </Link>
            <Link href="/create" className="hover:text-cyan transition-colors">
              Create
            </Link>
            <Link href="/playground" className="hover:text-cyan transition-colors">
              Playground
            </Link>
            <Link href="/sessions" className="hover:text-cyan transition-colors">
              Sessions
            </Link>
            <Link href="/analytics" className="hover:text-cyan transition-colors">
              Analytics
            </Link>
          </nav>
        </div>
      </header>

      {/* =========================================================================
          SECTION 2: VIDEO-LED CINEMATIC HERO
          - Full-screen background video (`overview.mp4`) with autoPlay, muted, loop
          - Dark fallback background if video fails or reduced-motion is requested
          - Restrained gradient overlays for optimal text readability
          - Clean geometric typography matching original concept art
          - Centered Headline: "Give your ideas a voice."
          - Centered Subtitle: "Describe an agent. Shape its intelligence. Hear it come alive."
          - Centered Actions: Create Agent & Open Playground
          - Bottom Statistics: 3 minimalist indicators directly above fold
      ========================================================================== */}
      <section className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-between px-4 py-8 sm:py-12 md:py-16 text-center overflow-hidden">
        {/* Full-Viewport Background Video Layer */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none select-none overflow-hidden bg-navy-void z-0"
        >
          {!prefersReducedMotion ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            >
              <source src="/visuals/overview.mp4" type="video/mp4" />
            </video>
          ) : (
            // Simple clean dark fallback when reduced motion is preferred
            <div className="absolute inset-0 bg-navy-void" />
          )}

          {/* Restrained dark gradients to ensure contrast without obscuring video atmosphere */}
          <div className="absolute inset-0 bg-navy-void/45 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,8,16,0.5)_60%,#030810_95%)] pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-navy-void via-navy-void/80 to-transparent pointer-events-none" />
        </div>

        {/* Top spacer to balance vertical distribution */}
        <div className="hidden sm:block sm:h-8 md:h-12" />

        {/* Central Content Container (Typography & Primary Actions) */}
        <div className="relative z-20 max-w-4xl mx-auto flex flex-col items-center space-y-7 sm:space-y-9 my-auto pt-6">
          {/* Main Headline */}
          <div className="space-y-4 sm:space-y-5">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[-0.035em] text-white font-sans leading-none">
              Give your ideas a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan via-teal to-electric drop-shadow-[0_0_35px_rgba(0,229,255,0.65)]">
                voice.
              </span>
            </h1>

            {/* Supporting Text with added breathing room and enhanced readability */}
            <p className="text-sm sm:text-base md:text-lg text-text-secondary font-mono max-w-xl mx-auto leading-relaxed pt-1">
              Describe an agent. Shape its intelligence. Hear it come alive.
            </p>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 pt-1 sm:pt-2">
            <Link href="/create">
              <Button size="lg" className="h-11 sm:h-12 px-7 sm:px-8 text-sm gap-2.5 shadow-glow-cyan font-mono">
                <Plus className="w-4 h-4 text-navy-void" />
                <span>Create Agent</span>
              </Button>
            </Link>

            <Link href="/playground">
              <Button
                variant="secondary"
                size="lg"
                className="h-11 sm:h-12 px-7 sm:px-8 text-sm gap-2.5 border border-cyan/40 bg-navy-elevated/80 hover:bg-navy-elevated text-cyan font-mono"
              >
                <PlayCircle className="w-4 h-4 text-cyan" />
                <span>Open Playground</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Statistics (3 Clean KPIs directly above the fold with enhanced contrast & readability) */}
        <div className="relative z-20 w-full max-w-2xl pt-8 sm:pt-10 pb-4">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-cyan/20 font-mono text-center">
            <div className="space-y-1 sm:space-y-1.5">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white block tracking-tight">
                {totalAgents > 0 ? (totalAgents < 10 ? `0${totalAgents}` : totalAgents) : "00"}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider block drop-shadow-sm">
                Configured Agents
              </span>
            </div>

            <div className="space-y-1 sm:space-y-1.5 border-x border-cyan/20">
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-cyan block tracking-tight">
                {publishedAgents < 10 ? `0${publishedAgents}` : publishedAgents}
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider block drop-shadow-sm">
                Published Models
              </span>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan shadow-glow-cyan animate-pulse" />
                <span>Standby</span>
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider block drop-shadow-sm">
                Voice Engine (M5)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: WORKSPACE OPERATIONS & DASHBOARD (Secondary Overview)
          - Persistent Storage Switcher (Clear / Restore Demo Data)
          - 3-Step Autonomous Voice Pipeline
          - Active Voice Agents Grid
          - Recent Telemetry Stream
      ========================================================================== */}
      <section className="border-t border-border/80 bg-navy-void/90 relative z-30 px-6 md:px-12 py-12 space-y-10 max-w-7xl mx-auto w-full">
        {/* Workspace Subheading Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan" />
            <span className="text-white font-bold uppercase tracking-wider">
              Workspace Overview & Operations
            </span>
          </div>

          <div className="flex items-center gap-4 text-text-secondary">
            <span>
              PERSISTENCE:{" "}
              <strong className="text-white">
                {hasDemo ? "DEMO TELEMETRY ACTIVE" : "CLEAN STORAGE"}
              </strong>
            </span>
            {hasDemo ? (
              <button
                onClick={handleClearDemo}
                className="text-amber-400 hover:text-white underline transition-colors cursor-pointer"
              >
                [Clear Demo Records]
              </button>
            ) : (
              <button
                onClick={handleRestoreDemo}
                className="text-cyan hover:text-white underline transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>[Restore Demo Agents]</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-Step Pipeline Card */}
        <div className="p-6 rounded-2xl border border-border/80 bg-navy-deep/70 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 font-mono">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Autonomous Voice Pipeline
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                From natural-language instruction to low-latency production telephony
              </p>
            </div>
            <span className="text-[10px] text-cyan/70 border border-cyan/30 px-2 py-0.5 rounded">
              SPEC v1.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 font-mono">
            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/60 hover:border-cyan/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan">01 // DEFINE</span>
                <Sliders className="w-3.5 h-3.5 text-text-muted group-hover:text-cyan transition-colors" />
              </div>
              <h4 className="text-sm font-semibold text-white">Describe in Plain Language</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Enter your business goals, persona, required questions, and escalation handoff triggers.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/60 hover:border-cyan/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-electric">02 // VERIFY</span>
                <PlayCircle className="w-3.5 h-3.5 text-text-muted group-hover:text-electric transition-colors" />
              </div>
              <h4 className="text-sm font-semibold text-white">Test in Voice Console</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Inspect latency, interruption handling, and response accuracy in the browser playground.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/60 hover:border-cyan/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal">03 // DEPLOY</span>
                <Globe2 className="w-3.5 h-3.5 text-text-muted group-hover:text-teal transition-colors" />
              </div>
              <h4 className="text-sm font-semibold text-white">Export to ElevenLabs</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Synchronize directly to ElevenLabs Conversational Agents for web and telephony calls.
              </p>
            </div>
          </div>
        </div>

        {/* Content Split: Active Voice Agents & Recent Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Voice Agents (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between font-mono">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Active Voice Agents ({agents.length})
                </h3>
                <p className="text-xs text-text-muted">Configured conversational assistants</p>
              </div>
              <Link
                href="/agents"
                className="text-xs text-cyan hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>View All Agents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-cyan">
                READING_AGENT_REGISTRY...
              </div>
            ) : agents.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No Agents in Workspace"
                description="Synthesize your first voice agent by providing a prompt specification."
                actionLabel="Create Agent"
                actionHref="/create"
              />
            ) : (
              <div className="space-y-3">
                {agents.slice(0, 5).map((agent) => {
                  const isDemo = defaultAgentRepository.isDemoAgent(agent.id);

                  return (
                    <div
                      key={agent.id}
                      className="p-4 rounded-xl border border-border/70 bg-navy-deep/70 backdrop-blur-md hover:border-cyan/40 transition-all flex items-start justify-between gap-4 group"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <Link
                            href={`/agents/${agent.id}`}
                            className="font-semibold text-white group-hover:text-cyan transition-colors text-sm truncate font-mono"
                          >
                            {agent.config.name}
                          </Link>
                          <Badge variant={agent.status as "published" | "draft" | "testing"}>
                            {agent.status}
                          </Badge>
                          {isDemo && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border border-cyan/40 bg-cyan/10 text-cyan">
                              DEMO
                            </span>
                          )}
                          <span className="text-[10px] text-text-muted font-mono">
                            v{agent.version}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-1 leading-relaxed">
                          {agent.config.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted">
                          <span>LANG: {agent.config.language}</span>
                          <span>•</span>
                          <span>{agent.config.goals.length} GOALS</span>
                          <span>•</span>
                          <span>UPDATED {new Date(agent.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <Link href={`/agents/${agent.id}/refine`}>
                          <Button size="sm" variant="secondary" className="gap-1.5">
                            <Sparkles className="w-3 h-3 text-cyan" />
                            <span>Refine</span>
                          </Button>
                        </Link>
                        <Link href={`/agents/${agent.id}/edit`}>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Telemetry (1 col) */}
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Recent Telemetry
                </h3>
                <p className="text-xs text-text-muted">Completed interaction records</p>
              </div>
              <Link
                href="/sessions"
                className="text-xs text-cyan hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Sessions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {sessions.length === 0 ? (
              <EmptyState
                icon={PhoneCall}
                title="No Sessions Logged"
                description="Test sessions will appear here after running your agents in the Voice Playground."
                actionLabel="Open Playground"
                actionHref="/playground"
              />
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-navy-deep/70 backdrop-blur-md space-y-2 hover:border-cyan/30 transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{session.agentName}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${
                          session.outcome === "resolved"
                            ? "bg-cyan/10 text-cyan border-cyan/30"
                            : session.outcome === "escalated"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        {session.outcome}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {session.summary ?? "Interaction completed."}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-border/50">
                      <span>{session.metrics.totalMessages} TURNS</span>
                      <span>{Math.floor(session.metrics.durationSeconds / 60)}m {session.metrics.durationSeconds % 60}s</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 px-6 md:px-12 text-center text-xs font-mono text-text-muted bg-navy-void">
        <p>VoxForge AI — Autonomous Voice Intelligence Architecture. Milestone 5 Complete.</p>
      </footer>
    </div>
  );
}
