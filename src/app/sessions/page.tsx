"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  PhoneCall,
  Clock,
  Sparkles,
  ChevronRight,
  Activity,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { defaultSessionRepository } from "@/lib/repositories/session-repository";
import { defaultSessionService } from "@/lib/services/session-service";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { ConversationSession } from "@/types/agent";

export default function SessionExplorerPage() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOutcome, setSelectedOutcome] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchSessions() {
      try {
        const allAgents = await defaultAgentRepository.list();
        if (ignore) return;
        setAgents(allAgents.map((a) => ({ id: a.id, name: a.config.name })));

        const filter: Parameters<typeof defaultSessionRepository.list>[0] = {
          search: searchQuery || undefined,
          agentId: selectedAgent !== "all" ? selectedAgent : undefined,
          status: selectedStatus !== "all" ? (selectedStatus as ConversationSession["status"]) : undefined,
          outcome: selectedOutcome !== "all" ? (selectedOutcome as ConversationSession["outcome"]) : undefined,
          source: selectedSource !== "all" ? (selectedSource as ConversationSession["source"]) : undefined,
          sort: sortOrder,
        };

        const list = await defaultSessionRepository.list(filter);
        if (ignore) return;
        setSessions(list);
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    }

    fetchSessions();

    return () => {
      ignore = true;
    };
  }, [searchQuery, selectedAgent, selectedStatus, selectedOutcome, selectedSource, sortOrder]);

  const handleGenerateSample = async () => {
    setGenerating(true);
    try {
      const allAgents = await defaultAgentRepository.list();
      const targetAgent = allAgents[0] || {
        id: "a1a1a1a1-1111-4111-8111-111111111111",
        config: { name: "FrontDesk Pro" },
      };

      await defaultSessionService.createSimulatedSession({
        agentId: targetAgent.id,
        agentName: targetAgent.config.name,
        scenarioType: "customer_enquiry",
      });

      const filter: Parameters<typeof defaultSessionRepository.list>[0] = {
        search: searchQuery || undefined,
        agentId: selectedAgent !== "all" ? selectedAgent : undefined,
        status: selectedStatus !== "all" ? (selectedStatus as ConversationSession["status"]) : undefined,
        outcome: selectedOutcome !== "all" ? (selectedOutcome as ConversationSession["outcome"]) : undefined,
        source: selectedSource !== "all" ? (selectedSource as ConversationSession["source"]) : undefined,
        sort: sortOrder,
      };
      const list = await defaultSessionRepository.list(filter);
      setSessions(list);
    } catch (err) {
      console.error("Failed to generate sample:", err);
    } finally {
      setGenerating(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}m ${remaining}s`;
  };

  return (
    <AppShell
      title="Session Explorer"
      description="Inspect individual interaction logs, review full turn transcripts, and audit session outcomes"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Activity className="w-4 h-4 text-cyan" />
            <span>SESSION_EXPLORER //</span>
            <span className="text-white font-bold">{sessions.length} RECORDS FOUND</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerateSample}
              disabled={generating}
              className="gap-1.5 text-xs text-cyan border-cyan/40 hover:bg-cyan/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan" />
              <span>{generating ? "Generating..." : "Generate Test Session"}</span>
            </Button>
            <Link href="/analytics">
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                <span>View Analytics</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md space-y-3 font-mono text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by agent name, session UUID, or conversation summary keywords..."
              className="w-full pl-9 pr-4 py-2 bg-navy-elevated border border-border/80 rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-cyan transition-colors"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[10px] text-text-muted uppercase">Filter:</span>

              {/* Agent Filter */}
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

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-navy-elevated border border-border/80 rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-cyan"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="queued">Queued</option>
                <option value="failed">Failed</option>
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
                <option value="elevenlabs">ElevenLabs (M7)</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-text-muted uppercase">Sort:</span>
              <button
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-navy-elevated border border-border/80 text-cyan hover:border-cyan/50 transition-colors"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Table / List */}
        {sessions.length > 0 ? (
          <div className="rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md overflow-hidden font-mono text-xs">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-3 p-3.5 border-b border-border/80 bg-navy-elevated/70 text-[10px] uppercase tracking-wider text-text-muted font-bold">
              <div className="col-span-4 sm:col-span-3">Agent / ID</div>
              <div className="col-span-4 sm:col-span-4">Summary & Outcome</div>
              <div className="hidden sm:block sm:col-span-2">Duration / Turns</div>
              <div className="hidden sm:block sm:col-span-2">Date / Source</div>
              <div className="col-span-4 sm:col-span-1 text-right">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/60">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-12 gap-3 p-3.5 items-center hover:bg-navy-elevated/40 transition-colors"
                >
                  {/* Agent & ID */}
                  <div className="col-span-4 sm:col-span-3 space-y-1">
                    <span className="text-white font-bold block truncate">{s.agentName}</span>
                    <span className="text-[10px] text-text-muted block truncate font-mono">
                      {s.id.slice(0, 13)}...
                    </span>
                  </div>

                  {/* Summary & Outcome */}
                  <div className="col-span-4 sm:col-span-4 space-y-1">
                    <div className="flex items-center gap-1.5">
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
                      {s.escalation?.occurred && (
                        <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                          ESCALATED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-1">
                      {s.summary || "No summary recorded."}
                    </p>
                  </div>

                  {/* Duration & Turns */}
                  <div className="hidden sm:block sm:col-span-2 space-y-0.5 text-text-muted text-[11px]">
                    <div className="flex items-center gap-1 text-white">
                      <Clock className="w-3 h-3 text-cyan" />
                      <span>{formatSeconds(s.metrics.durationSeconds)}</span>
                    </div>
                    <span>{s.metrics.totalMessages} msgs ({s.metrics.userTurns} user / {s.metrics.agentTurns} agent)</span>
                  </div>

                  {/* Date & Source */}
                  <div className="hidden sm:block sm:col-span-2 space-y-0.5 text-[11px] text-text-muted">
                    <span className="text-white block">
                      {new Date(s.startedAt).toLocaleDateString()}{" "}
                      {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="inline-block px-1.5 py-0.2 rounded border border-border/80 bg-navy-elevated text-[9px] text-text-muted">
                      {s.source}
                    </span>
                  </div>

                  {/* Action Link */}
                  <div className="col-span-4 sm:col-span-1 text-right">
                    <Link href={`/sessions/${s.id}`}>
                      <Button size="sm" variant="outline" className="h-7 px-2.5 text-[10px] gap-1">
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3 text-cyan" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={PhoneCall}
            title="No Matching Sessions Found"
            description="No conversation sessions match your active query filters. Try clearing your filters or generate a sample interaction record."
            actionLabel={generating ? "Generating..." : "Generate Sample Interaction"}
            onAction={handleGenerateSample}
          />
        )}
      </div>
    </AppShell>
  );
}
