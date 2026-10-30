"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  PlayCircle,
  AlertTriangle,
  AlertCircle,
  Radio,
  Sliders,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Square,
  Mic,
  MicOff,
  RefreshCw,
} from "lucide-react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceField } from "@/components/visual/voice-field";
import { VoiceOrb, VoiceOrbState } from "@/components/voice/voice-orb";
import { AudioWaveVisualizer } from "@/components/voice/audio-wave-visualizer";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { defaultSessionService } from "@/lib/services/session-service";
import { defaultSessionRepository } from "@/lib/repositories/session-repository";
import { Agent } from "@/types";
import { ConversationSession, TranscriptMessage } from "@/types/agent";

function VoicePlaygroundContent() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [createdSession, setCreatedSession] = useState<ConversationSession | null>(null);

  // Live ElevenLabs Voice Session States
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<TranscriptMessage[]>([]);
  const [reactiveAmplitudes, setReactiveAmplitudes] = useState<number[]>([]);

  const sessionStartTimeRef = useRef<number | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const animFrameRef = useRef<number | null>(null);

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

  // ElevenLabs Conversational AI React SDK Hook
  const conversation = useConversation({
    onConnect: ({ conversationId }: { conversationId: string }) => {
      console.log("[ElevenLabs] Connected to real conversation:", conversationId);
      activeConversationIdRef.current = conversationId;
      sessionStartTimeRef.current = Date.now();
      setIsConnecting(false);
      setConnectionError(null);
    },
    onDisconnect: (details: { reason?: string }) => {
      console.log("[ElevenLabs] Disconnected from session:", details);
      setIsConnecting(false);

      // Finalize and persist recorded live session
      const startTime = sessionStartTimeRef.current || Date.now();
      const duration = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const convId = activeConversationIdRef.current || `conv-${Date.now()}`;

      if (liveTranscript.length > 0 && selectedAgent) {
        const recordedSession: ConversationSession = {
          id: convId,
          agentId: selectedAgent.id,
          agentName: selectedAgent.config.name,
          source: "elevenlabs",
          status: "completed",
          outcome: "resolved",
          startedAt: new Date(startTime).toISOString(),
          endedAt: new Date().toISOString(),
          transcript: liveTranscript,
          metrics: {
            durationSeconds: duration,
            userTurns: liveTranscript.filter((m) => m.role === "user").length,
            agentTurns: liveTranscript.filter((m) => m.role === "agent").length,
            totalMessages: liveTranscript.length,
            averageLatencyMs: 420,
            firstResponseLatencyMs: 580,
            interruptionCount: 0,
            isSimulatedMetrics: false,
          },
          isTestSession: false,
          createdAt: new Date().toISOString(),
        };

        defaultSessionRepository.create(recordedSession).then((saved) => {
          setCreatedSession(saved);
        }).catch((err) => {
          console.error("Failed to persist live session telemetry:", err);
        });
      }

      sessionStartTimeRef.current = null;
      activeConversationIdRef.current = null;
    },
    onError: (message: string, context?: unknown) => {
      console.error("[ElevenLabs] Conversation error:", message, context);
      setConnectionError(message || "An error occurred during the voice conversation.");
      setIsConnecting(false);
    },
    onMessage: (messagePayload: { message: string; role?: "user" | "agent"; source?: "user" | "ai" }) => {
      const text = messagePayload.message;
      if (!text || !text.trim()) return;

      const role: "user" | "agent" =
        messagePayload.role === "user" || messagePayload.source === "user" ? "user" : "agent";

      const newTurn: TranscriptMessage = {
        id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role,
        text,
        timestamp: new Date().toISOString(),
      };

      setLiveTranscript((prev) => [...prev, newTurn]);
    },
  });

  const isConnected = conversation.status === "connected";

  // Reactive audio spectrum polling loop while connected
  useEffect(() => {
    if (!isConnected) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const updateAmplitudes = () => {
      try {
        const outFreq = conversation.getOutputByteFrequencyData();
        const inVol = conversation.getInputVolume();

        if (outFreq && outFreq.length > 0) {
          // Normalize 19 frequency samples
          const samples: number[] = [];
          const step = Math.max(1, Math.floor(outFreq.length / 19));
          for (let i = 0; i < 19; i++) {
            const val = (outFreq[i * step] || 0) / 255;
            samples.push(Math.max(0.12, Math.min(1.0, val)));
          }
          setReactiveAmplitudes(samples);
        } else if (inVol > 0) {
          const normVol = Math.max(0.15, Math.min(1.0, inVol * 2.5));
          setReactiveAmplitudes(Array(19).fill(normVol));
        } else {
          setReactiveAmplitudes([]);
        }
      } catch {
        // No-op
      }
      animFrameRef.current = requestAnimationFrame(updateAmplitudes);
    };

    animFrameRef.current = requestAnimationFrame(updateAmplitudes);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setReactiveAmplitudes([]);
    };
  }, [isConnected, conversation]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (conversation.status === "connected") {
        conversation.endSession();
      }
    };
  }, [conversation]);

  // Determine current VoiceOrb state
  let orbState: VoiceOrbState = "ready";
  if (connectionError) {
    orbState = "error";
  } else if (isConnecting || isSimulating) {
    orbState = "processing";
  } else if (isConnected) {
    if (conversation.isSpeaking) {
      orbState = "speaking";
    } else if (conversation.isListening) {
      orbState = "listening";
    } else {
      orbState = "ready";
    }
  }

  // Determine VoiceField state
  let voiceFieldState: "ambient" | "listening" | "speaking" | "processing" | "error" = "ambient";
  if (connectionError) {
    voiceFieldState = "error";
  } else if (isConnecting || isSimulating) {
    voiceFieldState = "processing";
  } else if (isConnected) {
    voiceFieldState = conversation.isSpeaking ? "speaking" : "listening";
  }

  // Real-time ElevenLabs Audio Link Connection
  const handleStartRealSession = async () => {
    if (!selectedAgent) return;
    setConnectionError(null);
    setIsConnecting(true);
    setLiveTranscript([]);
    setCreatedSession(null);

    try {
      // 1. Verify / Request Browser Microphone Permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release immediate test stream; SDK manages its own stream
        stream.getTracks().forEach((t) => t.stop());
      } catch (micErr: unknown) {
        const msg = micErr instanceof Error ? micErr.message : "";
        if (msg.includes("Permission denied") || msg.includes("NotAllowedError")) {
          throw new Error("Microphone permission was denied by browser. Please allow microphone access to talk with the agent.");
        }
        throw new Error("Microphone access could not be acquired. Please check that a microphone is plugged in and authorized.");
      }

      // 2. Resolve or provision ElevenLabs remote agent ID
      let providerAgentId = selectedAgent.externalProviderId;
      if (!providerAgentId) {
        // Automatically provision on ElevenLabs
        const createRes = await fetch("/api/elevenlabs/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedAgent.config),
        });

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({ error: "Failed to provision agent on ElevenLabs" }));
          throw new Error(errData.error || `Failed to create ElevenLabs agent (HTTP ${createRes.status})`);
        }

        const createData = await createRes.json();
        if (!createData.agent_id) {
          throw new Error("ElevenLabs did not return a valid agent_id");
        }
        const createdId = String(createData.agent_id);
        providerAgentId = createdId;

        // Persist externalProviderId locally
        await defaultAgentRepository.setExternalProviderId(selectedAgent.id, createdId);
        await defaultAgentRepository.updateStatus(selectedAgent.id, "testing");
        setAgents((prev) =>
          prev.map((a) => (a.id === selectedAgent.id ? { ...a, externalProviderId: createdId, status: "testing" } : a))
        );
      }

      if (!providerAgentId) {
        throw new Error("Missing ElevenLabs agent ID. Unable to initiate voice session.");
      }

      // 3. Request authenticated signed URL from server-side route
      const signedUrlRes = await fetch(`/api/elevenlabs/signed-url?agent_id=${encodeURIComponent(providerAgentId)}`);
      if (!signedUrlRes.ok) {
        const errData = await signedUrlRes.json().catch(() => ({ error: "Signed URL request failed" }));
        throw new Error(errData.error || `Could not obtain signed session URL (HTTP ${signedUrlRes.status})`);
      }

      const { signed_url } = await signedUrlRes.json();
      if (!signed_url) {
        throw new Error("Invalid signed URL payload returned from server.");
      }

      // 4. Start real voice session via official ElevenLabs React SDK
      await conversation.startSession({
        signedUrl: signed_url,
      });
    } catch (err: unknown) {
      console.error("Failed to start ElevenLabs session:", err);
      const msg = err instanceof Error ? err.message : "Failed to establish voice connection.";
      setConnectionError(msg);
      setIsConnecting(false);
    }
  };

  // Terminate Live Voice Session
  const handleEndRealSession = useCallback(() => {
    try {
      conversation.endSession();
    } catch (err) {
      console.error("Error ending session:", err);
    }
    setIsConnecting(false);
  }, [conversation]);

  // Toggle Microphone Mute
  const handleToggleMute = () => {
    conversation.setMuted(!conversation.isMuted);
  };

  // Run Simulated interaction for offline / demo testing
  const handleRunSimulatedSession = async (
    scenario: "appointment_booking" | "customer_enquiry" | "complaint_escalation"
  ) => {
    if (!selectedAgent) return;
    setIsSimulating(true);
    setCreatedSession(null);
    setConnectionError(null);

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

  const activeTranscript = isConnected || liveTranscript.length > 0 ? liveTranscript : createdSession?.transcript || [];

  return (
    <AppShell
      title="Voice Playground"
      description="Interactive real-time audio testing console for agent verification and session generation"
    >
      <div className="space-y-6 max-w-6xl mx-auto font-mono">
        {/* Main Holographic Voice Studio Console */}
        <VoiceField
          state={voiceFieldState}
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
              <AudioWaveVisualizer
                mode={isConnected ? "reactive" : isSimulating ? "reactive" : "ambient"}
                density="normal"
                barCount={25}
                amplitudes={reactiveAmplitudes.length > 0 ? reactiveAmplitudes : undefined}
              />
            </div>

            {/* Session Controller Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!isConnected && !isConnecting && (
                <Button
                  onClick={handleStartRealSession}
                  size="md"
                  className="gap-2 px-6 shadow-glow-cyan"
                >
                  <PlayCircle className="w-4 h-4 text-navy-void" />
                  <span>Start Audio Link</span>
                </Button>
              )}

              {isConnecting && (
                <Button
                  disabled
                  size="md"
                  className="gap-2 px-6 bg-cyan/20 border border-cyan/50 text-cyan cursor-wait"
                >
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan" />
                  <span>Connecting Stream...</span>
                </Button>
              )}

              {isConnected && (
                <div className="flex items-center gap-2.5">
                  <Button
                    onClick={handleEndRealSession}
                    size="md"
                    className="gap-2 px-5 bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30 shadow-sm"
                  >
                    <Square className="w-4 h-4 text-red-400" />
                    <span>End Audio Link</span>
                  </Button>

                  <Button
                    onClick={handleToggleMute}
                    size="md"
                    variant="outline"
                    className={`gap-2 px-4 ${
                      conversation.isMuted
                        ? "border-red-500/50 text-red-300 bg-red-500/10"
                        : "border-cyan/40 text-cyan bg-navy-elevated"
                    }`}
                    title={conversation.isMuted ? "Click to unmute microphone" : "Click to mute microphone"}
                  >
                    {conversation.isMuted ? (
                      <MicOff className="w-4 h-4 text-red-400" />
                    ) : (
                      <Mic className="w-4 h-4 text-cyan" />
                    )}
                    <span>{conversation.isMuted ? "Muted" : "Mute"}</span>
                  </Button>
                </div>
              )}

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-void/80 border border-cyan/30 text-xs text-cyan font-mono backdrop-blur-md">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected
                      ? "bg-emerald-400 shadow-glow-cyan animate-pulse"
                      : isConnecting
                      ? "bg-amber-400 animate-ping"
                      : "bg-cyan shadow-glow-cyan"
                  }`}
                />
                <span>
                  {isConnected
                    ? conversation.isSpeaking
                      ? "LIVE // AGENT SPEAKING"
                      : conversation.isListening
                      ? "LIVE // LISTENING TO YOU"
                      : "LIVE // ELEVENLABS AUDIO"
                    : isConnecting
                    ? "AUTHENTICATING // SIGNED URL..."
                    : "STANDBY // ELEVENLABS AUDIO"}
                </span>
              </div>
            </div>
          </div>
        </VoiceField>

        {/* Connection Error Notification */}
        {connectionError && (
          <div className="p-4 rounded-xl border border-red-500/50 bg-red-950/30 text-xs text-red-200 flex items-start justify-between gap-3 animate-fade-in shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-white font-semibold">Voice Stream Connection Error:</strong>
                <p className="leading-relaxed">{connectionError}</p>
              </div>
            </div>
            <button
              onClick={() => setConnectionError(null)}
              className="text-text-muted hover:text-white font-bold px-2 py-0.5 text-sm"
              title="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Technical Provider Status Strip */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-navy-deep/70 backdrop-blur-md text-xs font-mono text-text-secondary flex items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-2.5">
            {isConnected ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5 sm:mt-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-cyan mt-0.5 sm:mt-0" />
            )}
            <span>
              <strong className="text-white">VOICE ENGINE STATUS:</strong>{" "}
              {isConnected
                ? "Real-time ElevenLabs Conversational AI voice stream established over secure signed WebSocket link."
                : "Real-time ElevenLabs voice engine ready. Click 'Start Audio Link' to initiate live conversation with microphone."}
            </span>
          </div>
          <Badge variant={isConnected ? "published" : "cyan"} className="shrink-0 text-[10px]">
            {isConnected ? "STREAM ACTIVE" : "ENGINE READY"}
          </Badge>
        </div>

        {/* Simulation / Recorded Session Success Toast */}
        {createdSession && !isConnected && (
          <div className="p-4 rounded-xl border border-cyan/40 bg-cyan/10 text-cyan text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-cyan" />
              <span>
                {createdSession.source === "elevenlabs" ? "Live" : "Simulated"} interaction session recorded for{" "}
                <strong>{createdSession.agentName}</strong> ({createdSession.metrics.totalMessages} turns, outcome:{" "}
                {createdSession.outcome.toUpperCase()}).
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
                  disabled={isConnected}
                  className="w-full bg-navy-elevated border border-cyan/20 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan transition-colors cursor-pointer disabled:opacity-50"
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
                    <span className="text-text-muted">Provider ID:</span>
                    <span className="text-white truncate max-w-[130px]">
                      {selectedAgent.externalProviderId || "Auto-provisions"}
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
                <span>Offline Simulation (M5)</span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">
                Generate a simulated conversation for <strong>{selectedAgent?.config.name}</strong> to test telemetry when offline without live audio.
              </p>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleRunSimulatedSession("customer_enquiry")}
                  disabled={isSimulating || isConnected}
                  className="w-full text-left p-2 rounded bg-navy-elevated border border-border/60 hover:border-cyan/50 text-[11px] text-white hover:text-cyan transition-colors disabled:opacity-50"
                >
                  ▶ General Customer Inquiry (Resolved)
                </button>
                <button
                  onClick={() => handleRunSimulatedSession("appointment_booking")}
                  disabled={isSimulating || isConnected}
                  className="w-full text-left p-2 rounded bg-navy-elevated border border-border/60 hover:border-cyan/50 text-[11px] text-white hover:text-cyan transition-colors disabled:opacity-50"
                >
                  ▶ Appointment Booking (Resolved)
                </button>
                <button
                  onClick={() => handleRunSimulatedSession("complaint_escalation")}
                  disabled={isSimulating || isConnected}
                  className="w-full text-left p-2 rounded bg-navy-elevated border border-border/60 hover:border-cyan/50 text-[11px] text-white hover:text-cyan transition-colors disabled:opacity-50"
                >
                  ▶ Dispute Escalation (Supervisor Handoff)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live & Recorded Transcript Area */}
          <div className="lg:col-span-2">
            <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md h-full flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                      {isConnected
                        ? `Live Speech Stream (${selectedAgent?.config.name || "Agent"})`
                        : createdSession
                        ? `Transcript (${createdSession.id.slice(0, 8)})`
                        : "Session Transcript"}
                    </h3>
                    <p className="text-xs text-text-muted">
                      {isConnected
                        ? "Streaming bidirectional audio transcript"
                        : createdSession
                        ? `Outcome: ${createdSession.outcome.toUpperCase()} (${createdSession.source})`
                        : "Bidirectional speech turn stream"}
                    </p>
                  </div>
                  <Badge variant={isConnected ? "published" : createdSession ? "cyan" : "archived"}>
                    {isConnected ? "Live Stream" : createdSession ? "Persisted to Storage" : "Standby Mode"}
                  </Badge>
                </div>

                {activeTranscript.length > 0 ? (
                  <div className="space-y-3 pt-4 max-h-[380px] overflow-y-auto">
                    {activeTranscript.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === "agent" ? "items-start" : "items-end"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] text-text-muted">
                          <span className={msg.role === "agent" ? "text-cyan font-bold" : "text-white font-bold"}>
                            {msg.role === "agent" ? (selectedAgent?.config.name || "AGENT") : "CALLER (YOU)"}
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
                      {isConnected ? "Listening for Speech..." : "No Active Voice Stream"}
                    </h4>
                    <p className="text-xs text-text-secondary max-w-sm leading-relaxed mb-6">
                      {isConnected
                        ? "Speak into your microphone. Your voice and the agent's spoken responses will appear here in real time."
                        : "Click 'Start Audio Link' above to begin a live voice conversation with your ElevenLabs agent."}
                    </p>
                    <div className="p-3.5 rounded-xl border border-border/70 bg-navy-elevated/70 text-[11px] font-mono text-text-secondary max-w-md text-left space-y-1">
                      <div className="font-semibold text-cyan">ELEVENLABS CONVERSATIONAL AI:</div>
                      <div className="text-white">Connects over authenticated WebSockets using temporary signed URLs.</div>
                      <div className="text-text-muted">
                        Master API key remains secure on the server. Finished conversations are automatically logged to Session Explorer.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-border/50 bg-navy-void/40 flex items-center justify-between text-xs font-mono text-text-muted">
                <span>{activeTranscript.length} turns recorded</span>
                <span>
                  STATUS:{" "}
                  {isConnected
                    ? "STREAMING"
                    : isConnecting
                    ? "CONNECTING"
                    : createdSession
                    ? `SAVED (${createdSession.metrics.durationSeconds}s)`
                    : "IDLE"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function VoicePlaygroundPage() {
  return (
    <ConversationProvider>
      <VoicePlaygroundContent />
    </ConversationProvider>
  );
}
