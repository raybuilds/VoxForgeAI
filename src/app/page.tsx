"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bot,
  Globe2,
  PhoneCall,
  Percent,
  Plus,
  PlayCircle,
  ArrowRight,
  CheckCircle2,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { VoiceField } from "@/components/visual/voice-field";
import { VoiceOrb } from "@/components/voice/voice-orb";
import { AudioWaveVisualizer } from "@/components/voice/audio-wave-visualizer";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { defaultSessionRepository } from "@/lib/repositories/session-repository";
import { Agent } from "@/types";
import { ConversationSession } from "@/types/agent";

export default function OverviewPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [hasDemo, setHasDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [list, demoPresent, allSessions] = await Promise.all([
        defaultAgentRepository.list(),
        defaultAgentRepository.hasDemoData(),
        defaultSessionRepository.getAll(),
      ]);
      setAgents(list);
      setHasDemo(demoPresent);
      setSessions(allSessions);
    } catch (err) {
      console.error("Failed to load repo data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      defaultAgentRepository.list(),
      defaultAgentRepository.hasDemoData(),
      defaultSessionRepository.getAll(),
    ]).then(([list, demoPresent, allSessions]) => {
      if (isMounted) {
        setAgents(list);
        setHasDemo(demoPresent);
        setSessions(allSessions);
        setLoading(false);
      }
    });

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
  const totalSessions = sessions.length;
  const resolvedCount = sessions.filter((s) => s.outcome === "resolved").length;
  const successRate = totalSessions > 0 ? `${Math.round((resolvedCount / totalSessions) * 100)}%` : "—";

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Cinematic Voice Field Hero Stage */}
        <VoiceField
          state="cinematic"
          intensity="cinematic"
          showParticles={true}
          showRibbons={true}
          showWaveform={true}
          overlayOpacity={0.4}
          className="rounded-2xl border border-cyan/30 shadow-2xl p-8 md:p-12 relative overflow-hidden group"
        >
          {/* Subtle Top HUD Tech Line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Hero Statement (8 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/15 border border-cyan/40 text-xs font-mono font-semibold text-cyan shadow-glow-cyan/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
                <span>VOICE SYNTHESIS INTELLIGENCE</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Give your ideas a <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan via-teal to-electric">voice.</span>
              </h1>
              <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-xl">
                Describe an autonomous voice agent in plain language. VoxForge compiles 
                the persona, system prompts, guardrails, and conversation steps ready for low-latency ElevenLabs deployment.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <Link href="/create">
                  <Button size="lg" className="gap-2.5 px-6 shadow-glow-cyan">
                    <Plus className="w-4 h-4 text-navy-void" />
                    <span>Create Agent</span>
                  </Button>
                </Link>
                <Link href="/playground">
                  <Button variant="secondary" size="lg" className="gap-2.5 px-6">
                    <PlayCircle className="w-4 h-4 text-cyan" />
                    <span>Open Playground</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Holographic Showcase (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl border border-cyan/25 bg-navy-void/70 backdrop-blur-xl shadow-hud-card space-y-4 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-cyan/10 blur-xl pointer-events-none" />
              <VoiceOrb state="speaking" size="lg" accessibleLabel="Holographic voice intelligence preview" />
              <div className="w-full max-w-xs space-y-1.5">
                <AudioWaveVisualizer mode="ambient" density="normal" barCount={23} />
                <div className="flex items-center justify-center gap-2 pt-1 font-mono text-[10px] text-cyan/90 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                  <span>Holographic Stage Ready</span>
                </div>
              </div>
            </div>
          </div>
        </VoiceField>

        {/* Demo Data Control Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md text-xs font-mono">
          <div className="flex items-center gap-2 text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan shadow-glow-cyan"></span>
            <span>
              PERSISTENT STORAGE:{" "}
              <strong className="text-white">
                {hasDemo ? "DEMO TELEMETRY ACTIVE" : "CUSTOM WORKSPACE (CLEAN)"}
              </strong>
            </span>
          </div>
          {hasDemo ? (
            <button
              onClick={handleClearDemo}
              className="text-amber-400 hover:text-white font-mono cursor-pointer underline underline-offset-4 transition-colors"
            >
              [Clear Built-in Demo Records]
            </button>
          ) : (
            <button
              onClick={handleRestoreDemo}
              className="text-cyan hover:text-white font-mono cursor-pointer underline underline-offset-4 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3 text-cyan" />
              <span>[Restore Demo Agents]</span>
            </button>
          )}
        </div>

        {/* Metric KPI Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Agents"
            value={totalAgents}
            subtitle={totalAgents > 0 ? `${publishedAgents} Published • ${totalAgents - publishedAgents} In Dev` : "No agents created yet"}
            icon={Bot}
            iconColor="cyan"
            isDemo={hasDemo}
          />
          <MetricCard
            title="Published Agents"
            value={publishedAgents}
            subtitle={publishedAgents > 0 ? "Production voice models" : "Awaiting first agent publish"}
            icon={Globe2}
            iconColor="ice"
            isDemo={hasDemo}
          />
          <MetricCard
            title="Test Sessions"
            value={totalSessions}
            subtitle={totalSessions > 0 ? "Playground voice calls" : "No sessions logged"}
            icon={PhoneCall}
            iconColor="cyan"
            isDemo={hasDemo}
          />
          <MetricCard
            title="Success Rate"
            value={successRate}
            subtitle="Zero premature dropouts"
            icon={Percent}
            iconColor="ice"
            isDemo={hasDemo}
          />
        </div>

        {/* 3-Step Architecture Pipeline */}
        <div className="p-6 rounded-2xl border border-border/80 bg-navy-deep/70 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                Autonomous Voice Pipeline
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                From natural-language instruction to low-latency production telephony
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan/70 border border-cyan/30 px-2 py-0.5 rounded">
              SPEC v1.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/60 hover:border-cyan/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan">01 // DEFINE</span>
                <Sliders className="w-3.5 h-3.5 text-text-muted group-hover:text-cyan transition-colors" />
              </div>
              <h4 className="text-sm font-semibold text-white">Describe in Plain Language</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Enter your business goals, persona, required questions, and escalation handoff triggers.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/60 hover:border-cyan/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-electric">02 // VERIFY</span>
                <PlayCircle className="w-3.5 h-3.5 text-text-muted group-hover:text-electric transition-colors" />
              </div>
              <h4 className="text-sm font-semibold text-white">Test in Voice Console</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Inspect latency, interruption handling, and response accuracy in the browser playground.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/60 hover:border-cyan/40 transition-colors space-y-2 group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-teal">03 // DEPLOY</span>
                <Globe2 className="w-3.5 h-3.5 text-text-muted group-hover:text-teal transition-colors" />
              </div>
              <h4 className="text-sm font-semibold text-white">Export to ElevenLabs</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Synchronize directly to ElevenLabs Conversational Agents for web and telephony calls.
              </p>
            </div>
          </div>
        </div>

        {/* Content Split: Recent Agents & Recent Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Agents (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Active Voice Agents
                </h3>
                <p className="text-xs text-text-muted">Configured conversational assistants</p>
              </div>
              <Link
                href="/agents"
                className="text-xs font-mono text-cyan hover:text-white flex items-center gap-1 transition-colors"
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

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href="/playground">
                          <Button size="sm" variant="secondary" className="gap-1.5">
                            <PlayCircle className="w-3 h-3 text-cyan" />
                            <span>Test</span>
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

          {/* Recent Sessions (1 col) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
                  Recent Telemetry
                </h3>
                <p className="text-xs text-text-muted">Completed playground sessions</p>
              </div>
              <Link
                href="/analytics"
                className="text-xs font-mono text-cyan hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Analytics</span>
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
                    className="p-3.5 rounded-xl border border-border/70 bg-navy-deep/70 backdrop-blur-md space-y-2 hover:border-cyan/30 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white font-mono">{session.agentName}</span>
                      <Badge variant="cyan" className="text-[9px] px-1.5 py-0">
                        {session.metrics.durationSeconds}s
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-2">
                      {session.summary ?? "Session completed."}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-1 border-t border-border/50">
                      <span>{session.metrics.userTurns + session.metrics.agentTurns} TURNS</span>
                      <span className="flex items-center gap-1 text-teal font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
