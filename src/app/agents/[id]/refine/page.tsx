"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  Shield,
  CheckCircle2,
  XCircle,
  Undo2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Edit,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { Agent, AgentConfig } from "@/types";
import { defaultAgentRefinementService } from "@/lib/services/agent-refinement-service";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  proposedConfig?: AgentConfig;
  modifiedFields?: (keyof AgentConfig)[];
  status?: "pending" | "applied" | "rejected";
  clarifications?: string[];
  source?: string;
}

const SUGGESTED_PROMPTS = [
  "Make this agent more empathetic and less robotic",
  "Make the welcome message shorter and concise",
  "Never ask patients for passwords or OTPs",
  "Escalate unresolved complaints to human supervisor",
  "Add a verification step before booking",
  "Change the agent language to Hindi",
];

function RefineAgentContent() {
  const params = useParams();
  const agentId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeProposal, setActiveProposal] = useState<{
    messageId: string;
    config: AgentConfig;
    modifiedFields: (keyof AgentConfig)[];
    explanation: string;
  } | null>(null);
  const [historyStack, setHistoryStack] = useState<AgentConfig[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCounter = useRef(0);

  // Load agent and persistent chat session on mount
  useEffect(() => {
    async function loadAgent() {
      if (!agentId) return;
      setLoading(true);
      try {
        const found = await defaultAgentRepository.getById(agentId);
        if (found) {
          setAgent(found);

          // Restore saved session conversation history if present
          let restored = false;
          if (typeof window !== "undefined" && window.sessionStorage) {
            try {
              const saved = window.sessionStorage.getItem(`voxforge_refine_chat_${agentId}`);
              if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setMessages(parsed);
                  messageCounter.current = parsed.length;
                  restored = true;
                }
              }
            } catch {
              // Ignore session storage error
            }
          }

          if (!restored) {
            // Initial greeting in refinement studio
            messageCounter.current += 1;
            setMessages([
              {
                id: `msg-init-${messageCounter.current}`,
                role: "assistant",
                text: `Welcome to the Conversational Refinement Studio for **${found.config.name}** (v${found.version}). Describe what you would like to change—such as vocal persona, welcome message, guardrails, or conversation steps. Unrelated fields will remain strictly preserved.`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load agent:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAgent();
  }, [agentId]);

  // Persist messages to sessionStorage when updated
  useEffect(() => {
    if (!agentId || messages.length === 0) return;
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(`voxforge_refine_chat_${agentId}`, JSON.stringify(messages));
      } catch {
        // Ignore quota/session storage error
      }
    }
  }, [agentId, messages]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeProposal]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!text || !agent || isProcessing) return;

    setInputMessage("");
    setIsProcessing(true);
    setStatusMessage(null);

    messageCounter.current += 1;
    const userMsgId = `user-msg-${messageCounter.current}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      // Build conversation history context
      const chatHistory = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await defaultAgentRefinementService.refineAgent({
        currentConfig: agent.config,
        instruction: text,
        conversationHistory: chatHistory,
      });

      if (!res.success || !res.proposedConfig) {
        messageCounter.current += 1;
        const assistantErrorMsg: ChatMessage = {
          id: `asst-msg-${messageCounter.current}`,
          role: "assistant",
          text: res.error || "Could not process this refinement request. Please try rephrasing.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantErrorMsg]);
      } else {
        messageCounter.current += 1;
        const asstMsgId = `asst-msg-${messageCounter.current}`;
        const hasChanges = (res.modifiedFields && res.modifiedFields.length > 0);

        const assistantMsg: ChatMessage = {
          id: asstMsgId,
          role: "assistant",
          text: res.explanation || "I have analyzed your request and prepared the proposed configuration.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          proposedConfig: res.proposedConfig,
          modifiedFields: res.modifiedFields,
          clarifications: res.clarifications,
          source: res.source,
          status: hasChanges ? "pending" : undefined,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (hasChanges) {
          setActiveProposal({
            messageId: asstMsgId,
            config: res.proposedConfig,
            modifiedFields: res.modifiedFields || [],
            explanation: res.explanation || "Proposed modifications ready for review.",
          });
        }
      }
    } catch (err: unknown) {
      console.error("Refinement error:", err);
      messageCounter.current += 1;
      const errMsg: ChatMessage = {
        id: `asst-err-${messageCounter.current}`,
        role: "assistant",
        text: "An error occurred while connecting to the refinement engine. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!agent || !activeProposal) return;

    try {
      // Save current config to undo stack
      setHistoryStack((prev) => [agent.config, ...prev]);

      // Update in repository
      const updatedAgent = await defaultAgentRepository.update(agent.id, activeProposal.config);
      setAgent(updatedAgent);

      // Mark message status
      setMessages((prev) =>
        prev.map((m) =>
          m.id === activeProposal.messageId ? { ...m, status: "applied" } : m
        )
      );

      setStatusMessage(`Successfully applied refinement. Agent updated to v${updatedAgent.version}.`);
      setActiveProposal(null);
    } catch (err) {
      console.error("Failed to apply refinement:", err);
      setStatusMessage("Failed to save changes. Please try again.");
    }
  };

  const handleRejectChanges = () => {
    if (!activeProposal) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === activeProposal.messageId ? { ...m, status: "rejected" } : m
      )
    );
    setStatusMessage("Proposed changes were rejected. Agent configuration unchanged.");
    setActiveProposal(null);
  };

  const handleUndo = async () => {
    if (!agent || historyStack.length === 0) return;

    const previousConfig = historyStack[0];
    const newStack = historyStack.slice(1);

    try {
      const reverted = await defaultAgentRepository.update(agent.id, previousConfig);
      setAgent(reverted);
      setHistoryStack(newStack);
      setStatusMessage(`Reverted to previous configuration (v${reverted.version}).`);
    } catch (err) {
      console.error("Failed to undo refinement:", err);
      setStatusMessage("Failed to revert configuration.");
    }
  };

  if (loading) {
    return (
      <AppShell title="Refinement Studio" description="Loading conversational workspace...">
        <div className="flex items-center justify-center p-24 text-cyan font-mono text-xs">
          INITIALIZING_REFINEMENT_CONSOLE...
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
          <Link href="/agents">
            <Button size="sm">Back to My Agents</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Conversational Refinement // ${agent.config.name}`}
      description="Iteratively tune persona, greetings, guardrails, and conversation steps via natural conversation"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Controls Top Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Link
            href={`/agents/${agent.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-cyan transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Agent Inspector</span>
          </Link>

          <div className="flex items-center gap-2">
            {historyStack.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                className="gap-1.5 text-text-secondary hover:text-white"
                title="Undo last applied refinement"
              >
                <Undo2 className="w-3.5 h-3.5 text-cyan" />
                <span>Undo Refinement ({historyStack.length})</span>
              </Button>
            )}
            <Link href={`/agents/${agent.id}/edit`}>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Edit className="w-3.5 h-3.5 text-cyan" />
                <span>Open Visual Editor</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Agent Context Header Badge */}
        <div className="p-4 rounded-xl border border-border/80 bg-navy-deep/85 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-navy-elevated border border-cyan/40 flex items-center justify-center text-cyan shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{agent.config.name}</h3>
                <Badge variant={agent.status as "published" | "draft" | "testing"}>
                  {agent.status}
                </Badge>
                <span className="text-xs text-cyan">v{agent.version}</span>
              </div>
              <p className="text-[11px] text-text-muted line-clamp-1 max-w-xl">
                {agent.config.description || "Voice Conversational Agent"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <div>
              <span className="text-text-muted">LANGUAGE: </span>
              <span className="text-white font-semibold">{agent.config.language}</span>
            </div>
            <div>
              <span className="text-text-muted">STEPS: </span>
              <span className="text-cyan font-semibold">{agent.config.conversationSteps.length}</span>
            </div>
            <div>
              <span className="text-text-muted">GUARDRAILS: </span>
              <span className="text-cyan font-semibold">{agent.config.guardrails.length}</span>
            </div>
          </div>
        </div>

        {/* Status notification toast */}
        {statusMessage && (
          <div className="p-3 rounded-lg border border-cyan/40 bg-cyan/10 text-cyan text-xs font-mono flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-text-muted hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* Main Workspace Grid: Chat on Left, Active Proposal / Inspector on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Conversation Workspace (Left 7 or 8 columns) */}
          <div className="lg:col-span-7 flex flex-col h-[650px] rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md overflow-hidden">
            {/* Chat Messages Scrollable Box */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-text-muted">
                    <span>{msg.role === "user" ? "YOU" : "VOXFORGE ENGINE"}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.source && (
                      <span className="px-1.5 py-0.2 rounded border border-cyan/30 bg-cyan/10 text-[9px] text-cyan">
                        {msg.source}
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed ${
                      msg.role === "user"
                        ? "bg-cyan/15 text-white border border-cyan/40 shadow-glow-cyan/10"
                        : "bg-navy-elevated/90 text-text-primary border border-border/80"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Clarification questions if any */}
                    {msg.clarifications && msg.clarifications.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5 text-[11px] text-text-secondary">
                        <span className="text-cyan font-semibold flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" /> Clarification Guidance:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-text-muted pl-1">
                          {msg.clarifications.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Proposed changes badge / status on assistant message */}
                    {msg.proposedConfig && (
                      <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-cyan" />
                          <span className="text-text-muted">
                            Modified:{" "}
                            <strong className="text-cyan">
                              {msg.modifiedFields?.join(", ") || "None"}
                            </strong>
                          </span>
                        </div>

                        {msg.status === "applied" && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> APPLIED
                          </span>
                        )}
                        {msg.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        )}
                        {msg.status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            PENDING REVIEW
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-start gap-2 text-cyan font-mono text-xs animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-cyan animate-ping mt-1" />
                  <span>ANALYZING_AGENT_CONTEXT_AND_APPLYING_TARGETED_REFINEMENT...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Carousel */}
            <div className="p-2.5 border-t border-border/70 bg-navy-void/60 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono text-text-muted shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan" /> Suggestions:
              </span>
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isProcessing}
                  className="shrink-0 text-[11px] font-mono text-text-secondary hover:text-cyan px-2.5 py-1 rounded-md border border-border/80 bg-navy-elevated/60 hover:border-cyan/40 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Input Area */}
            <div className="p-3 border-t border-border/80 bg-navy-deep flex items-end gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isProcessing}
                placeholder="Describe your desired refinement (e.g. 'make responses shorter', 'never ask for passwords')... [Enter to send]"
                rows={2}
                className="flex-1 bg-navy-elevated border border-border/80 rounded-lg p-2.5 text-xs text-white placeholder-text-muted font-mono focus:outline-none focus:border-cyan transition-colors resize-none disabled:opacity-50"
              />
              <Button
                size="sm"
                onClick={() => handleSendMessage()}
                disabled={isProcessing || !inputMessage.trim()}
                className="h-10 px-4 gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </Button>
            </div>
          </div>

          {/* Proposal Review & Field Inspector Panel (Right 5 columns) */}
          <div className="lg:col-span-5 flex flex-col h-[650px] rounded-xl border border-border/80 bg-navy-deep/80 backdrop-blur-md overflow-hidden font-mono">
            <div className="p-3.5 border-b border-border/80 bg-navy-elevated/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Proposed Changes Review
                </h4>
              </div>
              {activeProposal && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  ACTION REQUIRED
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {activeProposal ? (
                <>
                  <div className="p-3 rounded-lg border border-cyan/40 bg-cyan/5 text-text-secondary space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-cyan font-bold block">
                      Refinement Summary
                    </span>
                    <p className="leading-relaxed">{activeProposal.explanation}</p>
                  </div>

                  {/* Modified Fields Comparison */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-wider text-text-muted block">
                      Affected Configuration Fields ({activeProposal.modifiedFields.length})
                    </span>

                    {activeProposal.modifiedFields.map((field) => {
                      const currentVal = agent.config[field];
                      const newVal = activeProposal.config[field];

                      return (
                        <div
                          key={field}
                          className="p-3 rounded-lg border border-border/80 bg-navy-elevated/80 space-y-2"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-white border-b border-border/50 pb-1">
                            <span className="text-cyan">{field}</span>
                            <span className="text-[10px] text-cyan/70 uppercase">UPDATED</span>
                          </div>

                          <div className="space-y-1 text-[11px]">
                            <span className="text-[10px] text-text-muted uppercase">NEW VALUE:</span>
                            <div className="text-white bg-navy-void/70 p-2 rounded border border-border/60 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                              {typeof newVal === "object"
                                ? JSON.stringify(newVal, null, 2)
                                : String(newVal)}
                            </div>
                          </div>

                          <div className="space-y-1 text-[11px]">
                            <span className="text-[10px] text-text-muted uppercase">PREVIOUS VALUE:</span>
                            <div className="text-text-muted bg-navy-void/40 p-2 rounded border border-border/40 max-h-24 overflow-y-auto whitespace-pre-wrap line-through text-[10px]">
                              {typeof currentVal === "object"
                                ? JSON.stringify(currentVal, null, 2)
                                : String(currentVal)}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Preserved Fields Guarantee Badge */}
                    <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 text-[11px] flex items-start gap-2">
                      <Shield className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      <div>
                        <strong className="block text-white">Targeted Field Guarantee</strong>
                        <span>
                          All other fields (including{" "}
                          {agent.config.guardrails.length} guardrails,{" "}
                          {agent.config.conversationSteps.length} conversation steps, and goals)
                          are strictly preserved without modification.
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-text-muted space-y-3">
                  <Bot className="w-10 h-10 text-cyan/40" />
                  <p className="text-xs">
                    No active proposed changes pending. Type a request on the left (e.g. &ldquo;Make persona friendlier&rdquo;) to generate targeted updates.
                  </p>
                </div>
              )}
            </div>

            {/* Approval / Rejection Actions Footer */}
            {activeProposal && (
              <div className="p-3.5 border-t border-border/80 bg-navy-elevated flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRejectChanges}
                  className="flex-1 text-red-300 border-red-500/40 hover:bg-red-500/10"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Reject</span>
                </Button>

                <Button
                  size="sm"
                  onClick={handleApplyChanges}
                  className="flex-1 bg-cyan text-navy-void hover:bg-cyan/90 font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Apply Changes</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function RefineAgentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-navy-void flex items-center justify-center text-cyan font-mono text-xs">
          LOADING_REFINEMENT_STUDIO...
        </div>
      }
    >
      <RefineAgentContent />
    </Suspense>
  );
}
