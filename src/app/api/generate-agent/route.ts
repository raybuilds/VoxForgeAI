import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AgentConfigSchema } from "@/types";
import { AgentGenerationInput } from "@/types/providers";

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
  model: z.string().optional(),
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

    if (!geminiApiKey || !geminiApiKey.trim()) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your environment variables or .env.local file to synthesize voice agents with Gemini AI.",
          code: "MISSING_GEMINI_KEY",
        },
        { status: 401 }
      );
    }

    // Call Google Gemini API securely on the server
    const systemPrompt = `You are an expert Voice AI Agent Architect for VoxForge AI.
Your task is to take a natural-language description of an autonomous voice assistant and generate a strictly valid JSON configuration conforming to the AgentConfig specification.
The output MUST be a JSON object with this exact structure:
{
  "suggestedConfig": {
    "name": string (max 80 chars),
    "description": string (max 300 chars),
    "persona": string (conversational character, tone, manner suitable for spoken voice dialogue),
    "goals": string[] (at least 1 primary goal),
    "systemInstructions": string (detailed turn-taking directives, tone, phone etiquette, and conversation flow),
    "welcomeMessage": string (initial greeting spoken upon call connection),
    "language": string (e.g. "en-US"),
    "conversationSteps": [
      {
        "id": string (unique, e.g. "step-1"),
        "name": string,
        "instruction": string,
        "order": number (1, 2, 3...),
        "requiredInformation": string[]
      }
    ],
    "guardrails": [
      {
        "id": string (unique, e.g. "gr-1"),
        "rule": string,
        "actionOnViolation": "refuse_politely" | "escalate_to_human" | "terminate_session",
        "customResponse": string (spoken refusal statement)
      }
    ],
    "escalationRules": [
      {
        "id": string (unique, e.g. "esc-1"),
        "condition": string,
        "target": string (e.g. "human_support_queue"),
        "handoffSummaryPrompt": string
      }
    ]
  },
  "explanation": string (brief 1-2 sentence summary of how requirements were mapped into agent traits)
}
Return ONLY valid JSON without markdown fences.`;

    const preferredModel = parsedInput.data.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const candidateModels = Array.from(new Set([preferredModel, "gemini-2.0-flash", "gemini-1.5-flash"]));

    let lastError: { status: number; text: string } | null = null;
    let successfulData: unknown = null;

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    {
                      text: `User Description: ${validatedInput.prompt}\nTarget Language: ${validatedInput.targetLanguage || "en-US"}${
                        validatedInput.constraints?.length
                          ? `\nExplicit Constraints:\n- ${validatedInput.constraints.join("\n- ")}`
                          : ""
                      }`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
            signal: AbortSignal.timeout(30000), // 30-second timeout
          }
        );

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          lastError = { status: response.status, text: errText };
          // If model not found (404), try next model in fallback list
          if (response.status === 404) {
            continue;
          }
          // For other errors (e.g. 401, 403, 429), break immediately
          break;
        }

        successfulData = await response.json();
        break;
      } catch (err: unknown) {
        const isTimeout = err instanceof Error && err.name === "TimeoutError";
        lastError = {
          status: isTimeout ? 504 : 500,
          text: err instanceof Error ? err.message : "Request failed",
        };
        if (!isTimeout) continue;
        break;
      }
    }

    if (!successfulData) {
      const status = lastError?.status || 502;
      let errMsg = "Gemini API request failed";
      try {
        if (lastError?.text) {
          const parsed = JSON.parse(lastError.text);
          errMsg = parsed.error?.message || lastError.text;
        }
      } catch {
        errMsg = lastError?.text || errMsg;
      }

      if (status === 429) {
        return NextResponse.json(
          { error: `Gemini API rate limit exceeded: ${errMsg}. Please wait a moment and try again.` },
          { status: 429 }
        );
      }
      if (status === 401 || status === 403) {
        return NextResponse.json(
          { error: `Gemini API authentication failed: ${errMsg}. Please verify your GEMINI_API_KEY.` },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: `Gemini API error (HTTP ${status}): ${errMsg}` },
        { status: status >= 400 && status < 600 ? status : 502 }
      );
    }

    const geminiPayload = successfulData as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const candidateText = geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText || !candidateText.trim()) {
      return NextResponse.json(
        { error: "Empty or blank response received from Gemini API." },
        { status: 502 }
      );
    }

    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    let parsedJson: { suggestedConfig?: unknown; explanation?: string };
    try {
      parsedJson = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Failed to parse Gemini JSON:", cleanJson, parseErr);
      return NextResponse.json(
        { error: "Gemini returned invalid or unparseable JSON format." },
        { status: 502 }
      );
    }

    if (!parsedJson.suggestedConfig || typeof parsedJson.suggestedConfig !== "object") {
      return NextResponse.json(
        { error: "Gemini response missing 'suggestedConfig' root object." },
        { status: 502 }
      );
    }

    const validationResult = AgentConfigSchema.safeParse(parsedJson.suggestedConfig);
    if (!validationResult.success) {
      console.error("Gemini configuration schema validation failure:", validationResult.error);
      return NextResponse.json(
        {
          error: "Gemini generated an agent configuration that does not conform to the schema.",
          details: validationResult.error.issues,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      suggestedConfig: validationResult.data,
      source: "gemini-api",
      explanation: parsedJson.explanation || "Agent synthesized via Google Gemini API.",
    });
  } catch (error: unknown) {
    console.error("API /api/generate-agent uncaught error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
