import { NextRequest, NextResponse } from "next/server";
import { defaultElevenLabsService } from "@/lib/services/elevenlabs-service";
import { AgentConfigSchema } from "@/types";

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body", success: false },
        { status: 400 }
      );
    }

    const validation = AgentConfigSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid agent configuration";
      return NextResponse.json(
        { error: firstError, details: validation.error.issues, success: false },
        { status: 422 }
      );
    }

    const result = await defaultElevenLabsService.createAgent(validation.data);
    return NextResponse.json({
      agent_id: result.agent_id,
      success: true,
    });
  } catch (err: unknown) {
    console.error("[POST /api/elevenlabs/agents] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status = message.includes("ELEVENLABS_API_KEY is not configured") ? 401 : 500;
    return NextResponse.json({ error: message, success: false }, { status });
  }
}
