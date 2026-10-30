import { NextRequest, NextResponse } from "next/server";
import { defaultElevenLabsService } from "@/lib/services/elevenlabs-service";

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
      return NextResponse.json(
        { error: "Conversation ID is required", success: false },
        { status: 400 }
      );
    }

    const detail = await defaultElevenLabsService.getConversation(id);
    return NextResponse.json({
      conversation: detail,
      success: true,
    });
  } catch (err: unknown) {
    console.error("[GET /api/elevenlabs/conversations/[id]] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch conversation details";
    const status = message.includes("ELEVENLABS_API_KEY is not configured") ? 401 : 500;
    return NextResponse.json({ error: message, success: false }, { status });
  }
}
