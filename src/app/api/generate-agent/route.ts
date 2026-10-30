import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AgentConfigSchema } from "@/types";
import { AgentGenerationInput } from "@/types/providers";
import { MockAgentGenerationProvider } from "@/lib/providers/agent-generation-provider";

/**
 * Strict Zod validation schema for the /api/generate-agent request payload.
 */
const GenerateAgentApiInputSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt cannot be empty")
    .max(5000, "Prompt exceeds maximum allowed length of 5000 characters"),
  targetLanguage: z
    .string()
    .min(2, "Language code must be at least 2 characters")
    .max(10, "Language code cannot exceed 10 characters")
    .optional(),
  constraints: z
    .array(z.string())
    .max(50, "Exceeded maximum number of constraints")
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    let rawJson: unknown;
    try {
      rawJson = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed request payload: Body must be valid JSON." },
        { status: 400 }
      );
    }

    // Strengthened input validation
    const parsedInput = GenerateAgentApiInputSchema.safeParse(rawJson);
    if (!parsedInput.success) {
      const firstError = parsedInput.error.issues[0]?.message || "Invalid input parameters.";
      return NextResponse.json(
        { error: firstError, details: parsedInput.error.issues },
        { status: 400 }
      );
    }

    const validatedInput: AgentGenerationInput = {
      prompt: parsedInput.data.prompt,
      targetLanguage: parsedInput.data.targetLanguage || "en-US",
      constraints: parsedInput.data.constraints,
    };

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      // Server-side fallback: Use deterministic generator when no API key is in environment
      const mockProvider = new MockAgentGenerationProvider();
      const result = await mockProvider.generateFromPrompt(validatedInput);
      return NextResponse.json({
        ...result,
        source: "rule-based-mock",
        explanation: `${result.explanation} (Generated using deterministic rule-based mock engine; no Gemini API key configured).`,
      });
    }

    // Call Google Gemini API securely on the server
    const systemPrompt = `You are an expert Voice AI Agent Architect for VoxForge AI.
Your task is to take a natural-language description of an autonomous voice assistant and generate a strictly valid JSON configuration conforming to the AgentConfig specification.
The output MUST be a JSON object with this exact structure:
{
  "suggestedConfig": {
    "name": string (max 80 chars),
    "description": string (max 300 chars),
    "persona": string (conversational character, tone, manner),
    "goals": string[] (at least 1 primary goal),
    "systemInstructions": string (detailed turn-taking and conversational directives),
    "welcomeMessage": string (initial greeting spoken upon call connection),
    "language": string (e.g. "en-US"),
    "conversationSteps": [
      {
        "id": string,
        "name": string,
        "instruction": string,
        "order": number,
        "requiredInformation": string[]
      }
    ],
    "guardrails": [
      {
        "id": string,
        "rule": string,
        "actionOnViolation": "refuse_politely" | "escalate_to_human" | "terminate_session",
        "customResponse": string (optional spoken refusal)
      }
    ],
    "escalationRules": [
      {
        "id": string,
        "condition": string,
        "target": string,
        "handoffSummaryPrompt": string (optional)
      }
    ]
  },
  "explanation": string (brief summary of how requirements were mapped)
}
Return ONLY valid JSON without markdown fences.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: `User Description: ${validatedInput.prompt}\nTarget Language: ${validatedInput.targetLanguage || "en-US"}` },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn("Gemini API call failed, falling back to rule-based generator");
      const mockProvider = new MockAgentGenerationProvider();
      const result = await mockProvider.generateFromPrompt(validatedInput);
      return NextResponse.json({
        ...result,
        source: "gemini-fallback",
        explanation: `${result.explanation} (Note: Gemini API call failed with status ${response.status}; falling back to deterministic mock generator).`,
      });
    }

    const geminiData = await response.json();
    const candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Empty response received from Gemini API");
    }

    const parsedJson = JSON.parse(candidateText);
    const validatedConfig = AgentConfigSchema.parse(parsedJson.suggestedConfig);

    return NextResponse.json({
      suggestedConfig: validatedConfig,
      source: "gemini-api",
      explanation: parsedJson.explanation || "Agent synthesized via Gemini 2.5 Flash.",
    });
  } catch (error: unknown) {
    console.error("API /api/generate-agent error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
