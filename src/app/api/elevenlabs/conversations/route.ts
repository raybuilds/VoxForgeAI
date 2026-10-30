import { NextRequest, NextResponse } from "next/server";
import { defaultElevenLabsService } from "@/lib/services/elevenlabs-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agent_id") || undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const pageSizeStr = searchParams.get("page_size");
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : undefined;

    const data = await defaultElevenLabsService.listConversations({
      agentId,
      cursor,
      pageSize,
    });

    return NextResponse.json({
      ...data,
      success: true,
    });
  } catch (err: unknown) {
    console.error("[GET /api/elevenlabs/conversations] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch conversations";
    const status = message.includes("ELEVENLABS_API_KEY is not configured") ? 401 : 500;
    return NextResponse.json({ error: message, success: false }, { status });
  }
}
