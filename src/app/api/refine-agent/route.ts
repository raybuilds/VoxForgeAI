import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AgentConfig, AgentConfigSchema } from "@/types";

const RefineAgentApiInputSchema = z.object({
  currentConfig: AgentConfigSchema,
  instruction: z.string().trim().min(1, "Instruction cannot be empty").max(3000, "Instruction is too long"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string(),
      })
    )
    .optional(),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON payload in request body",
        },
        { status: 400 }
      );
    }

    const validation = RefineAgentApiInputSchema.safeParse(body);
    if (!validation.success) {
      const issue = validation.error.issues[0]?.message || "Invalid input schema";
      return NextResponse.json(
        {
          success: false,
          error: issue,
        },
        { status: 400 }
      );
    }

    const { currentConfig, instruction, conversationHistory } = validation.data;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey || !geminiApiKey.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your environment variables or .env.local file to refine agents with Gemini AI.",
          code: "MISSING_GEMINI_KEY",
        },
        { status: 401 }
      );
    }

    const systemPrompt = `You are an expert Voice AI Agent Architect for VoxForge AI.
Your task is to update and refine an existing Voice Agent Configuration based on a user's natural language instruction.

CRITICAL INSTRUCTIONS:
1. ONLY modify fields directly affected or requested by the user's instruction.
2. PRESERVE ALL OTHER FIELDS EXACTLY as they are in the current configuration.
3. The proposedConfig MUST be fully populated and strictly adhere to the AgentConfig schema:
   - name: string (max 80 chars)
   - description: string (max 300 chars)
   - persona: string
   - goals: string[] (at least 1 goal)
   - systemInstructions: string
   - welcomeMessage: string
   - language: string
   - voiceId?: string
   - conversationSteps: array of { id, name, instruction, order, requiredInformation }
   - guardrails: array of { id, rule, actionOnViolation, customResponse }
   - escalationRules: array of { id, condition, target, handoffSummaryPrompt }

The output MUST be a JSON object with this exact structure:
{
  "proposedConfig": { ...entire updated AgentConfig... },
  "modifiedFields": string[], // list of top-level keys modified (e.g. ["persona", "welcomeMessage"])
  "explanation": string, // clear explanation of what was updated and why
  "clarifications": string[] // optional follow-up suggestions or questions if the request was ambiguous
}
Return ONLY valid JSON without markdown fences.`;

    const userMessageContent = `CURRENT AGENT CONFIGURATION:
${JSON.stringify(currentConfig, null, 2)}

${
  conversationHistory && conversationHistory.length > 0
    ? `PREVIOUS REFINEMENT TURNS:
${conversationHistory.map((h) => `${h.role.toUpperCase()}: ${h.text}`).join("\n")}
`
    : ""
}
USER REFINEMENT INSTRUCTION:
${instruction}`;

    const preferredModel = validation.data.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const candidateModels = Array.from(new Set([preferredModel, "gemini-2.0-flash", "gemini-1.5-flash"]));

    let successfulData: unknown = null;
    let lastError: { status: number; text: string } | null = null;

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
                    { text: userMessageContent },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
            signal: AbortSignal.timeout(30000),
          }
        );

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          lastError = { status: response.status, text: errText };
          if (response.status === 404) continue;
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
      let errMsg = "Gemini refinement request failed";
      try {
        if (lastError?.text) {
          const parsed = JSON.parse(lastError.text);
          errMsg = parsed.error?.message || lastError.text;
        }
      } catch {
        errMsg = lastError?.text || errMsg;
      }

      return NextResponse.json(
        {
          success: false,
          error: `Gemini API error (HTTP ${status}): ${errMsg}`,
        },
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
        { success: false, error: "Empty response received from Gemini API." },
        { status: 502 }
      );
    }

    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    let parsedResult: {
      proposedConfig?: unknown;
      modifiedFields?: string[];
      explanation?: string;
      clarifications?: string[];
    };
    try {
      parsedResult = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json(
        { success: false, error: "Gemini returned invalid or unparseable JSON format." },
        { status: 502 }
      );
    }

    if (!parsedResult.proposedConfig || typeof parsedResult.proposedConfig !== "object") {
      return NextResponse.json(
        { success: false, error: "Gemini response missing 'proposedConfig' object." },
        { status: 502 }
      );
    }

    const validatedProposed = AgentConfigSchema.safeParse(parsedResult.proposedConfig);
    if (!validatedProposed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Generated refinement produced an invalid configuration schema.",
          details: validatedProposed.error.issues,
        },
        { status: 422 }
      );
    }

    // Compute actual modified fields
    const actualModifiedFields: (keyof AgentConfig)[] = [];
    const keys = Object.keys(validatedProposed.data) as (keyof AgentConfig)[];
    for (const k of keys) {
      const origVal = JSON.stringify(currentConfig[k]);
      const newVal = JSON.stringify(validatedProposed.data[k]);
      if (origVal !== newVal) {
        actualModifiedFields.push(k);
      }
    }

    return NextResponse.json({
      success: true,
      proposedConfig: validatedProposed.data,
      modifiedFields: actualModifiedFields.length > 0 ? actualModifiedFields : (parsedResult.modifiedFields || []),
      explanation: parsedResult.explanation || "Agent configuration updated via Gemini AI.",
      clarifications: parsedResult.clarifications || [],
      source: "gemini-api",
    });
  } catch (err: unknown) {
    console.error("[POST /api/refine-agent] Uncaught error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred while refining agent.",
      },
      { status: 500 }
    );
  }
}
