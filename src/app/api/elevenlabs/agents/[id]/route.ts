import { NextRequest, NextResponse } from "next/server";
import { defaultElevenLabsService } from "@/lib/services/elevenlabs-service";
import { AgentConfigSchema } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Agent ID is required", success: false }, { status: 400 });
    }

    const data = await defaultElevenLabsService.getAgent(id);
    return NextResponse.json({ agent: data, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch agent";
    const status = message.includes("ELEVENLABS_API_KEY is not configured") ? 401 : 500;
    return NextResponse.json({ error: message, success: false }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Agent ID is required", success: false }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body", success: false },
        { status: 400 }
      );
    }

    // Partial validation
    const partialSchema = AgentConfigSchema.partial();
    const validation = partialSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid update configuration";
      return NextResponse.json(
        { error: firstError, details: validation.error.issues, success: false },
        { status: 422 }
      );
    }

    const updated = await defaultElevenLabsService.updateAgent(id, validation.data);
    return NextResponse.json({ agent: updated, success: true });
  } catch (err: unknown) {
    console.error(`[PATCH /api/elevenlabs/agents] Error:`, err);
    const message = err instanceof Error ? err.message : "Failed to update agent";
    const status = message.includes("ELEVENLABS_API_KEY is not configured") ? 401 : 500;
    return NextResponse.json({ error: message, success: false }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Agent ID is required", success: false }, { status: 400 });
    }

    await defaultElevenLabsService.deleteAgent(id);
    return NextResponse.json({ success: true, message: `Agent ${id} deleted successfully.` });
  } catch (err: unknown) {
    console.error(`[DELETE /api/elevenlabs/agents] Error:`, err);
    const message = err instanceof Error ? err.message : "Failed to delete agent";
    const status = message.includes("ELEVENLABS_API_KEY is not configured") ? 401 : 500;
    return NextResponse.json({ error: message, success: false }, { status });
  }
}
