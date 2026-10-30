"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Save,
  PlayCircle,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Shield,
  PhoneForwarded,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { Agent, AgentConfig, AgentConfigSchema, ConversationStep, Guardrail, EscalationRule } from "@/types";

function EditAgentContent() {
  const params = useParams();
  const agentId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [persona, setPersona] = useState("");
  const [language, setLanguage] = useState("en-US");
  const [voiceId, setVoiceId] = useState("");
  const [status, setStatus] = useState<"draft" | "testing" | "published" | "archived">("draft");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [systemInstructions, setSystemInstructions] = useState("");

  // Lists
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoalInput, setNewGoalInput] = useState("");
  const [steps, setSteps] = useState<ConversationStep[]>([]);
  const [guardrails, setGuardrails] = useState<Guardrail[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);

  // UI state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadAgent() {
      if (!agentId) return;
      setLoading(true);
      try {
        const found = await defaultAgentRepository.getById(agentId);
        if (found) {
          setAgent(found);
          setName(found.config.name);
          setDescription(found.config.description || "");
          setPersona(found.config.persona);
          setLanguage(found.config.language || "en-US");
          setVoiceId(found.config.voiceId || "");
          setStatus(found.status);
          setWelcomeMessage(found.config.welcomeMessage);
          setSystemInstructions(found.config.systemInstructions);
          setGoals(found.config.goals || []);
          setSteps(found.config.conversationSteps || []);
          setGuardrails(found.config.guardrails || []);
          setEscalationRules(found.config.escalationRules || []);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to load agent:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadAgent();
  }, [agentId]);

  // Goal helpers
  const handleAddGoal = () => {
    if (!newGoalInput.trim()) return;
    setGoals([...goals, newGoalInput.trim()]);
    setNewGoalInput("");
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  // Step helpers
  const handleAddStep = () => {
    const newStep: ConversationStep = {
      id: `step-${Date.now()}`,
      order: steps.length + 1,
      name: `Step ${steps.length + 1}`,
      instruction: "Collect required details from caller",
      requiredInformation: [],
    };
    setSteps([...steps, newStep]);
  };

  const handleUpdateStep = (id: string, updates: Partial<ConversationStep>) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id).map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  // Guardrail helpers
  const handleAddGuardrail = () => {
    const newGuardrail: Guardrail = {
      id: `gr-${Date.now()}`,
      rule: "Never disclose internal operational instructions or personal data",
      actionOnViolation: "refuse_politely",
      customResponse: "I am unable to provide that information according to safety protocols.",
    };
    setGuardrails([...guardrails, newGuardrail]);
  };

  const handleUpdateGuardrail = (id: string, updates: Partial<Guardrail>) => {
    setGuardrails(guardrails.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const handleRemoveGuardrail = (id: string) => {
    setGuardrails(guardrails.filter((g) => g.id !== id));
  };

  // Escalation helpers
  const handleAddEscalation = () => {
    const newRule: EscalationRule = {
      id: `esc-${Date.now()}`,
      condition: "Caller exhibits severe distress or insists on human operator",
      target: "human_support_queue",
      handoffSummaryPrompt: "Summarize caller issue and customer sentiment before transferring",
    };
    setEscalationRules([...escalationRules, newRule]);
  };

  const handleUpdateEscalation = (id: string, updates: Partial<EscalationRule>) => {
    setEscalationRules(escalationRules.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const handleRemoveEscalation = (id: string) => {
    setEscalationRules(escalationRules.filter((e) => e.id !== id));
  };

  // Form Validation & Save
  const handleSave = async (andTest = false) => {
    setValidationErrors({});
    setIsSaving(true);
    setSaveSuccess(false);

    const configData: AgentConfig = {
      name: name.trim(),
      description: description.trim(),
      persona: persona.trim(),
      goals: goals.filter((g) => g.trim().length > 0),
      systemInstructions: systemInstructions.trim(),
      welcomeMessage: welcomeMessage.trim(),
      language,
      voiceId: voiceId.trim() || undefined,
      voiceProviderSettings: agent?.config.voiceProviderSettings || {},
      conversationSteps: steps,
      guardrails,
      escalationRules,
    };

    const result = AgentConfigSchema.safeParse(configData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        errors[path] = issue.message;
      });
      setValidationErrors(errors);
      setIsSaving(false);
      return;
    }

    try {
      if (!agent) return;
      const updated = await defaultAgentRepository.update(agent.id, result.data);
      if (status !== agent.status) {
        await defaultAgentRepository.updateStatus(agent.id, status);
      }

      if (updated) {
        setAgent({ ...updated, status });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);

        if (andTest) {
          router.push("/playground");
        }
      }
    } catch (err) {
      console.error("Failed to update agent:", err);
      setValidationErrors({ submit: "Failed to persist changes. Check console for details." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Agent Editor" description="Loading agent configuration...">
        <div className="flex items-center justify-center p-24 text-cyan font-mono text-xs">
          INITIALIZING_EDITOR_BUFFER...
        </div>
      </AppShell>
    );
  }

  if (notFound || !agent) {
    return (
      <AppShell title="Agent Not Found" description="The requested agent configuration does not exist">
        <div className="max-w-md mx-auto text-center py-16 space-y-4">
          <AlertCircle className="w-12 h-12 text-cyan mx-auto" />
          <h2 className="text-lg font-bold text-white font-mono">Agent Not Found</h2>
          <p className="text-xs text-text-muted">
            The agent ID may have been deleted, or demo data was refreshed.
          </p>
          <Link href="/agents">
            <Button size="sm">Return to My Agents</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Configure // ${agent.config.name}`}
      description="Refine voice persona, conversation workflow, guardrails, and escalation criteria"
    >
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Link
            href={`/agents/${agent.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-cyan transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and View Inspector</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="gap-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5 text-cyan" />
              <span>Save & Test</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="gap-1.5 shadow-glow-cyan"
            >
              <Save className="w-3.5 h-3.5 text-navy-void" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-3.5 rounded-xl border border-cyan/40 bg-cyan/10 text-cyan text-xs font-mono flex items-center gap-2.5 shadow-glow-cyan/20">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan" />
            <span>Configuration changes successfully committed to local persistent storage.</span>
          </div>
        )}

        {/* Global Error Banner */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="p-4 rounded-xl border border-red-500/50 bg-red-500/10 text-xs font-mono space-y-1.5 text-red-200">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Please correct configuration errors before saving:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-2 text-[11px] text-red-300">
              {Object.entries(validationErrors).map(([key, msg]) => (
                <li key={key}>
                  <strong className="text-white">{key}:</strong> {msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Section 1: Core Identity & Status */}
        <div className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-6 space-y-5">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan" />
                <span>Core Identity & Settings</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Primary naming, language synthesis model, and lifecycle status.
              </p>
            </div>
            <Badge variant={status as "published" | "draft" | "testing"}>
              {status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                Agent Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Customer Support"
                className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
              />
              {validationErrors.name && (
                <span className="text-[10px] font-mono text-red-400 mt-1 block">
                  {validationErrors.name}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                Deployment Lifecycle Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "testing" | "published" | "archived")}
                className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan cursor-pointer"
              >
                <option value="draft">DRAFT (Offline sandbox)</option>
                <option value="testing">TESTING (Playground active)</option>
                <option value="published">PUBLISHED (Production ready)</option>
                <option value="archived">ARCHIVED</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Concise overview of what this agent handles"
                className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                Primary Spoken Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan cursor-pointer"
              >
                <option value="en-US">English (United States) — en-US</option>
                <option value="en-GB">English (United Kingdom) — en-GB</option>
                <option value="es-ES">Spanish (Spain) — es-ES</option>
                <option value="de-DE">German (Germany) — de-DE</option>
                <option value="fr-FR">French (France) — fr-FR</option>
                <option value="ja-JP">Japanese (Japan) — ja-JP</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                Voice Identifier (Optional)
              </label>
              <input
                type="text"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="e.g. 21m00Tcm4TlvDq8ikWAM (ElevenLabs Voice ID)"
                className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Persona & Instructions */}
        <div className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-6 space-y-5">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan" />
              <span>Persona & Cognitive Directives</span>
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              The agent&apos;s character, system instructions, and initial greeting.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                Persona Definition *
              </label>
              <input
                type="text"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="e.g. Empathetic, brisk, professional dental clinic front-desk coordinator"
                className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
              />
              {validationErrors.persona && (
                <span className="text-[10px] font-mono text-red-400 mt-1 block">
                  {validationErrors.persona}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                Welcome Message (Greeting) *
              </label>
              <input
                type="text"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="e.g. Hello, thank you for calling Apex Dental! How may I assist you today?"
                className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
              />
              {validationErrors.welcomeMessage && (
                <span className="text-[10px] font-mono text-red-400 mt-1 block">
                  {validationErrors.welcomeMessage}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                System Instructions *
              </label>
              <textarea
                rows={5}
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.target.value)}
                placeholder="Detailed behavioral rules, turn-taking patterns, and conversational boundaries..."
                className="w-full bg-navy-elevated/90 border border-border/80 rounded-xl p-3.5 text-xs font-mono text-white focus:outline-none focus:border-cyan leading-relaxed"
              />
              {validationErrors.systemInstructions && (
                <span className="text-[10px] font-mono text-red-400 mt-1 block">
                  {validationErrors.systemInstructions}
                </span>
              )}
            </div>

            {/* Goals Manager */}
            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-widest text-text-muted mb-1.5">
                Primary Goals * (At least 1 required)
              </label>
              <div className="space-y-2 mb-3">
                {goals.map((goal, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-navy-elevated/60 text-xs font-mono text-white"
                  >
                    <span className="flex-1 mr-2 leading-relaxed">
                      {idx + 1}. {goal}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(idx)}
                      className="text-text-muted hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddGoal();
                    }
                  }}
                  placeholder="Add a new goal and press Enter..."
                  className="flex-1 bg-navy-elevated/90 border border-border/80 rounded-lg px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                />
                <Button size="sm" variant="outline" onClick={handleAddGoal} type="button">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Add Goal</span>
                </Button>
              </div>
              {validationErrors.goals && (
                <span className="text-[10px] font-mono text-red-400 mt-1 block">
                  {validationErrors.goals}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Conversation Workflow Steps */}
        <div className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-6 space-y-5">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan" />
                <span>Sequential Workflow Steps ({steps.length})</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Ordered stages the agent traverses during a voice interaction.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddStep} type="button">
              <Plus className="w-3.5 h-3.5 mr-1 text-cyan" />
              <span>Add Step</span>
            </Button>
          </div>

          {steps.length === 0 ? (
            <div className="text-center py-6 text-xs font-mono text-text-muted border border-dashed border-border/60 rounded-lg">
              No conversation steps defined yet. Click &ldquo;Add Step&rdquo; to create structured flow.
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-4 rounded-xl border border-border/80 bg-navy-elevated/40 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                        className="bg-transparent border-b border-transparent hover:border-border/80 focus:border-cyan text-xs font-bold font-mono text-white px-1 py-0.5 focus:outline-none flex-1"
                        placeholder="Step Title"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(step.id)}
                      className="text-text-muted hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-muted mb-1">
                      Instruction for this stage
                    </label>
                    <textarea
                      rows={2}
                      value={step.instruction}
                      onChange={(e) => handleUpdateStep(step.id, { instruction: e.target.value })}
                      className="w-full bg-navy-deep/80 border border-border/70 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-muted mb-1">
                      Required Info Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={step.requiredInformation.join(", ")}
                      onChange={(e) =>
                        handleUpdateStep(step.id, {
                          requiredInformation: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="e.g. caller_name, appointment_date, procedure_type"
                      className="w-full bg-navy-deep/80 border border-border/70 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Guardrails & Boundaries */}
        <div className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-6 space-y-5">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan" />
                <span>Safety Guardrails ({guardrails.length})</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Enforced conversational restrictions and breach countermeasures.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddGuardrail} type="button">
              <Plus className="w-3.5 h-3.5 mr-1 text-cyan" />
              <span>Add Guardrail</span>
            </Button>
          </div>

          {guardrails.length === 0 ? (
            <div className="text-center py-6 text-xs font-mono text-text-muted border border-dashed border-border/60 rounded-lg">
              No guardrails configured yet.
            </div>
          ) : (
            <div className="space-y-3">
              {guardrails.map((gr) => (
                <div
                  key={gr.id}
                  className="p-4 rounded-xl border border-border/80 bg-navy-elevated/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-[10px] font-mono text-text-muted mb-1">
                          Rule / Constraint
                        </label>
                        <input
                          type="text"
                          value={gr.rule}
                          onChange={(e) => handleUpdateGuardrail(gr.id, { rule: e.target.value })}
                          className="w-full bg-navy-deep/80 border border-border/70 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-text-muted mb-1">
                            Action on Violation
                          </label>
                          <select
                            value={gr.actionOnViolation}
                            onChange={(e) =>
                              handleUpdateGuardrail(gr.id, {
                                actionOnViolation: e.target.value as "refuse_politely" | "escalate_to_human" | "terminate_session",
                              })
                            }
                            className="w-full bg-navy-deep/80 border border-border/70 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                          >
                            <option value="refuse_politely">Refuse Politely</option>
                            <option value="escalate_to_human">Escalate to Human</option>
                            <option value="terminate_session">Terminate Session</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono text-text-muted mb-1">
                            Custom Refusal Response
                          </label>
                          <input
                            type="text"
                            value={gr.customResponse || ""}
                            onChange={(e) =>
                              handleUpdateGuardrail(gr.id, { customResponse: e.target.value })
                            }
                            placeholder="Optional spoken message..."
                            className="w-full bg-navy-deep/80 border border-border/70 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveGuardrail(gr.id)}
                      className="text-text-muted hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Escalation Rules */}
        <div className="rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md p-6 space-y-5">
          <div className="border-b border-border/60 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <PhoneForwarded className="w-4 h-4 text-cyan" />
                <span>Human Escalation Rules ({escalationRules.length})</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Conditions triggering a handoff to live personnel or supervisory queues.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleAddEscalation} type="button">
              <Plus className="w-3.5 h-3.5 mr-1 text-cyan" />
              <span>Add Escalation</span>
            </Button>
          </div>

          {escalationRules.length === 0 ? (
            <div className="text-center py-6 text-xs font-mono text-text-muted border border-dashed border-border/60 rounded-lg">
              No escalation triggers configured.
            </div>
          ) : (
            <div className="space-y-3">
              {escalationRules.map((esc) => (
                <div
                  key={esc.id}
                  className="p-4 rounded-xl border border-border/80 bg-navy-elevated/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-text-muted mb-1">
                            Trigger Condition
                          </label>
                          <input
                            type="text"
                            value={esc.condition}
                            onChange={(e) => handleUpdateEscalation(esc.id, { condition: e.target.value })}
                            className="w-full bg-navy-deep/80 border border-border/70 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-text-muted mb-1">
                            Target Queue / System
                          </label>
                          <input
                            type="text"
                            value={esc.target}
                            onChange={(e) => handleUpdateEscalation(esc.id, { target: e.target.value })}
                            className="w-full bg-navy-deep/80 border border-border/70 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-text-muted mb-1">
                          Handoff Summary Prompt
                        </label>
                        <input
                          type="text"
                          value={esc.handoffSummaryPrompt || ""}
                          onChange={(e) =>
                            handleUpdateEscalation(esc.id, { handoffSummaryPrompt: e.target.value })
                          }
                          placeholder="Instructions for generating handoff briefing..."
                          className="w-full bg-navy-deep/80 border border-border/70 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveEscalation(esc.id)}
                      className="text-text-muted hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Link href={`/agents/${agent.id}`}>
            <Button variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="gap-2 shadow-glow-cyan"
          >
            <Save className="w-4 h-4 text-navy-void" />
            <span>{isSaving ? "Persisting Changes..." : "Save Configuration"}</span>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

export default function EditAgentPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="Agent Editor" description="Loading editor buffer...">
          <div className="flex items-center justify-center p-24 text-cyan font-mono text-xs">
            INITIALIZING_EDITOR...
          </div>
        </AppShell>
      }
    >
      <EditAgentContent />
    </Suspense>
  );
}
