import { AgentConfig, AgentConfigSchema } from "@/types";
import {
  AgentRefinementProvider,
  AgentRefinementResult,
} from "@/types/providers";
import { defaultAgentRefinementProvider } from "@/lib/providers/agent-refinement-provider";

export interface RefineAgentRequest {
  currentConfig: AgentConfig;
  instruction: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; text: string }>;
}

export interface RefineAgentResponse {
  success: boolean;
  proposedConfig?: AgentConfig;
  modifiedFields?: (keyof AgentConfig)[];
  explanation?: string;
  clarifications?: string[];
  source?: "rule-based-mock" | "llm-refinement" | "fallback";
  error?: string;
}

/**
 * Service that orchestrates conversational agent refinement.
 * Validates current configuration, checks user instruction validity,
 * delegates to the active AgentRefinementProvider, and verifies that the output
 * strictly adheres to AgentConfigSchema without compromising unrelated fields.
 */
export class AgentRefinementService {
  private provider: AgentRefinementProvider;

  constructor(provider: AgentRefinementProvider = defaultAgentRefinementProvider) {
    this.provider = provider;
  }

  setProvider(provider: AgentRefinementProvider): void {
    this.provider = provider;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  async refineAgent(request: RefineAgentRequest): Promise<RefineAgentResponse> {
    const trimmed = (request.instruction || "").trim();
    if (!trimmed) {
      return {
        success: false,
        error: "Please enter a refinement instruction.",
      };
    }

    if (trimmed.length > 3000) {
      return {
        success: false,
        error: "Instruction exceeds maximum length (3,000 characters). Please provide a more concise request.",
      };
    }

    // Ensure currentConfig passes validation
    const currentValidation = AgentConfigSchema.safeParse(request.currentConfig);
    if (!currentValidation.success) {
      return {
        success: false,
        error: "Cannot refine agent: current configuration has invalid data structures.",
      };
    }

    try {
      const result: AgentRefinementResult = await this.provider.refineAgent({
        currentConfig: currentValidation.data,
        instruction: trimmed,
        conversationHistory: request.conversationHistory,
      });

      // Verify that the proposedConfig is valid
      const parsedProposed = AgentConfigSchema.safeParse(result.proposedConfig);
      if (!parsedProposed.success) {
        return {
          success: false,
          error: "Generated refinement produced an invalid configuration schema.",
        };
      }

      // Compute actual modified fields if not explicitly populated
      const actualModifiedFields: (keyof AgentConfig)[] = [];
      const keys = Object.keys(parsedProposed.data) as (keyof AgentConfig)[];
      for (const k of keys) {
        const origVal = JSON.stringify(currentValidation.data[k]);
        const newVal = JSON.stringify(parsedProposed.data[k]);
        if (origVal !== newVal) {
          actualModifiedFields.push(k);
        }
      }

      return {
        success: true,
        proposedConfig: parsedProposed.data,
        modifiedFields: actualModifiedFields.length > 0 ? actualModifiedFields : result.modifiedFields,
        explanation: result.explanation,
        clarifications: result.clarificationsNeeded,
        source: result.source || "rule-based-mock",
      };
    } catch (err: unknown) {
      console.error("[AgentRefinementService] Refinement failed:", err);
      const msg = err instanceof Error ? err.message : "Unexpected error during agent refinement.";
      return {
        success: false,
        error: msg,
      };
    }
  }
}

export const defaultAgentRefinementService = new AgentRefinementService();
