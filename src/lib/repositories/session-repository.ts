import { ConversationSession, SessionFilter, SessionRepository } from "@/types";
import { DEMO_SESSIONS } from "../demo-data";

/**
 * In-memory session repository implementation.
 * Prepares the architecture for persisting testing and live call records in M3/M4.
 */
export class InMemorySessionRepository implements SessionRepository {
  private sessions: Map<string, ConversationSession> = new Map();

  constructor(initialSessions: ConversationSession[] = DEMO_SESSIONS) {
    initialSessions.forEach((s) => this.sessions.set(s.id, { ...s }));
  }

  async getById(id: string): Promise<ConversationSession | null> {
    const session = this.sessions.get(id);
    return session ? { ...session } : null;
  }

  async list(filter?: SessionFilter): Promise<ConversationSession[]> {
    let result = Array.from(this.sessions.values());

    if (filter?.agentId) {
      result = result.filter((s) => s.agentId === filter.agentId);
    }

    if (filter?.status) {
      result = result.filter((s) => s.status === filter.status);
    }

    if (filter?.isTestSession !== undefined) {
      result = result.filter((s) => s.isTestSession === filter.isTestSession);
    }

    result.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    if (filter?.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  async save(session: ConversationSession): Promise<void> {
    this.sessions.set(session.id, { ...session });
  }

  async getMetricsSummary(): Promise<{
    totalSessions: number;
    completedSessions: number;
    escalatedSessions: number;
    averageDurationSeconds: number;
    successRate: number;
  }> {
    const list = Array.from(this.sessions.values());
    const total = list.length;
    if (total === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        escalatedSessions: 0,
        averageDurationSeconds: 0,
        successRate: 0,
      };
    }

    const completed = list.filter((s) => s.status === "completed").length;
    const escalated = list.filter((s) => s.status === "escalated").length;
    const totalSeconds = list.reduce(
      (sum, s) => sum + s.metrics.durationSeconds,
      0
    );

    return {
      totalSessions: total,
      completedSessions: completed,
      escalatedSessions: escalated,
      averageDurationSeconds: Math.round(totalSeconds / total),
      successRate: Math.round((completed / total) * 100),
    };
  }
}

export const defaultSessionRepository = new InMemorySessionRepository();
