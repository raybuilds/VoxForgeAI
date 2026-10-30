"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  Search,
  PlayCircle,
  Edit,
  Trash2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { defaultAgentRepository } from "@/lib/repositories/agent-repository";
import { Agent } from "@/types";

export default function MyAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hasDemo, setHasDemo] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      const list = await defaultAgentRepository.list();
      setAgents(list);
      const demoPresent = await defaultAgentRepository.hasDemoData();
      setHasDemo(demoPresent);
    } catch (err) {
      console.error("Failed to list agents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    defaultAgentRepository.list().then((list) => {
      if (isMounted) {
        setAgents(list);
        defaultAgentRepository.hasDemoData().then((demoPresent) => {
          if (isMounted) {
            setHasDemo(demoPresent);
            setLoading(false);
          }
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClearDemo = async () => {
    await defaultAgentRepository.clearDemoData();
    await loadAgents();
  };

  const handleRestoreDemo = async () => {
    await defaultAgentRepository.resetToDemo();
    await loadAgents();
  };

  const confirmDeleteAgent = async () => {
    if (!agentToDelete) return;
    try {
      await defaultAgentRepository.delete(agentToDelete.id);
      setAgentToDelete(null);
      await loadAgents();
    } catch (err) {
      console.error("Failed to delete agent:", err);
    }
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.config.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell
      title="My Agents"
      description="Autonomous voice agents compiled and stored in persistent workspace"
    >
      <div className="space-y-6">
        {/* Header Actions & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search agents by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-elevated/90 border border-border/80 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-text-muted focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-colors"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-navy-elevated/90 border border-border/80 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan transition-colors cursor-pointer"
            >
              <option value="all">ALL STATUSES</option>
              <option value="published">PUBLISHED</option>
              <option value="testing">TESTING</option>
              <option value="draft">DRAFT</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            {hasDemo ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearDemo}
                className="text-[11px] text-text-muted hover:text-amber-400 hover:border-amber-400/40"
                title="Remove built-in demo records from storage"
              >
                Clear Demo Data
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestoreDemo}
                className="text-[11px] text-text-muted hover:text-cyan hover:border-cyan/40 gap-1.5"
                title="Restore default demo agents"
              >
                <RotateCcw className="w-3 h-3 text-cyan" />
                <span>Restore Demo Data</span>
              </Button>
            )}

            <Link href="/create">
              <Button size="md" className="gap-2 shadow-glow-cyan">
                <Plus className="w-4 h-4 text-navy-void" />
                <span>Create Agent</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Notice of Data State */}
        <div className="text-xs font-mono text-text-muted flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <span>
            SHOWING {filteredAgents.length} OF {agents.length} AGENTS
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-cyan font-semibold">
              STORAGE: LOCAL PERSISTENCE (M2)
            </span>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {agentToDelete && (
          <div className="fixed inset-0 z-50 bg-navy-void/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-navy-deep border border-border/90 rounded-2xl p-6 shadow-2xl space-y-4 font-mono">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">Delete Voice Agent</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Are you sure you want to delete <strong className="text-white">{agentToDelete.config.name}</strong>?
                {defaultAgentRepository.isDemoAgent(agentToDelete.id) &&
                  " (This is a demo agent; you can restore demo data later if desired.)"}
                This action immediately removes it from local persistent storage.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAgentToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={confirmDeleteAgent}
                  className="bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30"
                >
                  Delete Agent
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center p-24 text-cyan font-mono text-xs">
            QUERYING_PERSISTENT_REPOSITORIES...
          </div>
        ) : filteredAgents.length === 0 ? (
          <EmptyState
            icon={Bot}
            title={agents.length === 0 ? "No Agents in Workspace" : "No Matching Agents Found"}
            description={
              agents.length === 0
                ? "Your workspace has no active voice agents. Create one with custom instructions or restore demo templates."
                : "No agents matched your current search filters."
            }
            actionLabel={agents.length === 0 ? "Create First Agent" : "Clear Filters"}
            actionHref={agents.length === 0 ? "/create" : undefined}
            onAction={
              agents.length > 0
                ? () => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAgents.map((agent) => {
              const isDemo = defaultAgentRepository.isDemoAgent(agent.id);

              return (
                <div
                  key={agent.id}
                  className="rounded-xl border border-border/70 bg-navy-deep/80 backdrop-blur-md p-5 flex flex-col justify-between hover:border-cyan/50 transition-all group relative overflow-hidden"
                >
                  {/* Top subtle HUD line */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan/20 to-transparent group-hover:via-cyan/60 transition-all" />

                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-navy-elevated border border-cyan/30 flex items-center justify-center text-cyan shrink-0 shadow-glow-cyan/10">
                          <Bot className="w-4 h-4" />
                        </div>
                        {isDemo && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-cyan/40 bg-cyan/10 text-cyan">
                            DEMO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Badge variant={agent.status as "published" | "draft" | "testing"}>
                          {agent.status}
                        </Badge>
                        <button
                          onClick={() => setAgentToDelete(agent)}
                          className="p-1.5 rounded text-text-muted hover:text-red-400 transition-colors"
                          title="Delete Agent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <Link
                        href={`/agents/${agent.id}`}
                        className="font-bold text-white group-hover:text-cyan transition-colors block text-base font-mono leading-snug"
                      >
                        {agent.config.name}
                      </Link>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                        {agent.config.description || "No description provided."}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/60 text-[11px] font-mono text-text-muted">
                      <div className="flex items-center justify-between">
                        <span>LANGUAGE:</span>
                        <span className="text-white">{agent.config.language}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>VERSION:</span>
                        <span className="text-white">v{agent.version}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>UPDATED:</span>
                        <span className="text-white">
                          {new Date(agent.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center gap-2">
                    <Link href="/playground" className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-cyan" />
                        <span>Test Call</span>
                      </Button>
                    </Link>
                    <Link href={`/agents/${agent.id}/edit`}>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Edit className="w-3.5 h-3.5 text-cyan" />
                        <span>Edit</span>
                      </Button>
                    </Link>
                    <Link href={`/agents/${agent.id}`}>
                      <Button variant="outline" size="sm">
                        Inspect
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
