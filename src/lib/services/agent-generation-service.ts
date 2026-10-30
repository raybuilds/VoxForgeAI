import { AgentConfig, AgentConfigSchema } from "@/types";
import { AgentGenerationInput, AgentGenerationProvider, AgentGenerationResult } from "@/types/providers";
import { defaultAgentGenerationProvider } from "@/lib/providers/agent-generation-provider";

export interface GenerateAgentRequest {
  prompt: string;
  language?: string;
  constraints?: string[];
}

export interface GenerateAgentResponse {
  success: boolean;
  config?: AgentConfig;
  explanation?: string;
  clarifications?: string[];
  source?: "rule-based-mock" | "gemini-api" | "gemini-fallback";
  error?: string;
}

/**
 * Service orchestrating natural-language prompt validation,
 * delegation to the AgentGenerationProvider, and Zod integrity verification.
 */
export class AgentGenerationService {
  private provider: AgentGenerationProvider;

  constructor(provider: AgentGenerationProvider = defaultAgentGenerationProvider) {
    this.provider = provider;
  }

  /**
   * Sets or switches the active generator provider cleanly.
   */
  setProvider(provider: AgentGenerationProvider): void {
    this.provider = provider;
  }

  /**
   * Returns the name of the currently active provider.
   */
  getProviderName(): string {
    return this.provider.name;
  }

  async generateAgent(request: GenerateAgentRequest): Promise<GenerateAgentResponse> {
    const trimmed = (request.prompt || "").trim();
    if (!trimmed) {
      return {
        success: false,
        error: "Please enter a description for the voice agent you want to create.",
      };
    }

    if (trimmed.length < 10) {
      return {
        success: false,
        error: "Please provide a slightly more descriptive prompt (at least 10 characters) explaining your use case.",
      };
    }

    if (trimmed.length > 5000) {
      return {
        success: false,
        error: "Description prompt exceeds the maximum limit of 5000 characters. Please shorten your prompt.",
      };
    }

    try {
      const input: AgentGenerationInput = {
        prompt: trimmed,
        targetLanguage: request.language || "en-US",
        constraints: request.constraints,
      };

      const result: AgentGenerationResult = await this.provider.generateFromPrompt(input);

      // Enforce Zod validation boundary
      const parseResult = AgentConfigSchema.safeParse(result.suggestedConfig);
      if (!parseResult.success) {
        console.error("Provider returned invalid configuration:", parseResult.error);
        return {
          success: false,
          error: "The generator produced an incompatible configuration structure. Please try refining your prompt.",
        };
      }

      return {
        success: true,
        config: parseResult.data,
        explanation: result.explanation,
        clarifications: result.clarificationsNeeded,
        source: result.source || "rule-based-mock",
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during generation.";
      console.error("AgentGenerationService error:", err);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const defaultAgentGenerationService = new AgentGenerationService();
