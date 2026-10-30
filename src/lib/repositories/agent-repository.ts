import { Agent, AgentConfig, AgentFilter, AgentRepository } from "@/types";
import { AgentConfigSchema, AgentSchema } from "@/types/agent";
import { DEMO_AGENTS } from "../demo-data";

const STORAGE_KEY_AGENTS = "voxforge_agents_v2";
const STORAGE_KEY_DEMO_CLEARED = "voxforge_demo_cleared";

/**
 * LocalStorage-backed Agent Repository with in-memory SSR fallback.
 * - Safely handles SSR without accessing window or localStorage during render.
 * - Validates all entries with Zod schema upon load.
 * - Automatically handles corrupted or outdated entries gracefully.
 * - Segregates demo records from user-created agents, allowing clearing of demo data
 *   without deleting user agents.
 * - Never stores secrets, tokens, or private keys.
 */
export class LocalStorageAgentRepository implements AgentRepository {
  private memoryCache: Map<string, Agent> = new Map();
  private isInitialized = false;

  constructor() {
    // Initial in-memory population from DEMO_AGENTS (used on SSR)
    DEMO_AGENTS.forEach((a) => this.memoryCache.set(a.id, { ...a }));
  }

  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  private initialize(): void {
    if (this.isInitialized || !this.isBrowser()) return;

    try {
      const demoCleared = window.localStorage.getItem(STORAGE_KEY_DEMO_CLEARED) === "true";
      const raw = window.localStorage.getItem(STORAGE_KEY_AGENTS);

      if (!raw) {
        // First run on client
        this.memoryCache.clear();
        if (!demoCleared) {
          DEMO_AGENTS.forEach((a) => this.memoryCache.set(a.id, { ...a }));
          this.persist();
        }
      } else {
        // Parse and validate with Zod
        this.memoryCache.clear();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const result = AgentSchema.safeParse(item);
            if (result.success) {
              this.memoryCache.set(result.data.id, result.data);
            } else {
              console.warn("[LocalStorageAgentRepository] Skipped invalid agent entry:", item, result.error);
            }
          }
        }
        // If demo hasn't been cleared and cache is empty, add demo data
        if (this.memoryCache.size === 0 && !demoCleared) {
          DEMO_AGENTS.forEach((a) => this.memoryCache.set(a.id, { ...a }));
          this.persist();
        }
      }
    } catch (err) {
      console.error("[LocalStorageAgentRepository] Error initializing storage, falling back to memory:", err);
      this.memoryCache.clear();
      DEMO_AGENTS.forEach((a) => this.memoryCache.set(a.id, { ...a }));
    } finally {
      this.isInitialized = true;
    }
  }

  private persist(): void {
    if (!this.isBrowser()) return;
    try {
      const array = Array.from(this.memoryCache.values());
      window.localStorage.setItem(STORAGE_KEY_AGENTS, JSON.stringify(array));
    } catch (err) {
      console.error("[LocalStorageAgentRepository] Failed to save to localStorage:", err);
    }
  }

  async getById(id: string): Promise<Agent | null> {
    this.initialize();
    const agent = this.memoryCache.get(id);
    return agent ? { ...agent } : null;
  }

  async list(filter?: AgentFilter): Promise<Agent[]> {
    this.initialize();
    let result = Array.from(this.memoryCache.values());

    if (filter?.includeDemo === false) {
      const demoIds = new Set(DEMO_AGENTS.map((d) => d.id));
      result = result.filter((a) => !demoIds.has(a.id));
    }

    if (filter?.status) {
      result = result.filter((a) => a.status === filter.status);
    }

    if (filter?.language) {
      result = result.filter((a) => a.config.language === filter.language);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.config.name.toLowerCase().includes(q) ||
          a.config.description.toLowerCase().includes(q) ||
          a.config.persona.toLowerCase().includes(q)
      );
    }

    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async create(config: AgentConfig): Promise<Agent> {
    this.initialize();
    // Validate config with Zod
    const validatedConfig = AgentConfigSchema.parse(config);
    const now = new Date().toISOString();
    const newAgent: Agent = {
      id: crypto.randomUUID(),
      config: validatedConfig,
      status: "draft",
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryCache.set(newAgent.id, newAgent);
    this.persist();
    return { ...newAgent };
  }

  async update(id: string, updates: Partial<AgentConfig>): Promise<Agent> {
    this.initialize();
    const existing = this.memoryCache.get(id);
    if (!existing) {
      throw new Error(`Agent not found with id: ${id}`);
    }

    const mergedConfig = { ...existing.config, ...updates };
    const validatedConfig = AgentConfigSchema.parse(mergedConfig);
    const now = new Date().toISOString();

    const updated: Agent = {
      ...existing,
      config: validatedConfig,
      updatedAt: now,
      version: existing.version + 1,
    };

    this.memoryCache.set(id, updated);
    this.persist();
    return { ...updated };
  }

  async setExternalProviderId(id: string, externalProviderId: string): Promise<Agent> {
    this.initialize();
    const existing = this.memoryCache.get(id);
    if (!existing) {
      throw new Error(`Agent not found with id: ${id}`);
    }

    const now = new Date().toISOString();
    const updated: Agent = {
      ...existing,
      externalProviderId,
      updatedAt: now,
    };

    this.memoryCache.set(id, updated);
    this.persist();
    return { ...updated };
  }

  async save(agent: Agent): Promise<Agent> {
    this.initialize();
    const validated = AgentSchema.parse(agent);
    this.memoryCache.set(validated.id, validated);
    this.persist();
    return { ...validated };
  }

  async updateStatus(id: string, status: Agent["status"]): Promise<Agent> {
    this.initialize();
    const existing = this.memoryCache.get(id);
    if (!existing) {
      throw new Error(`Agent not found with id: ${id}`);
    }

    const now = new Date().toISOString();
    const updated: Agent = {
      ...existing,
      status,
      updatedAt: now,
      publishedAt: status === "published" ? now : existing.publishedAt,
    };

    this.memoryCache.set(id, updated);
    this.persist();
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.initialize();
    this.memoryCache.delete(id);
    this.persist();
  }

  async count(): Promise<{ total: number; published: number; draft: number }> {
    this.initialize();
    const list = Array.from(this.memoryCache.values());
    return {
      total: list.length,
      published: list.filter((a) => a.status === "published").length,
      draft: list.filter((a) => a.status === "draft").length,
    };
  }

  async clearDemoData(): Promise<void> {
    this.initialize();
    const demoIds = new Set(DEMO_AGENTS.map((d) => d.id));
    for (const id of demoIds) {
      this.memoryCache.delete(id);
    }
    if (this.isBrowser()) {
      try {
        window.localStorage.setItem(STORAGE_KEY_DEMO_CLEARED, "true");
      } catch (e) {
        console.error(e);
      }
    }
    this.persist();
  }

  async resetToDemo(): Promise<void> {
    this.initialize();
    DEMO_AGENTS.forEach((a) => this.memoryCache.set(a.id, { ...a }));
    if (this.isBrowser()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY_DEMO_CLEARED);
      } catch (e) {
        console.error(e);
      }
    }
    this.persist();
  }

  async hasDemoData(): Promise<boolean> {
    this.initialize();
    const demoIds = new Set(DEMO_AGENTS.map((d) => d.id));
    return Array.from(this.memoryCache.keys()).some((id) => demoIds.has(id));
  }

  isDemoAgent(id: string): boolean {
    return DEMO_AGENTS.some((d) => d.id === id);
  }
}

// Global default singleton
export const defaultAgentRepository = new LocalStorageAgentRepository();
