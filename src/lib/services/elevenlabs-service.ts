import { AgentConfig } from "@/types";

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  labels?: Record<string, string>;
  preview_url?: string;
}

export interface ElevenLabsConversationSummary {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  message_count: number;
  call_successful?: string;
}

export interface ElevenLabsTranscriptTurn {
  role: "user" | "agent";
  message: string;
  time_in_call_secs?: number;
}

export interface ElevenLabsConversationDetail {
  conversation_id: string;
  agent_id: string;
  status: string;
  start_time_unix_secs: number;
  call_duration_secs: number;
  transcript: ElevenLabsTranscriptTurn[];
  metadata?: Record<string, unknown>;
  analysis?: {
    call_successful?: string;
    transcript_summary?: string;
    evaluation_criteria_results?: Record<string, unknown>;
    data_collection_results?: Record<string, unknown>;
  };
}

export class ElevenLabsService {
  private static BASE_URL = "https://api.elevenlabs.io";

  private getApiKey(): string {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key || !key.trim()) {
      throw new Error(
        "ELEVENLABS_API_KEY is not configured on the server. Please add your ELEVENLABS_API_KEY to your environment variables or .env.local file."
      );
    }
    return key.trim();
  }

  /**
   * Compiles structured AgentConfig into a comprehensive instruction prompt for ElevenLabs.
   */
  public compileSystemPrompt(config: AgentConfig): string {
    const sections: string[] = [];

    // Persona
    sections.push(`[ROLE & PERSONA]\nYou are ${config.name}.\n${config.persona}`);

    // System Instructions
    if (config.systemInstructions) {
      sections.push(`[CORE SYSTEM INSTRUCTIONS]\n${config.systemInstructions}`);
    }

    // Goals
    if (config.goals && config.goals.length > 0) {
      sections.push(
        `[PRIMARY GOALS]\n${config.goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}`
      );
    }

    // Conversation Steps
    if (config.conversationSteps && config.conversationSteps.length > 0) {
      const sortedSteps = [...config.conversationSteps].sort((a, b) => a.order - b.order);
      const stepsText = sortedSteps
        .map(
          (s) =>
            `Stage ${s.order}: ${s.name}\n- Directive: ${s.instruction}${
              s.requiredInformation && s.requiredInformation.length > 0
                ? `\n- Required Details: ${s.requiredInformation.join(", ")}`
                : ""
            }`
        )
        .join("\n\n");
      sections.push(`[STRUCTURED CONVERSATION WORKFLOW]\n${stepsText}`);
    }

    // Guardrails
    if (config.guardrails && config.guardrails.length > 0) {
      const guardrailsText = config.guardrails
        .map(
          (g, i) =>
            `${i + 1}. RULE: ${g.rule}\n   ACTION ON VIOLATION: ${g.actionOnViolation}${
              g.customResponse ? `\n   REFUSAL RESPONSE: "${g.customResponse}"` : ""
            }`
        )
        .join("\n");
      sections.push(`[SAFETY & OPERATIONAL GUARDRAILS]\n${guardrailsText}`);
    }

    // Escalation Rules
    if (config.escalationRules && config.escalationRules.length > 0) {
      const escalationText = config.escalationRules
        .map(
          (e, i) =>
            `${i + 1}. WHEN: ${e.condition}\n   TARGET: ${e.target}${
              e.handoffSummaryPrompt ? `\n   HANDOFF SUMMARY DIRECTIVE: ${e.handoffSummaryPrompt}` : ""
            }`
        )
        .join("\n");
      sections.push(`[HUMAN ESCALATION PROTOCOLS]\n${escalationText}`);
    }

    return sections.join("\n\n");
  }

  /**
   * Fetches available voices from ElevenLabs.
   */
  async listVoices(): Promise<ElevenLabsVoice[]> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${ElevenLabsService.BASE_URL}/v1/voices`, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Accept": "application/json",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(
        `ElevenLabs voices request failed (HTTP ${res.status}): ${errorText || res.statusText}`
      );
    }

    const data = await res.json();
    const rawVoices = Array.isArray(data.voices) ? data.voices : [];
    return rawVoices.map((v: {
      voice_id: string;
      name: string;
      category?: string;
      description?: string;
      labels?: Record<string, string>;
      preview_url?: string;
    }) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
      description: v.description,
      labels: v.labels,
      preview_url: v.preview_url,
    }));
  }

  /**
   * Creates an autonomous conversational agent in ElevenLabs.
   */
  async createAgent(config: AgentConfig): Promise<{ agent_id: string }> {
    const apiKey = this.getApiKey();
    const prompt = this.compileSystemPrompt(config);
    const langCode = config.language?.split("-")[0]?.toLowerCase() || "en";

    const payload = {
      name: config.name,
      conversation_config: {
        agent: {
          prompt: {
            prompt,
            llm: "gemini-2.0-flash",
            temperature: 0.7,
          },
          first_message: config.welcomeMessage,
          language: langCode,
        },
        tts: {
          voice_id: config.voiceId || "21m00Tcm4TlvDq8ikWAM",
        },
      },
    };

    const res = await fetch(`${ElevenLabsService.BASE_URL}/v1/convai/agents/create`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(
        `Failed to create ElevenLabs agent (HTTP ${res.status}): ${err || res.statusText}`
      );
    }

    const data = await res.json();
    if (!data.agent_id) {
      throw new Error("ElevenLabs did not return an agent_id in creation response");
    }

    return { agent_id: data.agent_id };
  }

  /**
   * Retrieves remote ElevenLabs agent configuration.
   */
  async getAgent(agentId: string): Promise<Record<string, unknown>> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${ElevenLabsService.BASE_URL}/v1/convai/agents/${encodeURIComponent(agentId)}`, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(
        `Failed to fetch ElevenLabs agent ${agentId} (HTTP ${res.status}): ${err || res.statusText}`
      );
    }

    return await res.json();
  }

  /**
   * Updates an existing ElevenLabs agent configuration.
   */
  async updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<Record<string, unknown>> {
    const apiKey = this.getApiKey();
    const payload: Record<string, unknown> = {};

    if (config.name) {
      payload.name = config.name;
    }

    const convConfig: Record<string, unknown> = {};
    const agentObj: Record<string, unknown> = {};

    if (config.systemInstructions || config.persona || config.goals || config.conversationSteps || config.guardrails || config.escalationRules) {
      // Re-compile system prompt if any prompt fields changed
      const prompt = this.compileSystemPrompt({
        name: config.name || "Agent",
        description: config.description || "",
        persona: config.persona || "",
        goals: config.goals || [],
        systemInstructions: config.systemInstructions || "",
        welcomeMessage: config.welcomeMessage || "",
        language: config.language || "en-US",
        voiceId: config.voiceId,
        voiceProviderSettings: config.voiceProviderSettings || {},
        conversationSteps: config.conversationSteps || [],
        guardrails: config.guardrails || [],
        escalationRules: config.escalationRules || [],
      });

      agentObj.prompt = {
        prompt,
        llm: "gemini-2.0-flash",
        temperature: 0.7,
      };
    }

    if (config.welcomeMessage !== undefined) {
      agentObj.first_message = config.welcomeMessage;
    }

    if (config.language !== undefined) {
      agentObj.language = config.language.split("-")[0]?.toLowerCase() || "en";
    }

    if (Object.keys(agentObj).length > 0) {
      convConfig.agent = agentObj;
    }

    if (config.voiceId) {
      convConfig.tts = {
        voice_id: config.voiceId,
      };
    }

    if (Object.keys(convConfig).length > 0) {
      payload.conversation_config = convConfig;
    }

    const res = await fetch(`${ElevenLabsService.BASE_URL}/v1/convai/agents/${encodeURIComponent(agentId)}`, {
      method: "PATCH",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(
        `Failed to update ElevenLabs agent ${agentId} (HTTP ${res.status}): ${err || res.statusText}`
      );
    }

    return await res.json();
  }

  /**
   * Deletes an ElevenLabs agent.
   */
  async deleteAgent(agentId: string): Promise<void> {
    const apiKey = this.getApiKey();
    const res = await fetch(`${ElevenLabsService.BASE_URL}/v1/convai/agents/${encodeURIComponent(agentId)}`, {
      method: "DELETE",
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!res.ok && res.status !== 404) {
      const err = await res.text().catch(() => "");
      throw new Error(
        `Failed to delete ElevenLabs agent ${agentId} (HTTP ${res.status}): ${err || res.statusText}`
      );
    }
  }

  /**
   * Generates a signed URL for client-side authenticated WebSocket voice sessions.
   * Master API key is NEVER sent to browser client.
   */
  async getSignedUrl(agentId: string): Promise<{ signed_url: string }> {
    const apiKey = this.getApiKey();
    const url = `${ElevenLabsService.BASE_URL}/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(
        `Failed to generate signed URL for agent ${agentId} (HTTP ${res.status}): ${err || res.statusText}`
      );
    }

    const data = await res.json();
    if (!data.signed_url) {
      throw new Error("ElevenLabs did not return a signed_url in response");
    }

    return { signed_url: data.signed_url };
  }

  /**
   * Fetches list of conversations from ElevenLabs.
   */
  async listConversations(params?: {
    agentId?: string;
    pageSize?: number;
    cursor?: string;
  }): Promise<{
    conversations: ElevenLabsConversationSummary[];
    has_more: boolean;
    next_cursor?: string;
  }> {
    const apiKey = this.getApiKey();
    const searchParams = new URLSearchParams();
    if (params?.agentId) searchParams.set("agent_id", params.agentId);
    if (params?.pageSize) searchParams.set("page_size", params.pageSize.toString());
    if (params?.cursor) searchParams.set("cursor", params.cursor);

    const query = searchParams.toString();
    const url = `${ElevenLabsService.BASE_URL}/v1/convai/conversations${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(
        `Failed to fetch ElevenLabs conversations (HTTP ${res.status}): ${err || res.statusText}`
      );
    }

    const data = await res.json();
    return {
      conversations: Array.isArray(data.conversations) ? data.conversations : [],
      has_more: Boolean(data.has_more),
      next_cursor: data.next_cursor || undefined,
    };
  }

  /**
   * Fetches full conversation details including transcript.
   */
  async getConversation(conversationId: string): Promise<ElevenLabsConversationDetail> {
    const apiKey = this.getApiKey();
    const url = `${ElevenLabsService.BASE_URL}/v1/convai/conversations/${encodeURIComponent(conversationId)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(
        `Failed to fetch conversation ${conversationId} (HTTP ${res.status}): ${err || res.statusText}`
      );
    }

    return await res.json();
  }
}

export const defaultElevenLabsService = new ElevenLabsService();
