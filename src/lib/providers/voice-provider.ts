import {
  Agent,
  VoiceConnectionConfig,
  VoiceProvider,
  VoiceSessionEvent,
} from "@/types";

/**
 * Placeholder mock voice provider for milestone 1 & 2.
 * Strictly communicates disconnected state; does not simulate real audio or pretend live audio is active.
 */
export class MockVoiceProvider implements VoiceProvider {
  readonly providerId = "mock-disconnected";
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async initialize(): Promise<boolean> {
    // In M1, provider is explicitly not connected.
    this._isConnected = false;
    return false;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  async startSession(
    config: VoiceConnectionConfig,
    onEvent: (event: VoiceSessionEvent) => void
  ): Promise<{ sessionId: string }> {
    throw new Error(
      "Voice provider is currently not connected. Live voice streaming will be activated in upcoming milestones."
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

export const defaultVoiceProvider = new MockVoiceProvider();
