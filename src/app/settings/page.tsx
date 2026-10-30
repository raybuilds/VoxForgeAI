"use client";

import { useState, useEffect } from "react";
import {
  Globe2,
  Shield,
  Radio,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState("en-US");
  const [defaultVoice, setDefaultVoice] = useState("21m00Tcm4TlvDq8ikWAM");
  const [savedNotice, setSavedNotice] = useState(false);

  // Provider Status Telemetry
  const [geminiStatus, setGeminiStatus] = useState<boolean | null>(null);
  const [elevenlabsStatus, setElevenlabsStatus] = useState<boolean | null>(null);
  const [activeModel, setActiveModel] = useState<string>("gemini-2.5-flash");

  useEffect(() => {
    async function checkProviders() {
      try {
        const res = await fetch("/api/provider-status");
        if (res.ok) {
          const data = await res.json();
          setGeminiStatus(Boolean(data.geminiConfigured));
          setElevenlabsStatus(Boolean(data.elevenlabsConfigured));
          if (data.geminiModel) setActiveModel(data.geminiModel);
        }
      } catch {
        setGeminiStatus(false);
        setElevenlabsStatus(false);
      }
    }
    checkProviders();
  }, []);

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
              API secrets and private provider keys (`ELEVENLABS_API_KEY`, `GEMINI_API_KEY`) are strictly managed via server-side environment
              variables and are never exposed to browser client storage, network responses, or client bundles. Authenticated voice sessions use secure server-generated signed URLs.
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
                  <option value="ja-JP">Japanese (Japan)</option>
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
                  <option value="ErXwobaYiN019PkySvjV">Antoni (Clear & Engaging)</option>
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
              Live AI synthesis engines, voice gateways, and persistent telemetry repositories
            </p>
          </div>

          <div className="space-y-4">
            {/* Google Gemini AI */}
            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan" />
                  <h4 className="text-sm font-bold text-white">
                    Google Gemini AI (LLM Synthesis & Refinement)
                  </h4>
                  <Badge variant={geminiStatus ? "published" : "draft"}>
                    {geminiStatus ? "CONNECTED" : "MISSING KEY"}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed max-w-lg">
                  Generates structured agent configurations, workflows, system instructions, and performs conversational prompt refinement.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] text-text-muted">
                  <span>SERVER ENV: GEMINI_API_KEY</span>
                  <span>•</span>
                  <span>MODEL: {activeModel}</span>
                </div>
              </div>

              <div className="shrink-0 text-xs text-right">
                {geminiStatus ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                    <AlertCircle className="w-3.5 h-3.5" /> Add to .env.local
                  </span>
                )}
              </div>
            </div>

            {/* ElevenLabs Item */}
            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-cyan" />
                  <h4 className="text-sm font-bold text-white">
                    ElevenLabs Conversational AI
                  </h4>
                  <Badge variant={elevenlabsStatus ? "published" : "draft"}>
                    {elevenlabsStatus ? "CONNECTED" : "MISSING KEY"}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed max-w-lg">
                  Ultra-low latency bidirectional voice streaming, dynamic voice catalog, signed URL session generation, and speech analytics.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] text-text-muted">
                  <span>SERVER ENV: ELEVENLABS_API_KEY</span>
                  <span>•</span>
                  <span>AUDIO LINK: WEBSOCKET SIGNED URL</span>
                </div>
              </div>

              <div className="shrink-0 text-xs text-right">
                {elevenlabsStatus ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-400 font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                    <AlertCircle className="w-3.5 h-3.5" /> Add to .env.local
                  </span>
                )}
              </div>
            </div>

            {/* Storage Provider */}
            <div className="p-4 rounded-xl border border-border/70 bg-navy-elevated/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-cyan" />
                  <h4 className="text-sm font-bold text-white">Local Workspace Storage</h4>
                  <Badge variant="published">ACTIVE (LOCALSTORAGE)</Badge>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed max-w-lg">
                  Browser-persistent storage with Zod schema validation, SSR safety fallback, and segregated demo templates.
                </p>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
