import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AgentConfigSchema } from "@/types";
import { defaultAgentRefinementService } from "@/lib/services/agent-refinement-service";

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

    const result = await defaultAgentRefinementService.refineAgent({
      currentConfig,
      instruction,
      conversationHistory,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to refine agent",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      proposedConfig: result.proposedConfig,
      modifiedFields: result.modifiedFields,
      explanation: result.explanation,
      clarifications: result.clarifications,
      source: result.source,
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
