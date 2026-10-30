"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  User,
  Clock,
  PhoneForwarded,
  ShieldAlert,
  AlertCircle,
  Activity,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { defaultSessionRepository } from "@/lib/repositories/session-repository";
import { ConversationSession } from "@/types/agent";

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [session, setSession] = useState<ConversationSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      setLoading(true);
      try {
        const found = await defaultSessionRepository.getById(sessionId);
        setSession(found);
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [sessionId]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}m ${remaining}s`;
  };

  if (loading) {
    return (
      <AppShell title="Session Telemetry Inspector" description="Loading session record...">
        <div className="flex items-center justify-center p-24 text-cyan font-mono text-xs">
          INITIALIZING_SESSION_TELEMETRY...
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Session Not Found" description="The requested interaction record does not exist">
        <div className="max-w-md mx-auto text-center py-16 space-y-4 font-mono">
          <AlertCircle className="w-12 h-12 text-cyan mx-auto" />
          <h2 className="text-lg font-bold text-white">Interaction Record Not Found</h2>
          <p className="text-xs text-text-muted">
            The session ID may be invalid or was cleared from local persistent storage.
          </p>
          <Link href="/sessions">
            <Button size="sm">Back to Session Explorer</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Session Inspector // ${session.id.slice(0, 13)}...`}
      description={`Detailed interaction record for ${session.agentName} recorded at ${new Date(session.startedAt).toLocaleString()}`}
    >
      <div className="space-y-6 max-w-5xl mx-auto font-mono text-xs">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-cyan transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Session Explorer</span>
          </Link>

          <Link href={`/agents/${session.agentId}`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-[11px]">
              <Bot className="w-3.5 h-3.5 text-cyan" />
              <span>View Agent Config</span>
            </Button>
          </Link>
        </div>

        {/* Overview Header Banner */}
        <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan/60 to-transparent" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-navy-elevated border border-cyan/40 flex items-center justify-center text-cyan shrink-0 shadow-glow-cyan/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{session.agentName}</h2>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                      session.outcome === "resolved"
                        ? "bg-cyan/10 text-cyan border-cyan/30"
                        : session.outcome === "escalated"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-red-500/10 text-red-400 border-red-500/30"
                    }`}
                  >
                    {session.outcome}
                  </span>
                  <span className="text-[10px] text-text-muted bg-navy-elevated px-2 py-0.5 rounded border border-border/80">
                    STATUS: {session.status.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-cyan bg-cyan/10 px-2 py-0.5 rounded border border-cyan/30">
                    SOURCE: {session.source.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-1 max-w-2xl leading-relaxed">
                  {session.summary || "No summary provided."}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-1 text-[11px] text-text-muted shrink-0">
              <span>STARTED: <strong className="text-white">{new Date(session.startedAt).toLocaleTimeString()}</strong></span>
              <span>ENDED: <strong className="text-white">{session.endedAt ? new Date(session.endedAt).toLocaleTimeString() : "In progress"}</strong></span>
              <span>DURATION: <strong className="text-cyan">{formatSeconds(session.metrics.durationSeconds)}</strong></span>
            </div>
          </div>
        </div>

        {/* Escalation Alert Card (if applicable) */}
        {session.escalation?.occurred && (
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-xs uppercase tracking-wider">
              <PhoneForwarded className="w-4 h-4" />
              <span>Escalation Telemetry Captured</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
              <div>
                <span className="text-text-muted block text-[10px]">TRIGGER REASON:</span>
                <span className="text-white font-semibold">{session.escalation.reason}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">DESTINATION TARGET:</span>
                <span className="text-cyan font-semibold">{session.escalation.target}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">ESCALATED AT:</span>
                <span className="text-white">
                  {session.escalation.escalatedAt
                    ? new Date(session.escalation.escalatedAt).toLocaleTimeString()
                    : "Mid-session"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/80 bg-navy-elevated/70">
            <span className="text-[10px] text-text-muted uppercase block">Total Messages</span>
            <span className="text-lg font-bold text-white">{session.metrics.totalMessages}</span>
          </div>
          <div className="p-3 rounded-lg border border-border/80 bg-navy-elevated/70">
            <span className="text-[10px] text-text-muted uppercase block">Agent / User Turns</span>
            <span className="text-lg font-bold text-cyan">
              {session.metrics.agentTurns} / {session.metrics.userTurns}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border/80 bg-navy-elevated/70">
            <span className="text-[10px] text-text-muted uppercase block">Avg Turn Latency</span>
            <span className="text-lg font-bold text-ice">
              {session.metrics.averageLatencyMs ? `${session.metrics.averageLatencyMs} ms` : "N/A"}
            </span>
          </div>
          <div className="p-3 rounded-lg border border-border/80 bg-navy-elevated/70">
            <span className="text-[10px] text-text-muted uppercase block">First-Response Latency</span>
            <span className="text-lg font-bold text-cyan">
              {session.metrics.firstResponseLatencyMs ? `${session.metrics.firstResponseLatencyMs} ms` : "N/A"}
            </span>
          </div>
        </div>

        {/* Conversation Transcript */}
        <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-white font-bold tracking-wider uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan" /> Conversation Turn Transcript ({session.transcript.length})
            </span>
            <span className="text-[10px] text-text-muted">CHRONOLOGICAL ORDER</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {session.transcript.map((msg, idx) => {
              const isAgent = msg.role === "agent";
              const isSystem = msg.role === "system";

              if (isSystem) {
                return (
                  <div
                    key={msg.id || idx}
                    className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-300 text-[11px] flex items-center gap-2 font-mono"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>{msg.text}</span>
                    <span className="text-[9px] text-text-muted ml-auto">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isAgent ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-text-muted">
                    {isAgent ? (
                      <span className="flex items-center gap-1 text-cyan font-bold">
                        <Bot className="w-3 h-3" /> {session.agentName}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-white font-bold">
                        <User className="w-3 h-3" /> CALLER
                      </span>
                    )}
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    {msg.latencyMs && (
                      <span className="text-[9px] text-cyan/70">({msg.latencyMs}ms)</span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-xl p-3 leading-relaxed ${
                      isAgent
                        ? "bg-navy-elevated text-text-primary border border-border/80"
                        : "bg-cyan/15 text-white border border-cyan/40 shadow-glow-cyan/10"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
