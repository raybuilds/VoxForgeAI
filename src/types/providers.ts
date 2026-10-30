import { Agent, AgentConfig, ConversationSession } from "./agent";

/**
 * Filter options for querying agents
 */
export interface AgentFilter {
  search?: string;
  status?: Agent["status"];
  language?: string;
  includeDemo?: boolean;
}

/**
 * Repository interface for agent storage & retrieval
 */
export interface AgentRepository {
  getById(id: string): Promise<Agent | null>;
  list(filter?: AgentFilter): Promise<Agent[]>;
  create(config: AgentConfig): Promise<Agent>;
  update(id: string, updates: Partial<AgentConfig>): Promise<Agent>;
  updateStatus(id: string, status: Agent["status"]): Promise<Agent>;
  delete(id: string): Promise<void>;
  count(): Promise<{ total: number; published: number; draft: number }>;
  clearDemoData(): Promise<void>;
  resetToDemo(): Promise<void>;
  hasDemoData(): Promise<boolean>;
  isDemoAgent(id: string): boolean;
}

/**
 * Filter options for querying sessions
 */
export interface SessionFilter {
  agentId?: string;
  isTestSession?: boolean;
  status?: ConversationSession["status"];
  limit?: number;
}

/**
 * Repository interface for session storage & metrics
 */
export interface SessionRepository {
  getById(id: string): Promise<ConversationSession | null>;
  list(filter?: SessionFilter): Promise<ConversationSession[]>;
  save(session: ConversationSession): Promise<void>;
  getMetricsSummary(): Promise<{
    totalSessions: number;
    completedSessions: number;
    escalatedSessions: number;
    averageDurationSeconds: number;
    successRate: number;
  }>;
}

/**
 * Input prompt and metadata for natural-language agent creation
 */
export interface AgentGenerationInput {
  prompt: string;
  targetLanguage?: string;
  constraints?: string[];
}

/**
 * Output from prompt generation
 */
export interface AgentGenerationResult {
  suggestedConfig: AgentConfig;
  clarificationsNeeded?: string[];
  explanation: string;
  source?: "rule-based-mock" | "gemini-api" | "gemini-fallback";
}

/**
 * Interface for AI prompt-to-agent generation (e.g., LLM or specialized generator)
 */
export interface AgentGenerationProvider {
  name: string;
  generateFromPrompt(input: AgentGenerationInput): Promise<AgentGenerationResult>;
}

/**
 * Proposed refinement result returned by AgentRefinementProvider
 */
export interface AgentRefinementResult {
  proposedConfig: AgentConfig;
  modifiedFields: (keyof AgentConfig)[];
  explanation: string;
  clarificationsNeeded?: string[];
  source?: "rule-based-mock" | "llm-refinement" | "fallback";
}

/**
 * Input request for conversational agent refinement
 */
export interface AgentRefinementInput {
  currentConfig: AgentConfig;
  instruction: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; text: string }>;
}

/**
 * Provider abstraction for conversational agent refinement
 */
export interface AgentRefinementProvider {
  name: string;
  refineAgent(input: AgentRefinementInput): Promise<AgentRefinementResult>;
}

/**
 * Real-time event emitted during a voice session
 */
export type VoiceSessionEvent =
  | { type: "connected"; sessionId: string }
  | { type: "speaking_started"; source: "agent" | "user" }
  | { type: "speaking_ended"; source: "agent" | "user" }
  | { type: "transcript_delta"; role: "user" | "agent"; text: string; isFinal: boolean }
  | { type: "interrupted" }
  | { type: "error"; error: string }
  | { type: "ended"; reason: string };

/**
 * Client connection credentials or token for starting a voice session
 */
export interface VoiceConnectionConfig {
  agentId: string;
  providerAgentId?: string;
  audioInputDevice?: string;
  audioOutputDevice?: string;
}

/**
 * Provider-agnostic voice interface (supporting mock and future ElevenLabs)
 */
export interface VoiceProvider {
  readonly providerId: string;
  readonly isConnected: boolean;
  
  initialize(): Promise<boolean>;

  startSession(
    config: VoiceConnectionConfig,
    onEvent: (event: VoiceSessionEvent) => void
  ): Promise<{ sessionId: string }>;

  endSession(sessionId: string): Promise<void>;

  publishAgent(agent: Agent): Promise<{ externalProviderId: string }>;
}
