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
  id: z.string().uuid(),
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
  timestamp: z.string().datetime(),
  latencyMs: z.number().int().nonnegative().optional(),
});
export type TranscriptMessage = z.infer<typeof TranscriptMessageSchema>;

/**
 * Session metrics for analytics
 */
export const SessionMetricsSchema = z.object({
  durationSeconds: z.number().int().nonnegative().default(0),
  userTurns: z.number().int().nonnegative().default(0),
  agentTurns: z.number().int().nonnegative().default(0),
  averageLatencyMs: z.number().int().nonnegative().default(0),
  interruptionCount: z.number().int().nonnegative().default(0),
  outcome: z.enum(["completed", "escalated", "abandoned", "error"]).default("completed"),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
});
export type SessionMetrics = z.infer<typeof SessionMetricsSchema>;

/**
 * Conversation Session entity
 */
export const ConversationSessionSchema = z.object({
  id: z.string().uuid(),
  agentId: z.string().uuid(),
  agentName: z.string(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  status: z.enum(["active", "completed", "failed", "escalated"]),
  transcript: z.array(TranscriptMessageSchema).default([]),
  metrics: SessionMetricsSchema,
  summary: z.string().optional(),
  isTestSession: z.boolean().default(true),
});
export type ConversationSession = z.infer<typeof ConversationSessionSchema>;
