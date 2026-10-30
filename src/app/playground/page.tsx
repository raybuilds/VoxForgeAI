"use client";

import { useState } from "react";
import {
  MicOff,
  PlayCircle,
  AlertTriangle,
  Radio,
  Sliders,
  Settings2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VoiceField } from "@/components/visual/voice-field";
import { VoiceOrb, VoiceOrbState } from "@/components/voice/voice-orb";
import { AudioWaveVisualizer } from "@/components/voice/audio-wave-visualizer";
import { DEMO_AGENTS } from "@/lib/demo-data";

export default function VoicePlaygroundPage() {
  const [selectedAgentId, setSelectedAgentId] = useState(DEMO_AGENTS[0].id);

  // In accordance with Stage 2.3 honesty rules, disconnected state maps to ready/standby
  const orbState: VoiceOrbState = "ready";

  const selectedAgent =
    DEMO_AGENTS.find((a) => a.id === selectedAgentId) ?? DEMO_AGENTS[0];

  const handleStartSession = () => {
    alert(
      "Notice: The Voice Provider is currently disconnected (scheduled for Milestone 4 ElevenLabs WebSockets). As per engineering guidelines, fake audio streams or fabricated dialogues are not simulated."
    );
  };

  return (
    <AppShell
      title="Voice Playground"
      description="Interactive real-time audio testing console for agent verification"
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Main Holographic Voice Studio Console */}
        <VoiceField
          state="listening"
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
                accessibleLabel={`Voice Assistant ${selectedAgent.config.name} in holographic stage`}
              />
            </div>

            {/* Agent Identity & Metadata */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2.5">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight font-mono">
                  {selectedAgent.config.name}
                </h2>
                <Badge variant={selectedAgent.status as "published" | "draft" | "testing"}>
                  {selectedAgent.status}
                </Badge>
              </div>
              <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                {selectedAgent.config.description}
              </p>
            </div>

            {/* Harmonic Audio Waveform integrated under the Orb */}
            <div className="w-full max-w-xs py-1">
              <AudioWaveVisualizer mode="ambient" density="normal" barCount={25} />
            </div>

            {/* Session Controller Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleStartSession}
                size="md"
                className="gap-2 px-6 shadow-glow-cyan"
              >
                <PlayCircle className="w-4 h-4 text-navy-void" />
                <span>Start Test Session</span>
              </Button>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-void/80 border border-cyan/30 text-xs text-cyan font-mono backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-cyan shadow-glow-cyan" />
                <span>STANDBY // DISCONNECTED PREVIEW</span>
              </div>
            </div>
          </div>
        </VoiceField>

        {/* Technical Provider Status Strip */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-navy-deep/70 backdrop-blur-md text-xs font-mono text-text-secondary flex items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-cyan mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-white">TELEMETRY STATUS:</strong> ElevenLabs Conversational WebSockets integration connects in Milestone 4. No synthetic audio is simulated.
            </span>
          </div>
          <Badge variant="cyan" className="shrink-0 text-[10px]">
            GATEWAY DISCONNECTED
          </Badge>
        </div>

        {/* Configuration & Transcript Split Grid */}
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
                  {DEMO_AGENTS.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.config.name} ({agent.status})
                    </option>
                  ))}
                </select>
              </div>

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
            </div>

            {/* Hardware & Latency Telemetry */}
            <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white font-mono uppercase tracking-wide border-b border-border/60 pb-2">
                <Settings2 className="w-4 h-4 text-electric" />
                <span>Call Telemetry</span>
              </div>
              <div className="p-3 rounded-lg border border-border/60 bg-navy-elevated/60 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Socket Gateway:</span>
                  <span className="inline-flex items-center gap-1.5 text-text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Disconnected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Microphone:</span>
                  <span className="inline-flex items-center gap-1.5 text-text-muted">
                    <MicOff className="w-3.5 h-3.5 text-text-muted" />
                    Not Requested
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Turn Latency:</span>
                  <span className="text-text-muted">— ms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Transcript Area */}
          <div className="lg:col-span-2">
            <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md h-full flex flex-col justify-between min-h-[440px]">
              <div>
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wide">
                      Session Transcript
                    </h3>
                    <p className="text-xs text-text-muted">
                      Bidirectional speech turn stream
                    </p>
                  </div>
                  <Badge variant="archived">Standby Mode</Badge>
                </div>

                <div className="flex flex-col items-center justify-center p-8 text-center my-6">
                  <div className="w-12 h-12 rounded-xl bg-navy-elevated border border-cyan/20 flex items-center justify-center mb-3 text-cyan shadow-glow-cyan/15">
                    <Radio className="w-5 h-5 text-cyan" />
                  </div>
                  <h4 className="text-sm font-semibold text-white font-mono mb-1">
                    No Active Voice Stream
                  </h4>
                  <p className="text-xs text-text-secondary max-w-sm leading-relaxed mb-6">
                    Spoken dialogue will stream into this console with millisecond turn timestamps
                    once connected to the ElevenLabs voice gateway.
                  </p>
                  <div className="p-3.5 rounded-xl border border-border/70 bg-navy-elevated/70 text-[11px] font-mono text-text-secondary max-w-md text-left space-y-1">
                    <div className="font-semibold text-cyan">PROTOCOL TARGET:</div>
                    <div className="text-white">ElevenLabs Conversational AI WebSockets (M4)</div>
                    <div className="text-text-muted">
                      Bidirectional PCM audio streaming with client-side VAD.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-t border-border/50 bg-navy-void/40 flex items-center justify-between text-xs font-mono text-text-muted">
                <span>0 turns recorded</span>
                <span>DURATION: 00:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
