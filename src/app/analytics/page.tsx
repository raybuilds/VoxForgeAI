"use client";

import { useState } from "react";
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Percent,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/ui/metric-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DEMO_SESSIONS } from "@/lib/demo-data";
import { ConversationSession } from "@/types";

export default function AnalyticsPage() {
  const [sessions] = useState<ConversationSession[]>(DEMO_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<ConversationSession | null>(
    DEMO_SESSIONS[0] ?? null
  );

  return (
    <AppShell
      title="Analytics // Session Telemetry"
      description="Inspect call transcripts, duration benchmarks, and agent outcome performance"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Sessions"
            value={sessions.length}
            subtitle="Browser test sessions"
            icon={BarChart3}
            iconColor="cyan"
            isDemo
          />
          <MetricCard
            title="Avg Duration"
            value="3m 32s"
            subtitle="Mean call length"
            icon={Clock}
            iconColor="ice"
            isDemo
          />
          <MetricCard
            title="Completed Rate"
            value="100%"
            subtitle="No premature dropouts"
            icon={CheckCircle2}
            iconColor="cyan"
            isDemo
          />
          <MetricCard
            title="Avg Turn Latency"
            value="400 ms"
            subtitle="Roundtrip agent response"
            icon={Percent}
            iconColor="ice"
            isDemo
          />
        </div>

        {/* Sessions & Transcript Inspection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white font-mono uppercase tracking-wider">
                Recorded Telemetry
              </h3>
              <span className="text-[10px] font-mono text-cyan">
                {sessions.length} SESSIONS
              </span>
            </div>

            {sessions.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="No Sessions Logged"
                description="Completed playground and production sessions will be archived here."
              />
            ) : (
              <div className="space-y-2.5">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedSession?.id === s.id
                        ? "border-cyan/60 bg-navy-elevated/90 shadow-glow-cyan/15"
                        : "border-border/70 bg-navy-deep/80 hover:border-cyan/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white font-mono">{s.agentName}</span>
                      <Badge variant="cyan" className="text-[9px] px-1.5 py-0">
                        {s.metrics.durationSeconds}s
                      </Badge>
                    </div>
                    <p className="text-xs text-text-secondary line-clamp-1 mb-2">
                      {s.summary || "Conversation completed without notes."}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-border/50">
                      <span>{new Date(s.startedAt).toLocaleDateString()}</span>
                      <span className="text-teal font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-teal" />
                        {s.metrics.outcome}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Transcript Viewer */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-5 space-y-4">
                <div className="flex flex-row items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base text-white font-bold font-mono">{selectedSession.agentName}</span>
                      <Badge variant="cyan">Test Session</Badge>
                    </div>
                    <p className="text-xs text-text-muted font-mono mt-0.5">
                      SESSION ID: {selectedSession.id} • STARTED:{" "}
                      {new Date(selectedSession.startedAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="text-right text-xs font-mono text-text-muted">
                    <div>
                      LATENCY:{" "}
                      <strong className="text-cyan">
                        {selectedSession.metrics.averageLatencyMs} ms
                      </strong>
                    </div>
                    <div>
                      TURNS:{" "}
                      <strong className="text-white">
                        {selectedSession.metrics.userTurns +
                          selectedSession.metrics.agentTurns}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider mb-1">
                      Executive Summary
                    </h4>
                    <p className="text-xs text-text-primary bg-navy-elevated/70 p-3 rounded-lg border border-border/60 font-mono leading-relaxed">
                      {selectedSession.summary || "No executive summary available."}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Verbatim Transcript ({selectedSession.transcript.length} turns)
                    </h4>
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {selectedSession.transcript.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg text-xs leading-relaxed font-mono ${
                            msg.role === "agent"
                              ? "bg-navy-elevated/90 border border-cyan/30 text-white ml-4 shadow-glow-cyan/5"
                              : "bg-navy-void/70 border border-border/60 text-text-primary mr-4"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
                            <span className="font-bold uppercase tracking-wider text-cyan">
                              {msg.role === "agent" ? "// Agent" : "// User"}
                            </span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Select a Session"
                description="Pick a conversation session from the left to view metrics and transcripts."
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
