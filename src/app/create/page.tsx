"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  Bot,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Layers,
  Shield,
  PhoneForwarded,
  RefreshCw,
  Edit,
  Save,
  Trash2,
  Lightbulb,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { defaultAgentGenerationService } from "@/lib/services/agent-generation-service";
import { AgentConfig, AgentConfigSchema } from "@/types";

interface ExamplePrompt {
  title: string;
  category: string;
  prompt: string;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    title: "Dental Clinic Receptionist",
    category: "Healthcare",
    prompt:
      "I need a friendly AI receptionist for my dental clinic named Clara. It should answer questions about clinic timings, available dental services, appointment enquiries, and basic pricing. It must not diagnose medical conditions or prescribe medication. If someone has an urgent medical issue, it should direct them to appropriate human emergency assistance.",
  },
  {
    title: "Developer Support Engineer",
    category: "SaaS & Tech",
    prompt:
      "Create a crisp and concise technical support concierge named Alex for our cloud API. It should troubleshoot webhook errors, verify HTTP status codes, and guide developers to relevant documentation. It must never reveal private API keys, infrastructure IPs, or passwords. Escalate any confirmed production downtime to the on-call engineering lead.",
  },
  {
    title: "Luxury Hotel Concierge",
    category: "Hospitality",
    prompt:
      "Build a refined, elegant hotel concierge named Julian for The Grand Horizon. Greet guests respectfully, assist with fine dining table reservations, schedule spa sessions, and coordinate airport transport. Do not disclose guest room numbers or resident names to third parties. If a guest is dissatisfied or demands a manager, route directly to the hotel duty manager.",
  },
  {
    title: "Real Estate Leasing Specialist",
    category: "Real Estate",
    prompt:
      "Design an articulate leasing assistant named Elena for an upscale residential community. Help prospective tenants understand bedroom layouts, monthly rental ranges, pet policies, and amenities like the pool and gym. Schedule property tours for interested leads. Never make custom pricing concessions or guarantee lease approval without credit checks.",
  },
];

