"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PlayCircle,
  AlertTriangle,
  Radio,
  Sliders,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceField } from "@/components/visual/voice-field";
import { VoiceOrb, VoiceOrbState } from "@/components/voice/voice-orb";
import { AudioWaveVisualizer } from "@/components/voice/audio-wave-visualizer";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { defaultSessionService } from "@/lib/services/session-service";
import { Agent } from "@/types";
import { ConversationSession } from "@/types/agent";

export default function VoicePlaygroundPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [createdSession, setCreatedSession] = useState<ConversationSession | null>(null);

  useEffect(() => {
    async function loadAgents() {
      const list = await defaultAgentRepository.list();
      setAgents(list);
      if (list.length > 0) {
        setSelectedAgentId(list[0].id);
      }
    }
    loadAgents();
  }, []);

  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) ?? agents[0];

  // In accordance with Stage 2.3 honesty rules, disconnected state maps to ready/standby
  const orbState: VoiceOrbState = isSimulating ? "processing" : "ready";

  const handleStartSession = () => {
    alert(
      "Notice: The Voice Provider audio link is scheduled for Milestone 7 (ElevenLabs WebSockets). To test session logging and observability now, click 'Run Simulated Interaction' below."
    );
  };

  const handleRunSimulatedSession = async (
    scenario: "appointment_booking" | "customer_enquiry" | "complaint_escalation"
  ) => {
    if (!selectedAgent) return;
    setIsSimulating(true);
    setCreatedSession(null);

    try {
      const session = await defaultSessionService.createSimulatedSession({
        agentId: selectedAgent.id,
        agentName: selectedAgent.config.name,
        scenarioType: scenario,
      });
      setCreatedSession(session);
    } catch (err) {
      console.error("Failed to run simulated session:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <AppShell
      title="Voice Playground"
      description="Interactive real-time audio testing console for agent verification and session generation"
    >
      <div className="space-y-6 max-w-6xl mx-auto font-mono">
        {/* Main Holographic Voice Studio Console */}
        <VoiceField
          state={isSimulating ? "speaking" : "listening"}
          intensity="cinematic"
          showParticles={true}
          showRibbons={true}
          showWaveform={true}
          overlayOpacity={0.35}
          className="rounded-2xl border border-cyan/40 p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Top HUD accent indicator */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan/80 to-transparent" />

          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto">
            {/* Luminous Voice Orb with Visual Depth */}
            <div className="py-2">
              <VoiceOrb
                state={orbState}
                size="lg"
                accessibleLabel={`Voice Assistant ${selectedAgent?.config.name || "Agent"} in holographic stage`}
              />
            </div>

            {/* Agent Identity & Metadata */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2.5">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight font-mono">
                  {selectedAgent?.config.name || "Loading Agent..."}
                </h2>
                {selectedAgent && (
                  <Badge variant={selectedAgent.status as "published" | "draft" | "testing"}>
                    {selectedAgent.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                {selectedAgent?.config.description || "Voice Conversational Agent"}
              </p>
            </div>

            {/* Harmonic Audio Waveform integrated under the Orb */}
            <div className="w-full max-w-xs py-1">
              <AudioWaveVisualizer mode={isSimulating ? "reactive" : "ambient"} density="normal" barCount={25} />
            </div>

            {/* Session Controller Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleStartSession}
                size="md"
                className="gap-2 px-6 shadow-glow-cyan"
              >
                <PlayCircle className="w-4 h-4 text-navy-void" />
                <span>Start Audio Link</span>
              </Button>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-void/80 border border-cyan/30 text-xs text-cyan font-mono backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-cyan shadow-glow-cyan" />
                <span>STANDBY // M7 ELEVENLABS AUDIO</span>
              </div>
            </div>
          </div>
        </VoiceField>

        {/* Technical Provider Status Strip */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-navy-deep/70 backdrop-blur-md text-xs font-mono text-text-secondary flex items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-cyan mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-white">OBSERVABILITY STATUS:</strong> M5 Session telemetry and interaction logging is active in local storage. Audio WebSockets connect in M7.
            </span>
          </div>
          <Badge variant="cyan" className="shrink-0 text-[10px]">
            OBSERVABILITY ACTIVE
          </Badge>
        </div>

        {/* Simulation Success Toast */}
        {createdSession && (
          <div className="p-4 rounded-xl border border-cyan/40 bg-cyan/10 text-cyan text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-cyan" />
              <span>
                Simulated interaction session recorded for <strong>{createdSession.agentName}</strong> ({createdSession.metrics.totalMessages} turns, outcome: {createdSession.outcome.toUpperCase()}).
              </span>
            </div>
            <Link href={`/sessions/${createdSession.id}`}>
              <Button size="sm" variant="secondary" className="gap-1 text-[11px] shrink-0">
                <span>Inspect in Session Telemetry</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        )}

        {/* Configuration & Simulated Telemetry Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Agent Selector & Studio Telemetry */}
          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono uppercase tracking-wide border-b border-border/60 pb-3">
                <Sliders className="w-4 h-4 text-cyan" />
                <span>Agent Configuration</span>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                  Select Active Agent
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full bg-navy-elevated border border-cyan/20 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan transition-colors cursor-pointer"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.config.name} ({agent.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAgent && (
                <div className="p-3 rounded-lg border border-border/60 bg-navy-elevated/60 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Language:</span>
                    <span className="text-white">{selectedAgent.config.language}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Voice ID:</span>
                    <span className="text-cyan truncate max-w-[130px]">
                      {selectedAgent.config.voiceId || "Default Voice"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Steps:</span>
                    <span className="text-white">
                      {selectedAgent.config.conversationSteps.length} steps configured
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Run Simulated Test Session Control */}
            <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono uppercase tracking-wide border-b border-border/60 pb-2">
                <Sparkles className="w-4 h-4 text-cyan" />
                <span>Generate Test Session</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Generate a realistic simulated conversation for <strong>{selectedAgent?.config.name}</strong> and persist it directly to local telemetry.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleRunSimulatedSession("customer_enquiry")}
                  disabled={isSimulating}
                  className="w-full text-left p-2 rounded bg-navy-elevated border border-border/60 hover:border-cyan/50 text-[11px] text-white hover:text-cyan transition-colors"
                >
                  ▶ General Customer Inquiry (Resolved)
                </button>
                <button
                  onClick={() => handleRunSimulatedSession("appointment_booking")}
                  disabled={isSimulating}
                  className="w-full text-left p-2 rounded bg-navy-elevated border border-border/60 hover:border-cyan/50 text-[11px] text-white hover:text-cyan transition-colors"
                >
                  ▶ Appointment Booking (Resolved)
                </button>
                <button
                  onClick={() => handleRunSimulatedSession("complaint_escalation")}
                  disabled={isSimulating}
                  className="w-full text-left p-2 rounded bg-navy-elevated border border-border/60 hover:border-cyan/50 text-[11px] text-white hover:text-cyan transition-colors"
                >
                  ▶ Dispute Escalation (Supervisor Handoff)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Simulated Live Transcript Area */}
          <div className="lg:col-span-2">
            <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md h-full flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                      {createdSession ? `Transcript (${createdSession.id.slice(0, 8)})` : "Session Transcript"}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {createdSession ? `Outcome: ${createdSession.outcome.toUpperCase()}` : "Bidirectional speech turn stream"}
                    </p>
                  </div>
                  <Badge variant={createdSession ? "cyan" : "archived"}>
                    {createdSession ? "Persisted to Storage" : "Standby Mode"}
                  </Badge>
                </div>

                {createdSession ? (
                  <div className="space-y-3 pt-4 max-h-[380px] overflow-y-auto">
                    {createdSession.transcript.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === "agent" ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-text-muted">
                          <span className={msg.role === "agent" ? "text-cyan font-bold" : "text-white font-bold"}>
                            {msg.role === "agent" ? createdSession.agentName : "CALLER"}
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-xl p-3 leading-relaxed text-xs ${
                            msg.role === "agent"
                              ? "bg-navy-elevated text-text-primary border border-border/80"
                              : "bg-cyan/15 text-white border border-cyan/40 shadow-glow-cyan/10"
                          }`}
                        >
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center my-6">
                    <div className="w-12 h-12 rounded-xl bg-navy-elevated border border-cyan/20 flex items-center justify-center mb-3 text-cyan shadow-glow-cyan/15">
                      <Radio className="w-5 h-5 text-cyan" />
                    </div>
                    <h4 className="text-sm font-semibold text-white font-mono mb-1">
                      No Active Voice Stream
                    </h4>
                    <p className="text-xs text-text-secondary max-w-sm leading-relaxed mb-6">
                      Spoken dialogue will stream into this console with millisecond turn timestamps
                      once connected to the ElevenLabs voice gateway in Milestone 7.
                    </p>
                    <div className="p-3.5 rounded-xl border border-border/70 bg-navy-elevated/70 text-[11px] font-mono text-text-secondary max-w-md text-left space-y-1">
                      <div className="font-semibold text-cyan">OBSERVABILITY INTEGRATION:</div>
                      <div className="text-white">Use &apos;Generate Test Session&apos; on the left to test session recording.</div>
                      <div className="text-text-muted">
                        All generated sessions are persisted to localStorage and visible in Analytics and Session Explorer.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-border/50 bg-navy-void/40 flex items-center justify-between text-xs font-mono text-text-muted">
                <span>{createdSession ? `${createdSession.metrics.totalMessages} turns recorded` : "0 turns recorded"}</span>
                <span>DURATION: {createdSession ? `${createdSession.metrics.durationSeconds}s` : "00:00"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

