import {
  ConversationSession,
  ConversationSessionSchema,
} from "@/types/agent";
import {
  SessionFilter,
  SessionMetricsSummary,
  SessionRepository,
} from "@/types/providers";
import { DEMO_SESSIONS } from "../demo-data";

const STORAGE_KEY_SESSIONS = "voxforge_sessions_v1";
const STORAGE_KEY_SESSIONS_CLEARED = "voxforge_sessions_cleared";

/**
 * LocalStorage-backed Session Repository (M5 Observability)
 * - Safe SSR operation with in-memory caching.
 * - Enforces Zod schema validation on load.
 * - Dedicated versioned key `voxforge_sessions_v1`.
 * - Prevents duplicate IDs, handles storage quota limits gracefully.
 * - Maintains historical agent name snapshots.
 * - Honors explicit clearing of session telemetry without auto-repopulating demo data.
 */
export class LocalStorageSessionRepository implements SessionRepository {
  private memoryCache: Map<string, ConversationSession> = new Map();
  private isInitialized = false;

  constructor() {
    // Initial memory seed from DEMO_SESSIONS for SSR
    DEMO_SESSIONS.forEach((s) => this.memoryCache.set(s.id, { ...s }));
  }

  private isBrowser(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  private initialize(): void {
    if (this.isInitialized || !this.isBrowser()) return;

    try {
      const isCleared = window.localStorage.getItem(STORAGE_KEY_SESSIONS_CLEARED) === "true";
      const raw = window.localStorage.getItem(STORAGE_KEY_SESSIONS);

      if (!raw) {
        this.memoryCache.clear();
        if (!isCleared) {
          // First run on client: initialize default seed
          DEMO_SESSIONS.forEach((s) => this.memoryCache.set(s.id, { ...s }));
          this.persist();
        }
      } else {
        this.memoryCache.clear();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const validation = ConversationSessionSchema.safeParse(item);
            if (validation.success) {
              this.memoryCache.set(validation.data.id, validation.data);
            } else {
              console.warn(
                "[LocalStorageSessionRepository] Skipped invalid session entry:",
                item,
                validation.error
              );
            }
          }
        }
        // If not cleared and cache is empty, seed demo sessions
        if (this.memoryCache.size === 0 && !isCleared) {
          DEMO_SESSIONS.forEach((s) => this.memoryCache.set(s.id, { ...s }));
          this.persist();
        }
      }
    } catch (err) {
      console.error(
        "[LocalStorageSessionRepository] Error initializing session storage, falling back to memory:",
        err
      );
      this.memoryCache.clear();
      DEMO_SESSIONS.forEach((s) => this.memoryCache.set(s.id, { ...s }));
    } finally {
      this.isInitialized = true;
    }
  }

  private persist(): void {
    if (!this.isBrowser()) return;
    try {
      const array = Array.from(this.memoryCache.values());
      window.localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(array));
    } catch (err) {
      console.error("[LocalStorageSessionRepository] Failed to save sessions to localStorage:", err);
    }
  }

  async getAll(): Promise<ConversationSession[]> {
    this.initialize();
    return Array.from(this.memoryCache.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  async getById(id: string): Promise<ConversationSession | null> {
    this.initialize();
    const session = this.memoryCache.get(id);
    return session ? { ...session } : null;
  }

  async getByAgentId(agentId: string): Promise<ConversationSession[]> {
    this.initialize();
    return Array.from(this.memoryCache.values())
      .filter((s) => s.agentId === agentId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async list(filter?: SessionFilter): Promise<ConversationSession[]> {
    this.initialize();
    let result = Array.from(this.memoryCache.values());

    if (filter?.agentId) {
      result = result.filter((s) => s.agentId === filter.agentId);
    }

    if (filter?.status) {
      result = result.filter((s) => s.status === filter.status);
    }

    if (filter?.outcome) {
      result = result.filter((s) => s.outcome === filter.outcome);
    }

    if (filter?.source) {
      result = result.filter((s) => s.source === filter.source);
    }

    if (filter?.isTestSession !== undefined) {
      result = result.filter((s) => s.isTestSession === filter.isTestSession);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.agentName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.summary && s.summary.toLowerCase().includes(q))
      );
    }

    if (filter?.startDate) {
      const start = new Date(filter.startDate).getTime();
      result = result.filter((s) => new Date(s.startedAt).getTime() >= start);
    }

    if (filter?.endDate) {
      const end = new Date(filter.endDate).getTime();
      result = result.filter((s) => new Date(s.startedAt).getTime() <= end);
    }

    const sortOrder = filter?.sort || "newest";
    result.sort((a, b) => {
      const diff = new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });

    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  async create(session: ConversationSession): Promise<ConversationSession> {
    this.initialize();
    const validated = ConversationSessionSchema.parse(session);
    this.memoryCache.set(validated.id, validated);
    this.persist();
    return { ...validated };
  }

  async save(session: ConversationSession): Promise<void> {
    await this.create(session);
  }

  async update(id: string, updates: Partial<ConversationSession>): Promise<ConversationSession> {
    this.initialize();
    const existing = this.memoryCache.get(id);
    if (!existing) {
      throw new Error(`Session not found with id: ${id}`);
    }

    const merged = { ...existing, ...updates };
    const validated = ConversationSessionSchema.parse(merged);
    this.memoryCache.set(id, validated);
    this.persist();
    return { ...validated };
  }

  async delete(id: string): Promise<void> {
    this.initialize();
    this.memoryCache.delete(id);
    this.persist();
  }

  async clear(): Promise<void> {
    this.initialize();
    this.memoryCache.clear();
    if (this.isBrowser()) {
      try {
        window.localStorage.setItem(STORAGE_KEY_SESSIONS_CLEARED, "true");
        window.localStorage.removeItem(STORAGE_KEY_SESSIONS);
      } catch (err) {
        console.error("[LocalStorageSessionRepository] Error setting cleared flag:", err);
      }
    }
  }

  async resetToDemo(): Promise<void> {
    this.initialize();
    this.memoryCache.clear();
    DEMO_SESSIONS.forEach((s) => this.memoryCache.set(s.id, { ...s }));
    if (this.isBrowser()) {
      try {
        window.localStorage.removeItem(STORAGE_KEY_SESSIONS_CLEARED);
      } catch (err) {
        console.error("[LocalStorageSessionRepository] Error clearing flag:", err);
      }
    }
    this.persist();
  }

  async getMetricsSummary(filter?: SessionFilter): Promise<SessionMetricsSummary> {
    const sessions = await this.list(filter);
    const total = sessions.length;

    if (total === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        escalatedSessions: 0,
        resolvedSessions: 0,
        abandonedSessions: 0,
        resolutionRate: 0,
        escalationRate: 0,
        averageDurationSeconds: 0,
        averageLatencyMs: null,
        agentVolumeDistribution: [],
        outcomeDistribution: {},
        statusDistribution: {},
      };
    }

    const completed = sessions.filter((s) => s.status === "completed").length;
    const resolved = sessions.filter((s) => s.outcome === "resolved").length;
    const escalated = sessions.filter((s) => s.outcome === "escalated" || s.escalation?.occurred).length;
    const abandoned = sessions.filter((s) => s.status === "abandoned" || s.outcome === "abandoned").length;

    const totalDuration = sessions.reduce((acc, s) => acc + (s.metrics.durationSeconds || 0), 0);
    const sessionsWithLatency = sessions.filter(
      (s) => s.metrics.averageLatencyMs !== null && s.metrics.averageLatencyMs !== undefined
    );
    const totalLatency = sessionsWithLatency.reduce(
      (acc, s) => acc + (s.metrics.averageLatencyMs || 0),
      0
    );

    // Agent volume
    const agentMap: Record<string, { agentId: string; agentName: string; count: number }> = {};
    const outcomeDist: Record<string, number> = {};
    const statusDist: Record<string, number> = {};

    for (const s of sessions) {
      // Agent Volume
      if (!agentMap[s.agentId]) {
        agentMap[s.agentId] = { agentId: s.agentId, agentName: s.agentName, count: 0 };
      }
      agentMap[s.agentId].count += 1;

      // Outcome Distribution
      outcomeDist[s.outcome] = (outcomeDist[s.outcome] || 0) + 1;

      // Status Distribution
      statusDist[s.status] = (statusDist[s.status] || 0) + 1;
    }

    return {
      totalSessions: total,
      completedSessions: completed,
      escalatedSessions: escalated,
      resolvedSessions: resolved,
      abandonedSessions: abandoned,
      resolutionRate: Math.round((resolved / total) * 100),
      escalationRate: Math.round((escalated / total) * 100),
      averageDurationSeconds: Math.round(totalDuration / total),
      averageLatencyMs:
        sessionsWithLatency.length > 0 ? Math.round(totalLatency / sessionsWithLatency.length) : null,
      agentVolumeDistribution: Object.values(agentMap).sort((a, b) => b.count - a.count),
      outcomeDistribution: outcomeDist,
      statusDistribution: statusDist,
    };
  }
}

export const defaultSessionRepository = new LocalStorageSessionRepository();
