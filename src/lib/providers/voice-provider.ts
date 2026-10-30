import {
  Agent,
  VoiceConnectionConfig,
  VoiceProvider,
  VoiceSessionEvent,
} from "@/types";

/**
 * Placeholder mock voice provider for explicitly labeled offline/demo testing.
 * Strictly communicates disconnected state; does not simulate real audio or pretend live audio is active.
 */
export class MockVoiceProvider implements VoiceProvider {
  readonly providerId = "mock-disconnected";
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async initialize(): Promise<boolean> {
    this._isConnected = false;
    return false;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  async startSession(
    config: VoiceConnectionConfig,
    onEvent: (event: VoiceSessionEvent) => void
  ): Promise<{ sessionId: string }> {
    throw new Error(
      "Mock voice provider is disconnected. Live voice streaming requires ElevenLabs Conversational AI."
    );
  }

  async endSession(sessionId: string): Promise<void> {
    // No-op in disconnected state
  }

  async publishAgent(agent: Agent): Promise<{ externalProviderId: string }> {
    throw new Error(
      "Publishing requires a connected ElevenLabs provider instance."
    );
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

/**
 * Real ElevenLabs Voice Provider.
 * Communicates with the server-side ElevenLabs API routes for agent publishing and signed URL session orchestration.
 */
export class ElevenLabsVoiceProvider implements VoiceProvider {
  readonly providerId = "elevenlabs-conversational-ai";
  private _isConnected = true;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async initialize(): Promise<boolean> {
    try {
      const res = await fetch("/api/provider-status");
      if (res.ok) {
        const data = await res.json();
        this._isConnected = Boolean(data.elevenlabsConfigured);
        return this._isConnected;
      }
    } catch {
      this._isConnected = false;
    }
    return false;
  }

  async publishAgent(agent: Agent): Promise<{ externalProviderId: string }> {
    const res = await fetch("/api/elevenlabs/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agent.config),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to publish agent to ElevenLabs" }));
      throw new Error(err.error || `Publishing failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.agent_id) {
      throw new Error("ElevenLabs did not return an agent_id");
    }

    return { externalProviderId: data.agent_id };
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  async startSession(
    config: VoiceConnectionConfig,
    onEvent: (event: VoiceSessionEvent) => void
  ): Promise<{ sessionId: string }> {
    if (!config.providerAgentId) {
      throw new Error("Cannot start voice session: agent does not have an ElevenLabs providerAgentId");
    }

    // Fetch signed URL from server-side route
    const res = await fetch(`/api/elevenlabs/signed-url?agent_id=${encodeURIComponent(config.providerAgentId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to obtain signed URL" }));
      throw new Error(err.error || `Failed to generate signed URL (HTTP ${res.status})`);
    }

    const { signed_url } = await res.json();
    onEvent({ type: "connected", sessionId: config.providerAgentId });
    return { sessionId: config.providerAgentId };
  }

  async endSession(sessionId: string): Promise<void> {
    // Session termination handled in playground hook
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}

export const defaultVoiceProvider = new ElevenLabsVoiceProvider();
