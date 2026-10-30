import { ConversationSession } from "@/types/agent";
import { defaultSessionRepository, LocalStorageSessionRepository } from "../repositories/session-repository";
import { defaultMockSessionProvider, MockScenarioOptions, MockSessionProvider } from "../providers/mock-session-provider";

/**
 * Service that orchestrates session generation, persistence, and querying.
 */
export class SessionService {
  private repository: LocalStorageSessionRepository;
  private provider: MockSessionProvider;

  constructor(
    repository: LocalStorageSessionRepository = defaultSessionRepository,
    provider: MockSessionProvider = defaultMockSessionProvider
  ) {
    this.repository = repository;
    this.provider = provider;
  }

  async createSimulatedSession(options: MockScenarioOptions): Promise<ConversationSession> {
    const session = this.provider.generateSession(options);
    return await this.repository.create(session);
  }

  async seedSampleSessions(agentId: string, agentName: string): Promise<ConversationSession[]> {
    const scenarios: MockScenarioOptions["scenarioType"][] = [
      "appointment_booking",
      "customer_enquiry",
      "complaint_escalation",
      "unresolved_request",
    ];

    const results: ConversationSession[] = [];
    for (const sc of scenarios) {
      const s = await this.createSimulatedSession({
        agentId,
        agentName,
        scenarioType: sc,
      });
      results.push(s);
    }
    return results;
  }
}

export const defaultSessionService = new SessionService();
