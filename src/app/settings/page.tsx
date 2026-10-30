"use client";

import { useState } from "react";
import {
  Globe2,
  Shield,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState("en-US");
  const [defaultVoice, setDefaultVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <AppShell
      title="Settings // Studio Integrations"
      description="Manage studio defaults, voice synthesis parameters, and provider connections"
    >
      <div className="max-w-4xl space-y-6 mx-auto">
        {/* Notice of Security / No Secrets */}
        <div className="p-4 rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md text-xs font-mono text-text-secondary flex items-start gap-3">
          <Shield className="w-5 h-5 shrink-0 text-cyan mt-0.5" />
          <div className="space-y-1">
            <strong className="text-white font-semibold">Security Architecture:</strong>
            <p className="text-text-muted leading-relaxed">
              API secrets and private provider keys are strictly managed via server-side environment
              variables (`ELEVENLABS_API_KEY`) and are never exposed to browser client storage or UI components.
            </p>
          </div>
        </div>

        {/* Global Agent Defaults */}
        <div className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-6 space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-cyan" />
              <span>Studio Voice Defaults</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Default configurations applied to newly synthesized voice agents
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-2">
                  Default Language
                </label>
                <select
                  value={defaultLanguage}
                  onChange={(e) => setDefaultLanguage(e.target.value)}
                  className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan transition-colors cursor-pointer"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French (France)</option>
                  <option value="de-DE">German (Germany)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-2">
                  Default Voice Model
                </label>
                <select
                  value={defaultVoice}
                  onChange={(e) => setDefaultVoice(e.target.value)}
                  className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan transition-colors font-mono cursor-pointer"
                >
                  <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Calm & Professional)</option>
                  <option value="AZnzlk1XvdvUeBnXmlld">Domi (Support & Conversational)</option>
                  <option value="EXAVITQu4vr4xnSDxMaL">Bella (Expressive & Warm)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/60">
              <div className="text-xs font-mono text-text-muted">
                {savedNotice && (
                  <span className="text-cyan font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan" />
                    Preferences saved to local session
                  </span>
                )}
              </div>
              <Button size="sm" onClick={handleSave} className="shadow-sm">
                Save Preferences
              </Button>
            </div>
          </div>
        </div>

        {/* Provider Connection Status */}
        <div className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-6 space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Radio className="w-4 h-4 text-electric" />
              <span>Provider Integrations</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Live voice engines, telemetry collectors, and speech-to-text gateways
            </p>
          </div>

          <div className="space-y-4">
            {/* ElevenLabs Item */}
            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-sm font-bold text-white font-mono">
                    ElevenLabs Conversational AI
                  </h4>
                  <Badge variant="testing">Pending M4</Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed max-w-lg">
                  Provides ultra-low latency voice synthesis, turn detection, and bi-directional
                  telephony / WebSockets streaming.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] text-text-muted font-mono">
                  <span>SERVER ENV: ELEVENLABS_API_KEY</span>
                  <span>•</span>
                  <span>SYNC ENGINE: READY FOR M4</span>
                </div>
              </div>

              <div className="shrink-0">
                <Button size="sm" variant="outline" disabled className="text-xs">
                  Configure in M4
                </Button>
              </div>
            </div>

            {/* Storage Provider */}
            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-sm font-bold text-white font-mono">Local Workspace Storage</h4>
                  <Badge variant="published">Active (M1 InMemory)</Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed max-w-lg">
                  Isolated in-memory repository for development and UI prototyping. Persistent local storage will be attached in M2.
                </p>
              </div>

              <div className="shrink-0">
                <Button size="sm" variant="outline" disabled className="text-xs">
                  Active
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
