import { z } from "zod";

/**
 * Supported Agent status states
 */
export const AgentStatusSchema = z.enum(["draft", "testing", "published", "archived"]);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

/**
 * Step in a structured voice conversation workflow
 */
export const ConversationStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  instruction: z.string().min(1),
  order: z.number().int().nonnegative(),
  requiredInformation: z.array(z.string()).default([]),
});
export type ConversationStep = z.infer<typeof ConversationStepSchema>;

/**
 * Guardrail rules to keep agent on topic and prevent unauthorized actions
 */
export const GuardrailSchema = z.object({
  id: z.string().min(1),
  rule: z.string().min(1),
  actionOnViolation: z.enum(["refuse_politely", "escalate_to_human", "terminate_session"]),
  customResponse: z.string().optional(),
});
export type Guardrail = z.infer<typeof GuardrailSchema>;

/**
 * Escalation rule to transfer or request supervisor intervention
 */
export const EscalationRuleSchema = z.object({
  id: z.string().min(1),
  condition: z.string().min(1),
  target: z.string().min(1), // e.g., "human_support_queue", "supervisor_phone"
  handoffSummaryPrompt: z.string().optional(),
});
export type EscalationRule = z.infer<typeof EscalationRuleSchema>;

/**
 * Voice Agent Configuration Model
 */
export const AgentConfigSchema = z.object({
  name: z.string().min(1, "Agent name is required").max(80),
  description: z.string().max(300).default(""),
  persona: z.string().min(1, "Persona description is required"),
  goals: z.array(z.string()).min(1, "At least one primary goal is required"),
  systemInstructions: z.string().min(1, "System instructions are required"),
  welcomeMessage: z.string().min(1, "Welcome message is required"),
  language: z.string().default("en-US"),
  voiceId: z.string().optional(),
  voiceProviderSettings: z.record(z.string(), z.unknown()).default({}),
  conversationSteps: z.array(ConversationStepSchema).default([]),
  guardrails: z.array(GuardrailSchema).default([]),
  escalationRules: z.array(EscalationRuleSchema).default([]),
});
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Complete Agent entity
 */
export const AgentSchema = z.object({
  id: z.string().min(1),
  config: AgentConfigSchema,
  status: AgentStatusSchema.default("draft"),
  version: z.number().int().positive().default(1),
  externalProviderId: z.string().optional(), // ElevenLabs agent ID when published
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().optional(),
});
export type Agent = z.infer<typeof AgentSchema>;

/**
 * Transcript message role
 */
export const TranscriptRoleSchema = z.enum(["user", "agent", "system"]);
export type TranscriptRole = z.infer<typeof TranscriptRoleSchema>;

/**
 * Individual transcript entry in a voice interaction
 */
export const TranscriptMessageSchema = z.object({
  id: z.string().min(1),
  role: TranscriptRoleSchema,
  text: z.string(),
  timestamp: z.string(),
  latencyMs: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type TranscriptMessage = z.infer<typeof TranscriptMessageSchema>;

/**
 * Supported Session lifecycle states
 */
export const SessionStatusSchema = z.enum([
  "queued",
  "in_progress",
  "completed",
  "failed",
  "abandoned",
]);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

/**
 * Supported Session outcome classifications
 */
export const SessionOutcomeSchema = z.enum([
  "resolved",
  "escalated",
  "unresolved",
  "abandoned",
  "unknown",
]);
export type SessionOutcome = z.infer<typeof SessionOutcomeSchema>;

/**
 * Session origin / runtime source
 */
export const SessionSourceSchema = z.enum([
  "simulated",
  "elevenlabs", // future-compatible type, not actively connected in M5
]);
export type SessionSource = z.infer<typeof SessionSourceSchema>;

/**
 * Session metrics for analytics
 */
export const SessionMetricsSchema = z.object({
  durationSeconds: z.number().int().nonnegative().default(0),
  userTurns: z.number().int().nonnegative().default(0),
  agentTurns: z.number().int().nonnegative().default(0),
  totalMessages: z.number().int().nonnegative().default(0),
  averageLatencyMs: z.number().int().nonnegative().nullable().optional(),
  firstResponseLatencyMs: z.number().int().nonnegative().nullable().optional(),
  interruptionCount: z.number().int().nonnegative().default(0),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  isSimulatedMetrics: z.boolean().default(true),
});
export type SessionMetrics = z.infer<typeof SessionMetricsSchema>;

/**
 * Escalation tracking metadata
 */
export const SessionEscalationSchema = z.object({
  occurred: z.boolean().default(false),
  reason: z.string().optional(),
  target: z.string().optional(),
  escalatedAt: z.string().optional(),
});
export type SessionEscalation = z.infer<typeof SessionEscalationSchema>;

/**
 * Complete Conversation Session entity (M5 Observability)
 */
export const ConversationSessionSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  agentName: z.string(), // Snapshot of agent name at session time
  source: SessionSourceSchema.default("simulated"),
  status: SessionStatusSchema.default("completed"),
  outcome: SessionOutcomeSchema.default("resolved"),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  summary: z.string().optional(),
  transcript: z.array(TranscriptMessageSchema).default([]),
  metrics: SessionMetricsSchema,
  escalation: SessionEscalationSchema.optional(),
  isTestSession: z.boolean().default(true),
  createdAt: z.string().default(() => new Date().toISOString()),
});
export type ConversationSession = z.infer<typeof ConversationSessionSchema>;
