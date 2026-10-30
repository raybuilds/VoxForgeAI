"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  PlayCircle,
  Shield,
  Layers,
  Sparkles,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { Agent } from "@/types";

function AgentDetailsContent() {
  const params = useParams();
  const agentId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function fetchAgent() {
      if (!agentId) return;
      setLoading(true);
      try {
        const found = await defaultAgentRepository.getById(agentId);
        setAgent(found || null);
      } catch (err) {
        console.error("Failed to load agent:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAgent();
  }, [agentId]);

  const handleDelete = async () => {
    if (!agent) return;
    try {
      await defaultAgentRepository.delete(agent.id);
      router.push("/agents");
    } catch (err) {
      console.error("Failed to delete agent:", err);
    }
  };

  if (loading) {
    return (
      <AppShell title="Agent Inspector" description="Loading agent telemetry...">
        <div className="flex items-center justify-center p-24 text-cyan font-mono text-xs">
          INITIALIZING_TELEMETRY_LINK...
        </div>
      </AppShell>
    );
  }

  if (!agent) {
    return (
      <AppShell title="Agent Not Found" description="The requested agent does not exist">
        <div className="max-w-md mx-auto text-center py-16 space-y-4">
          <AlertCircle className="w-12 h-12 text-cyan mx-auto" />
          <h2 className="text-lg font-bold text-white font-mono">Agent Not Found</h2>
          <p className="text-xs text-text-muted">
            The agent record may have been cleared or removed.
          </p>
          <Link href="/agents">
            <Button size="sm">Back to My Agents</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isDemo = defaultAgentRepository.isDemoAgent(agent.id);

  return (
    <AppShell
      title={`Agent Inspector // ${agent.config.name}`}
      description="Inspect agent instructions, persona definitions, and conversation constraints"
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href="/agents"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-cyan transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Agents</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 rounded-lg border border-border/80 bg-navy-elevated/70 text-text-muted hover:text-red-400 hover:border-red-400/40 transition-colors"
              title="Delete Agent"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <Link href={`/agents/${agent.id}/refine`}>
              <Button size="sm" className="gap-1.5 bg-cyan/20 border border-cyan/50 text-cyan hover:bg-cyan/30">
                <Sparkles className="w-3.5 h-3.5 text-cyan" />
                <span>Refine Agent</span>
              </Button>
            </Link>
            <Link href={`/agents/${agent.id}/edit`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Edit className="w-3.5 h-3.5 text-cyan" />
                <span>Edit Config</span>
              </Button>
            </Link>
            <Link href="/playground">
              <Button size="sm" variant="secondary" className="gap-1.5">
                <PlayCircle className="w-3.5 h-3.5 text-cyan" />
                <span>Test in Playground</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 bg-navy-void/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-navy-deep border border-border/90 rounded-2xl p-6 shadow-2xl space-y-4 font-mono">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">Confirm Removal</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Are you sure you want to delete <strong className="text-white">{agent.config.name}</strong>?
                {isDemo && " This is a demo template agent."} This action removes the configuration from local persistent storage.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  className="bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30"
                >
                  Delete Agent
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header Summary */}
        <div className="p-6 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-navy-elevated border border-cyan/40 flex items-center justify-center text-cyan shrink-0 shadow-glow-cyan/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white font-mono">{agent.config.name}</h2>
                  <Badge variant={agent.status as "published" | "draft" | "testing"}>
                    {agent.status}
                  </Badge>
                  {isDemo && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-cyan/40 bg-cyan/10 text-cyan">
                      DEMO
                    </span>
                  )}
                  <span className="text-xs font-mono text-cyan">v{agent.version}</span>
                </div>
                <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
                  {agent.config.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-1 text-[11px] font-mono text-text-muted shrink-0">
              <span>CREATED: {new Date(agent.createdAt).toLocaleDateString()}</span>
              <span>UPDATED: {new Date(agent.updatedAt).toLocaleDateString()}</span>
              <span>LANGUAGE: <span className="text-white">{agent.config.language}</span></span>
              {agent.externalProviderId && (
                <span className="text-cyan font-semibold">
                  PROVIDER ID: {agent.externalProviderId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Persona & Goals */}
          <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-white uppercase tracking-wider border-b border-border/50 pb-2">
              <Sparkles className="w-4 h-4 text-cyan" />
              <span>Persona & Goals</span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
                  Persona Definition
                </h4>
                <p className="text-xs text-text-primary bg-navy-elevated/70 p-3 rounded-lg border border-border/60 leading-relaxed font-mono">
                  {agent.config.persona}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
                  Primary Goals ({agent.config.goals.length})
                </h4>
                <ul className="space-y-1.5">
                  {agent.config.goals.map((goal, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-text-primary bg-navy-elevated/70 p-2.5 rounded-lg border border-border/60 flex items-start gap-2 font-mono"
                    >
                      <span className="text-cyan font-bold">•</span>
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* System Instructions & Welcome */}
          <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-white uppercase tracking-wider border-b border-border/50 pb-2">
              <Layers className="w-4 h-4 text-electric" />
              <span>Prompt Instructions</span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
                  Welcome Greeting
                </h4>
                <p className="text-xs text-cyan bg-navy-elevated/70 border border-cyan/20 p-3 rounded-lg font-mono italic">
                  &ldquo;{agent.config.welcomeMessage}&rdquo;
                </p>
              </div>

              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-1">
                  System Instructions
                </h4>
                <p className="text-xs text-text-primary bg-navy-elevated/70 p-3 rounded-lg border border-border/60 whitespace-pre-wrap leading-relaxed font-mono">
                  {agent.config.systemInstructions}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Steps */}
        {agent.config.conversationSteps && agent.config.conversationSteps.length > 0 && (
          <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md space-y-3">
            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-white uppercase tracking-wider border-b border-border/50 pb-2">
              <Layers className="w-4 h-4 text-cyan" />
              <span>Workflow Sequence ({agent.config.conversationSteps.length} Steps)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {agent.config.conversationSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-3.5 rounded-lg border border-border/60 bg-navy-elevated/50 font-mono text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-cyan font-bold">
                    <span>{idx + 1}. {step.name}</span>
                  </div>
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    {step.instruction}
                  </p>
                  {step.requiredInformation.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {step.requiredInformation.map((info, i) => (
                        <span key={i} className="text-[10px] bg-cyan/10 border border-cyan/20 text-cyan px-1.5 py-0.2 rounded">
                          {info}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guardrails & Escalation Rules */}
        <div className="p-5 rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold text-white uppercase tracking-wider border-b border-border/50 pb-2">
            <Shield className="w-4 h-4 text-teal" />
            <span>Guardrails & Safety Rules</span>
          </div>

          {agent.config.guardrails.length === 0 &&
          agent.config.escalationRules.length === 0 ? (
            <p className="text-xs text-text-muted font-mono italic">
              No custom guardrails or escalation handoffs configured for this agent.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agent.config.guardrails.map((gr) => (
                <div
                  key={gr.id}
                  className="p-3.5 rounded-lg border border-border/60 bg-navy-elevated/60 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Guardrail</span>
                    <span className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-600/30 px-1.5 py-0.2 rounded">
                      {gr.actionOnViolation}
                    </span>
                  </div>
                  <p className="text-text-secondary">{gr.rule}</p>
                  {gr.customResponse && (
                    <p className="text-[11px] text-cyan italic pt-0.5">&ldquo;{gr.customResponse}&rdquo;</p>
                  )}
                </div>
              ))}

              {agent.config.escalationRules.map((esc) => (
                <div
                  key={esc.id}
                  className="p-3.5 rounded-lg border border-border/60 bg-navy-elevated/60 text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Escalation Trigger</span>
                    <span className="text-[10px] text-electric bg-electric/15 border border-electric/30 px-1.5 py-0.2 rounded">
                      {esc.target}
                    </span>
                  </div>
                  <p className="text-text-secondary">{esc.condition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function AgentDetailsPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="Agent Inspector" description="Loading telemetry...">
          <div className="flex items-center justify-center p-24 text-cyan font-mono text-xs">
            INITIALIZING_INSPECTOR...
          </div>
        </AppShell>
      }
    >
      <AgentDetailsContent />
    </Suspense>
  );
}
