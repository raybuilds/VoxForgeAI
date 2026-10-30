"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Percent,
  PhoneForwarded,
  Filter,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { defaultSessionRepository } from "@/lib/repositories/session-repository";
import { defaultSessionService } from "@/lib/services/session-service";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { ConversationSession } from "@/types/agent";
import { SessionMetricsSummary } from "@/types/providers";

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [summary, setSummary] = useState<SessionMetricsSummary | null>(null);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);

  // Filters
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedOutcome, setSelectedOutcome] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");

  const [generatingSamples, setGeneratingSamples] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      try {
        const allAgents = await defaultAgentRepository.list();
        if (ignore) return;
        setAgents(allAgents.map((a) => ({ id: a.id, name: a.config.name })));

        const filter: Parameters<typeof defaultSessionRepository.list>[0] = {};
        if (selectedAgent !== "all") filter.agentId = selectedAgent;
        if (selectedOutcome !== "all") filter.outcome = selectedOutcome as ConversationSession["outcome"];
        if (selectedSource !== "all") filter.source = selectedSource as ConversationSession["source"];

        const list = await defaultSessionRepository.list(filter);
        const metricsSummary = await defaultSessionRepository.getMetricsSummary(filter);

        if (ignore) return;
        setSessions(list);
        setSummary(metricsSummary);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      }
    }

    fetchData();

    return () => {
      ignore = true;
    };
  }, [selectedAgent, selectedOutcome, selectedSource]);

  const handleGenerateSamples = async () => {
    setGeneratingSamples(true);
    try {
      const allAgents = await defaultAgentRepository.list();
      const targetAgent = allAgents[0] || {
        id: "a1a1a1a1-1111-4111-8111-111111111111",
        config: { name: "FrontDesk Pro" },
      };

      await defaultSessionService.seedSampleSessions(targetAgent.id, targetAgent.config.name);
      
      const filter: Parameters<typeof defaultSessionRepository.list>[0] = {};
      if (selectedAgent !== "all") filter.agentId = selectedAgent;
      if (selectedOutcome !== "all") filter.outcome = selectedOutcome as ConversationSession["outcome"];
      if (selectedSource !== "all") filter.source = selectedSource as ConversationSession["source"];

      const list = await defaultSessionRepository.list(filter);
      const metricsSummary = await defaultSessionRepository.getMetricsSummary(filter);
      setSessions(list);
      setSummary(metricsSummary);
    } catch (err) {
      console.error("Failed to seed samples:", err);
    } finally {
      setGeneratingSamples(false);
    }
  };

  const handleClearSessions = async () => {
    if (confirm("Are you sure you want to clear all session records from localStorage?")) {
      await defaultSessionRepository.clear();
      setSessions([]);
      setSummary(await defaultSessionRepository.getMetricsSummary());
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <AppShell
      title="Analytics & Session Observability"
      description="Inspect derived call metrics, outcome distributions, and historical session logs"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Controls & Data Source Banner */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Activity className="w-4 h-4 text-cyan" />
            <span>OBSERVABILITY_SOURCE:</span>
            <span className="text-cyan font-bold">LOCAL_PERSISTENCE (M5_SIMULATED)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateSamples}
              disabled={generatingSamples}
              className="gap-1.5 text-xs text-cyan border-cyan/40 hover:bg-cyan/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan" />
              <span>{generatingSamples ? "Generating..." : "Generate Sample Telemetry"}</span>
            </Button>
            <Link href="/sessions">
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                <span>Open Session Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-text-muted">
              <Filter className="w-3.5 h-3.5 text-cyan" />
              <span>FILTERS:</span>
            </div>

            {/* Agent Selector */}
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="bg-navy-elevated border border-border/80 rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-cyan"
            >
              <option value="all">All Agents ({agents.length})</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            {/* Outcome Filter */}
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="bg-navy-elevated border border-border/80 rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-cyan"
            >
              <option value="all">All Outcomes</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
              <option value="unresolved">Unresolved</option>
              <option value="abandoned">Abandoned</option>
            </select>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-navy-elevated border border-border/80 rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-cyan"
            >
              <option value="all">All Sources</option>
              <option value="simulated">Simulated Mock</option>
              <option value="elevenlabs">ElevenLabs (Future)</option>
            </select>
          </div>

          {sessions.length > 0 && (
            <button
              onClick={handleClearSessions}
              className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
            >
              Clear Telemetry Storage
            </button>
          )}
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Sessions"
            value={summary?.totalSessions ?? 0}
            subtitle={selectedAgent !== "all" ? "Filtered by agent" : "All recorded sessions"}
            icon={BarChart3}
            iconColor="cyan"
            isDemo={true}
          />
          <MetricCard
            title="Resolution Rate"
            value={`${summary?.resolutionRate ?? 0}%`}
            subtitle={`${summary?.resolvedSessions ?? 0} resolved calls`}
            icon={CheckCircle2}
            iconColor="cyan"
            isDemo={true}
          />
          <MetricCard
            title="Escalation Rate"
            value={`${summary?.escalationRate ?? 0}%`}
            subtitle={`${summary?.escalatedSessions ?? 0} supervisor handoffs`}
            icon={PhoneForwarded}
            iconColor="ice"
            isDemo={true}
          />
          <MetricCard
            title="Avg Turn Latency"
            value={summary?.averageLatencyMs ? `${summary.averageLatencyMs} ms` : "N/A"}
            subtitle="Simulated roundtrip response"
            icon={Percent}
            iconColor="ice"
            isDemo={true}
          />
        </div>

        {/* Visual Distributions Grid */}
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono text-xs">
            {/* Outcome Distribution Card */}
            <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-white font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan" /> Outcome Breakdown
                </span>
                <span className="text-[10px] text-cyan">{summary?.totalSessions} TOTAL</span>
              </div>

              <div className="space-y-3">
                {Object.entries(summary?.outcomeDistribution || {}).map(([outcome, count]) => {
                  const pct = Math.round((count / (summary?.totalSessions || 1)) * 100);
                  const isPositive = outcome === "resolved";
                  const isWarning = outcome === "escalated";
                  const isDanger = outcome === "abandoned" || outcome === "failed";

                  return (
                    <div key={outcome} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="capitalize text-text-secondary">{outcome}</span>
                        <span className="text-white">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-navy-elevated overflow-hidden border border-border/50">
                        <div
                          className={`h-full rounded-full ${
                            isPositive
                              ? "bg-cyan shadow-glow-cyan/50"
                              : isWarning
                              ? "bg-amber-400"
                              : isDanger
                              ? "bg-red-400"
                              : "bg-blue-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Agent Volume Distribution */}
            <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-white font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan" /> Call Volume by Agent
                </span>
                <span className="text-[10px] text-cyan">
                  {summary?.agentVolumeDistribution.length} AGENTS
                </span>
              </div>

              <div className="space-y-3">
                {(summary?.agentVolumeDistribution || []).map((ag) => {
                  const pct = Math.round((ag.count / (summary?.totalSessions || 1)) * 100);
                  return (
                    <div key={ag.agentId} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white truncate max-w-[180px]">{ag.agentName}</span>
                        <span className="text-cyan">
                          {ag.count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-navy-elevated overflow-hidden border border-border/50">
                        <div
                          className="h-full rounded-full bg-electric"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Averages */}
            <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-white font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan" /> Duration & Latency
                </span>
                <span className="text-[10px] text-cyan">BENCHMARKS</span>
              </div>

              <div className="space-y-4 pt-1">
                <div className="p-3 rounded-lg border border-border/60 bg-navy-elevated/70 flex items-center justify-between">
                  <span className="text-text-muted">Avg Call Length:</span>
                  <span className="text-white font-bold">
                    {formatSeconds(summary?.averageDurationSeconds || 0)}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-border/60 bg-navy-elevated/70 flex items-center justify-between">
                  <span className="text-text-muted">Agent Response Latency:</span>
                  <span className="text-cyan font-bold">
                    {summary?.averageLatencyMs ? `${summary.averageLatencyMs} ms` : "N/A"}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-border/60 bg-navy-elevated/70 flex items-center justify-between">
                  <span className="text-text-muted">Simulated Provider:</span>
                  <span className="text-white font-semibold">MockSessionProvider</span>
                </div>

                <p className="text-[10px] text-text-muted leading-relaxed">
                  * Note: All latency figures are simulated benchmark values generated in testing mode. Live latency streams will activate in Milestone 7.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No Session Telemetry Recorded"
            description="Interaction telemetry, turn latency benchmarks, and conversation logs will appear once voice interactions or simulated test sessions are executed."
            actionLabel={generatingSamples ? "Generating..." : "Generate Sample Sessions"}
            onAction={handleGenerateSamples}
          />
        )}

        {/* Recent Session Logs Preview */}
        {sessions.length > 0 && (
          <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border/60 pb-2">
              <span className="text-white font-bold uppercase tracking-wider">
                Recent Interaction Records ({sessions.length})
              </span>
              <Link
                href="/sessions"
                className="text-cyan hover:underline flex items-center gap-1 text-[11px]"
              >
                <span>View all in Session Explorer</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-border/50">
              {sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-navy-elevated/40 px-2 rounded transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{s.agentName}</span>
                      <span className="text-[10px] text-text-muted">({s.id.slice(0, 8)})</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded border uppercase font-bold ${
                          s.outcome === "resolved"
                            ? "bg-cyan/10 text-cyan border-cyan/30"
                            : s.outcome === "escalated"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }`}
                      >
                        {s.outcome}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded border border-border/80 bg-navy-elevated text-text-muted">
                        {s.source}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-1 max-w-2xl">
                      {s.summary || "No summary provided."}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-text-muted shrink-0">
                    <span>{formatSeconds(s.metrics.durationSeconds)}</span>
                    <span>{s.metrics.totalMessages} msgs</span>
                    <span>{new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <Link href={`/sessions/${s.id}`}>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]">
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