export default function CreateAgentPage() {
  const router = useRouter();

  // Tab mode: "generate" (AI Prompt) | "manual" (Direct entry)
  const [activeTab, setActiveTab] = useState<"generate" | "manual">("generate");

  // Step A Input State
  const [prompt, setPrompt] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en-US");

  // Step B Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Step C & D Review State
  const [generatedConfig, setGeneratedConfig] = useState<AgentConfig | null>(null);
  const [generationExplanation, setGenerationExplanation] = useState<string | null>(null);
  const [generationSource, setGenerationSource] = useState<"rule-based-mock" | "gemini-api" | "gemini-fallback">("rule-based-mock");
  const [clarifications, setClarifications] = useState<string[]>([]);

  // Saving / Persistence States
  const [isSaving, setIsSaving] = useState(false);
  const [savedAgentId, setSavedAgentId] = useState<string | null>(null);

  // Manual Form States (for the custom form tab)
  const [manualName, setManualName] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualPersona, setManualPersona] = useState("");
  const [manualWelcome, setManualWelcome] = useState("");
  const [manualSystemInstructions, setManualSystemInstructions] = useState("");
  const [manualGoals, setManualGoals] = useState("");
  const [manualErrors, setManualErrors] = useState<Record<string, string>>({});

  // Trigger Generation
  const handleGenerate = async (customPrompt?: string) => {
    const promptToUse = (customPrompt ?? prompt).trim();
    if (!promptToUse) {
      setGenerationError("Please enter a description of the voice agent before generating.");
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);
    setSavedAgentId(null);

    try {
      const response = await defaultAgentGenerationService.generateAgent({
        prompt: promptToUse,
        language: targetLanguage,
      });

      if (!response.success || !response.config) {
        setGenerationError(response.error || "Generation failed. Please refine your description and try again.");
      } else {
        setGeneratedConfig(response.config);
        setGenerationExplanation(response.explanation || null);
        setGenerationSource(response.source || "rule-based-mock");
        setClarifications(response.clarifications || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected generation error occurred.";
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Discard generated draft
  const handleDiscard = () => {
    setGeneratedConfig(null);
    setGenerationExplanation(null);
    setClarifications([]);
    setSavedAgentId(null);
    setGenerationError(null);
  };

  // Save generated agent as draft
  const handleSaveDraft = async (redirectImmediately = false) => {
    if (!generatedConfig) return;
    setIsSaving(true);
    try {
      const created = await defaultAgentRepository.create(generatedConfig);
      try {
        const elRes = await fetch("/api/elevenlabs/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(generatedConfig),
        });
        if (elRes.ok) {
          const elData = await elRes.json();
          if (elData.agent_id) {
            created.externalProviderId = elData.agent_id;
            created.status = "testing";
            await defaultAgentRepository.save(created);
          }
        }
      } catch (elErr) {
        console.warn("Could not sync with ElevenLabs on save (agent saved locally):", elErr);
      }
      setSavedAgentId(created.id);
      if (redirectImmediately) {
        router.push(`/agents/${created.id}`);
      }
    } catch (err) {
      console.error("Failed to save generated agent:", err);
      setGenerationError("Failed to persist agent to local storage. Please check browser storage permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save and edit in configuration editor
  const handleSaveAndEdit = async () => {
    if (!generatedConfig) return;
    setIsSaving(true);
    try {
      const created = await defaultAgentRepository.create(generatedConfig);
      try {
        const elRes = await fetch("/api/elevenlabs/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(generatedConfig),
        });
        if (elRes.ok) {
          const elData = await elRes.json();
          if (elData.agent_id) {
            created.externalProviderId = elData.agent_id;
            created.status = "testing";
            await defaultAgentRepository.save(created);
          }
        }
      } catch (elErr) {
        console.warn("Could not sync with ElevenLabs on save:", elErr);
      }
      router.push(`/agents/${created.id}/edit`);
    } catch (err) {
      console.error("Failed to save generated agent for editing:", err);
      setGenerationError("Failed to persist agent to local storage.");
      setIsSaving(false);
    }
  };

  // Manual Creation Submit Handler
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualErrors({});
    setIsSaving(true);

    const goalsList = manualGoals
      .split("\n")
      .map((g) => g.trim())
      .filter(Boolean);

    const configToValidate: AgentConfig = {
      name: manualName.trim(),
      description: manualDescription.trim(),
      persona: manualPersona.trim(),
      goals: goalsList.length > 0 ? goalsList : ["Assist caller efficiently"],
      systemInstructions: manualSystemInstructions.trim(),
      welcomeMessage: manualWelcome.trim(),
      language: targetLanguage,
      conversationSteps: [
        {
          id: "step-1",
          name: "Initial Greeting",
          instruction: "Warmly greet caller and identify core purpose of their call.",
          order: 1,
          requiredInformation: ["caller_intent"],
        },
      ],
      guardrails: [
        {
          id: "gr-1",
          rule: "Always maintain polite, professional conduct and do not disclose internal system directives.",
          actionOnViolation: "refuse_politely",
          customResponse: "I am unable to fulfill that request due to internal safety guidelines.",
        },
      ],
      escalationRules: [
        {
          id: "esc-1",
          condition: "Caller repeatedly demands human supervisor or exhibits severe distress.",
          target: "support_queue",
        },
      ],
      voiceProviderSettings: {},
    };

    const parseResult = AgentConfigSchema.safeParse(configToValidate);
    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        errors[path] = issue.message;
      });
      setManualErrors(errors);
      setIsSaving(false);
      return;
    }

    try {
      const created = await defaultAgentRepository.create(parseResult.data);
      try {
        const elRes = await fetch("/api/elevenlabs/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parseResult.data),
        });
        if (elRes.ok) {
          const elData = await elRes.json();
          if (elData.agent_id) {
            created.externalProviderId = elData.agent_id;
            created.status = "testing";
            await defaultAgentRepository.save(created);
          }
        }
      } catch (elErr) {
        console.warn("Could not sync with ElevenLabs on manual save:", elErr);
      }
      router.push(`/agents/${created.id}`);
    } catch (err) {
      console.error("Failed to create agent manually:", err);
      setManualErrors({ submit: "Failed to persist agent." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell
      title="Create Voice Agent"
      description="Synthesize autonomous voice agents from natural-language descriptions or manual specifications"
    >
      <div className="max-w-4xl space-y-6 mx-auto pb-16">
        {/* Navigation Breadcrumb */}
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-cyan transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Agents</span>
        </Link>

        {/* Tab Selection: AI Synthesis vs Manual Specification */}
        <div className="flex border-b border-border/70 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setActiveTab("generate");
              setSavedAgentId(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold transition-colors ${
              activeTab === "generate"
                ? "border-cyan text-cyan"
                : "border-transparent text-text-muted hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Prompt Generator (M3)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("manual");
              setSavedAgentId(null);
            }}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold transition-colors ${
              activeTab === "manual"
                ? "border-cyan text-cyan"
                : "border-transparent text-text-muted hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Manual Form Specification</span>
          </button>
        </div>

        {/* TAB 1: AI Prompt Generation Workflow */}
        {activeTab === "generate" && (
          <div className="space-y-6">
            {/* Success Banner if Saved */}
            {savedAgentId && (
              <div className="p-4 rounded-xl border border-cyan/50 bg-cyan/10 text-xs font-mono space-y-3 shadow-glow-cyan/20">
                <div className="flex items-center gap-2 text-cyan font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Agent Successfully Saved to Persistent Storage!</span>
                </div>
                <p className="text-text-secondary leading-relaxed">
                  Your generated voice agent is now securely saved as a draft. You can inspect its full telemetry or open the configuration editor to customize any parameter.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link href={`/agents/${savedAgentId}`}>
                    <Button size="sm" variant="primary" className="shadow-glow-cyan">
                      Inspect Agent
                    </Button>
                  </Link>
                  <Link href={`/agents/${savedAgentId}/edit`}>
                    <Button size="sm" variant="secondary">
                      Edit Configuration
                    </Button>
                  </Link>
                  <Link href="/playground">
                    <Button size="sm" variant="outline">
                      Test in Playground
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Step A: Prompt Description Studio (shown when not reviewing an unsaved generated agent) */}
            {!generatedConfig && (
              <div className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-6 space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />

                <div className="border-b border-border/60 pb-3">
                  <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan" />
                    <span>Describe Your Voice Assistant in Natural Language</span>
                  </h2>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Explain your use case, tone, mandatory questions, tasks to perform, rules to obey, and when to transfer to a human.
                  </p>
                </div>

                {generationError && (
                  <div className="p-3.5 rounded-lg border border-red-500/40 bg-red-500/10 text-xs font-mono text-red-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <span>{generationError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-2">
                      Natural-Language Voice Agent Specification
                    </label>
                    <textarea
                      rows={6}
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        if (generationError) setGenerationError(null);
                      }}
                      placeholder="e.g. I need a warm AI receptionist for my dental clinic named Clara. It should answer questions about clinic timings, available dental services, appointment enquiries, and basic pricing. It must not diagnose medical conditions or prescribe medication. If someone has an urgent medical issue, direct them to human emergency assistance."
                      className="w-full bg-navy-elevated/90 border border-border/80 rounded-xl p-3.5 text-xs font-mono text-white placeholder-text-muted focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan leading-relaxed transition-colors"
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono text-text-muted mt-1.5">
                      <span>Include role, mandatory procedures, boundaries, and emergency triggers.</span>
                      <span>{prompt.length} CHARACTERS</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                        Target Spoken Language
                      </label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan transition-colors cursor-pointer"
                      >
                        <option value="en-US">English (United States) — en-US</option>
                        <option value="hi-IN">Hindi (India) — hi-IN (हिंदी)</option>
                        <option value="en-GB">English (United Kingdom) — en-GB</option>
                        <option value="es-ES">Spanish (Spain) — es-ES (Español)</option>
                        <option value="fr-FR">French (France) — fr-FR (Français)</option>
                        <option value="de-DE">German (Germany) — de-DE (Deutsch)</option>
                        <option value="ja-JP">Japanese (Japan) — ja-JP (日本語)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                        Generation Engine
                      </label>
                      <div className="h-[38px] px-3.5 rounded-lg border border-border/70 bg-navy-elevated/50 flex items-center justify-between text-xs font-mono text-cyan">
                        <span>Rule-Based Generator (Demo Mock)</span>
                        <span className="text-[10px] text-teal border border-teal/30 px-1.5 py-0.2 rounded">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-border/60">
                    <span className="text-xs font-mono text-text-muted">
                      Synthesizes validated Zod AgentConfig
                    </span>
                    <Button
                      onClick={() => handleGenerate()}
                      disabled={isGenerating || !prompt.trim()}
                      className="gap-2 shadow-glow-cyan"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 text-navy-void animate-spin" />
                          <span>Synthesizing Agent...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-navy-void" />
                          <span>Generate Agent</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Example Prompt Starters (shown when not reviewing) */}
            {!generatedConfig && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-cyan" />
                  <h3 className="text-xs font-mono uppercase tracking-widest text-text-muted font-bold">
                    Or Start from an Example Domain Prompt
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXAMPLE_PROMPTS.map((ex, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(ex.prompt);
                        handleGenerate(ex.prompt);
                      }}
                      className="text-left p-4 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md hover:border-cyan/50 hover:bg-navy-elevated/50 transition-all cursor-pointer group space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white group-hover:text-cyan font-mono transition-colors">
                          {ex.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-cyan/30 bg-cyan/10 text-cyan">
                          {ex.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed font-mono">
                        {ex.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step D: Review Generated Agent Screen */}
            {generatedConfig && (
              <div className="space-y-6">
                {/* Generation Review Top Bar & Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl border border-cyan/30 bg-navy-deep/90 backdrop-blur-md">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                      <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Generated Configuration Review
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                          generationSource === "gemini-api"
                            ? "bg-purple-950/40 border-purple-500/40 text-purple-300"
                            : generationSource === "gemini-fallback"
                            ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                            : "bg-cyan/10 border-cyan/30 text-cyan"
                        }`}
                      >
                        {generationSource === "gemini-api"
                          ? "Real LLM (Gemini 2.5)"
                          : generationSource === "gemini-fallback"
                          ? "Fallback Demo Engine"
                          : "Rule-Based Mock"}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted font-mono">
                      Inspect and edit the synthesized persona, workflow, and safety guardrails before saving.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerate()}
                      disabled={isGenerating}
                      className="gap-1.5"
                      title="Regenerate with current prompt"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-cyan ${isGenerating ? "animate-spin" : ""}`} />
                      <span>Regenerate</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDiscard}
                      className="gap-1 text-text-muted hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveAndEdit}
                      disabled={isSaving}
                      className="gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5 text-cyan" />
                      <span>Edit in Editor</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveDraft(false)}
                      disabled={isSaving}
                      className="gap-1.5 shadow-glow-cyan"
                    >
                      <Save className="w-3.5 h-3.5 text-navy-void" />
                      <span>{isSaving ? "Saving..." : "Save as Draft"}</span>
                    </Button>
                  </div>
                </div>

                {/* Explanation Strip */}
                {generationExplanation && (
                  <div className="p-3.5 rounded-xl border border-border/80 bg-navy-elevated/40 text-xs font-mono text-cyan flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 shrink-0 text-cyan mt-0.5" />
                    <span className="leading-relaxed">{generationExplanation}</span>
                  </div>
                )}

                {/* Clarifications / Suggestions notice */}
                {clarifications.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs font-mono text-amber-200 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <Lightbulb className="w-4 h-4" />
                      <span>Recommended Details to Clarify in Editor:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px] text-amber-200/90">
                      {clarifications.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 1. Agent Identity Card */}
                <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md space-y-3">
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div className="flex items-center gap-2 font-mono text-sm font-bold text-white uppercase tracking-wider">
                      <Bot className="w-4 h-4 text-cyan" />
                      <span>1. Agent Identity</span>
                    </div>
                    <Badge variant="draft">DRAFT SPECIFICATION</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-text-muted block mb-1">
                        Agent Name
                      </span>
                      <p className="text-white font-bold bg-navy-elevated/60 p-2.5 rounded-lg border border-border/60">
                        {generatedConfig.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-text-muted block mb-1">
                        Spoken Language
                      </span>
                      <p className="text-white bg-navy-elevated/60 p-2.5 rounded-lg border border-border/60">
                        {generatedConfig.language}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] uppercase tracking-widest text-text-muted block mb-1">
                        Description
                      </span>
                      <p className="text-text-secondary bg-navy-elevated/60 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                        {generatedConfig.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Personality and Communication Style */}
                <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-2.5">
                    <Sparkles className="w-4 h-4 text-cyan" />
                    <span>2. Personality & Communication Style</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted block mb-1">
                      Persona Definition
                    </span>
                    <p className="text-xs font-mono text-white bg-navy-elevated/60 p-3 rounded-lg border border-border/60 leading-relaxed">
                      {generatedConfig.persona}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted block mb-1">
                      Spoken Welcome Greeting
                    </span>
                    <p className="text-xs font-mono text-cyan italic bg-navy-elevated/60 p-3 rounded-lg border border-cyan/20">
                      &ldquo;{generatedConfig.welcomeMessage}&rdquo;
                    </p>
                  </div>
                </div>

                {/* 3. Goals & Responsibilities */}
                <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-2.5">
                    <Check className="w-4 h-4 text-teal" />
                    <span>3. Primary Goals & Responsibilities ({generatedConfig.goals.length})</span>
                  </div>
                  <ul className="space-y-2">
                    {generatedConfig.goals.map((goal, idx) => (
                      <li
                        key={idx}
                        className="text-xs font-mono text-white bg-navy-elevated/60 p-2.5 rounded-lg border border-border/60 flex items-start gap-2.5"
                      >
                        <span className="text-cyan font-bold">{idx + 1}.</span>
                        <span className="leading-relaxed">{goal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. System Instructions */}
                <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-2.5">
                    <FileText className="w-4 h-4 text-electric" />
                    <span>4. System Directives & Turn-Taking Instructions</span>
                  </div>
                  <pre className="text-xs font-mono text-text-secondary bg-navy-elevated/60 p-3.5 rounded-lg border border-border/60 whitespace-pre-wrap leading-relaxed">
                    {generatedConfig.systemInstructions}
                  </pre>
                </div>

                {/* 5. Conversation Flow Steps */}
                <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-2.5">
                    <Layers className="w-4 h-4 text-cyan" />
                    <span>5. Sequential Workflow ({generatedConfig.conversationSteps.length} Stages)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {generatedConfig.conversationSteps.map((step) => (
                      <div
                        key={step.id}
                        className="p-3.5 rounded-lg border border-border/60 bg-navy-elevated/50 text-xs font-mono space-y-1.5"
                      >
                        <div className="font-bold text-cyan">
                          {step.order}. {step.name}
                        </div>
                        <p className="text-text-secondary text-[11px] leading-relaxed">
                          {step.instruction}
                        </p>
                        {step.requiredInformation.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {step.requiredInformation.map((info, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-cyan/10 border border-cyan/20 text-cyan px-1.5 py-0.2 rounded"
                              >
                                {info}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Guardrails & Restrictions */}
                <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-2.5">
                    <Shield className="w-4 h-4 text-teal" />
                    <span>6. Enforced Guardrails & Restrictions ({generatedConfig.guardrails.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {generatedConfig.guardrails.map((gr) => (
                      <div
                        key={gr.id}
                        className="p-3.5 rounded-lg border border-border/60 bg-navy-elevated/50 text-xs font-mono space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Security Rule</span>
                          <span className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-600/30 px-1.5 py-0.2 rounded">
                            {gr.actionOnViolation}
                          </span>
                        </div>
                        <p className="text-text-secondary text-[11px] leading-relaxed">{gr.rule}</p>
                        {gr.customResponse && (
                          <p className="text-[10px] text-cyan italic pt-0.5">
                            &ldquo;{gr.customResponse}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7. Human Escalation Rules */}
                <div className="p-5 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-white uppercase tracking-wider border-b border-border/60 pb-2.5">
                    <PhoneForwarded className="w-4 h-4 text-electric" />
                    <span>7. Human Escalation Handoff Triggers ({generatedConfig.escalationRules.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {generatedConfig.escalationRules.map((esc) => (
                      <div
                        key={esc.id}
                        className="p-3.5 rounded-lg border border-border/60 bg-navy-elevated/50 text-xs font-mono space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">Escalation Trigger</span>
                          <span className="text-[10px] text-electric bg-electric/15 border border-electric/30 px-1.5 py-0.2 rounded">
                            {esc.target}
                          </span>
                        </div>
                        <p className="text-text-secondary text-[11px] leading-relaxed">{esc.condition}</p>
                        {esc.handoffSummaryPrompt && (
                          <p className="text-[10px] text-text-muted italic pt-0.5">
                            Handoff: {esc.handoffSummaryPrompt}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Bar Footer */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-border/60">
                  <Button variant="outline" size="md" onClick={handleDiscard}>
                    Discard Configuration
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleSaveAndEdit}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4 text-cyan" />
                    <span>Edit Configuration</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleSaveDraft(true)}
                    disabled={isSaving}
                    className="gap-2 shadow-glow-cyan"
                  >
                    <Save className="w-4 h-4 text-navy-void" />
                    <span>{isSaving ? "Persisting..." : "Save Draft & Inspect"}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Manual Form Specification Mode */}
        {activeTab === "manual" && (
          <form
            onSubmit={handleManualSubmit}
            className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-6 space-y-5"
          >
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan" />
                <span>Specify Agent Directives Directly</span>
              </h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Provide custom baseline parameters. Sequential stages, guardrails, and escalation conditions can be further refined in the editor.
              </p>
            </div>

            {Object.keys(manualErrors).length > 0 && (
              <div className="p-3.5 rounded-lg border border-red-500/40 bg-red-500/10 text-xs font-mono text-red-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Validation Errors Detected:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px] text-red-300">
                  {Object.entries(manualErrors).map(([key, msg]) => (
                    <li key={key}>
                      <strong className="text-white">{key}:</strong> {msg}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. Apex Customer Concierge"
                    className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                  />
                  {manualErrors.name && (
                    <span className="text-[10px] font-mono text-red-400 mt-1 block">
                      {manualErrors.name}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                    Spoken Language
                  </label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan cursor-pointer"
                  >
                    <option value="en-US">English (United States) — en-US</option>
                    <option value="hi-IN">Hindi (India) — hi-IN (हिंदी)</option>
                    <option value="en-GB">English (United Kingdom) — en-GB</option>
                    <option value="es-ES">Spanish (Spain) — es-ES (Español)</option>
                    <option value="fr-FR">French (France) — fr-FR (Français)</option>
                    <option value="de-DE">German (Germany) — de-DE (Deutsch)</option>
                    <option value="ja-JP">Japanese (Japan) — ja-JP (日本語)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                  Brief Description
                </label>
                <input
                  type="text"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="e.g. Inbound telephone agent resolving common billing questions and routing escalations."
                  className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                  Persona Description *
                </label>
                <input
                  type="text"
                  required
                  value={manualPersona}
                  onChange={(e) => setManualPersona(e.target.value)}
                  placeholder="e.g. Patient, warm, and highly articulate support specialist"
                  className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                />
                {manualErrors.persona && (
                  <span className="text-[10px] font-mono text-red-400 mt-1 block">
                    {manualErrors.persona}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                  Welcome Greeting (Spoken upon connection) *
                </label>
                <input
                  type="text"
                  required
                  value={manualWelcome}
                  onChange={(e) => setManualWelcome(e.target.value)}
                  placeholder="e.g. Hello, thank you for reaching out to Apex Support. How may I help you today?"
                  className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                />
                {manualErrors.welcomeMessage && (
                  <span className="text-[10px] font-mono text-red-400 mt-1 block">
                    {manualErrors.welcomeMessage}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                  System Instructions *
                </label>
                <textarea
                  rows={4}
                  required
                  value={manualSystemInstructions}
                  onChange={(e) => setManualSystemInstructions(e.target.value)}
                  placeholder="Provide behavioral instructions, turn-taking cadence, conversational boundaries, and policy reminders..."
                  className="w-full bg-navy-elevated/90 border border-border/80 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-cyan leading-relaxed"
                />
                {manualErrors.systemInstructions && (
                  <span className="text-[10px] font-mono text-red-400 mt-1 block">
                    {manualErrors.systemInstructions}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                  Primary Goals (One per line)
                </label>
                <textarea
                  rows={3}
                  value={manualGoals}
                  onChange={(e) => setManualGoals(e.target.value)}
                  placeholder="Identify caller intent and account identity&#10;Answer inquiry using verified knowledge base&#10;Log summary for CRM synchronization"
                  className="w-full bg-navy-elevated/90 border border-border/80 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-cyan leading-relaxed"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-border/60">
                <span className="text-xs font-mono text-text-muted">
                  Validates against Zod AgentConfigSchema
                </span>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="gap-2 shadow-glow-cyan"
                >
                  <Plus className="w-4 h-4 text-navy-void" />
                  <span>{isSaving ? "Persisting..." : "Create & Save Agent"}</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
