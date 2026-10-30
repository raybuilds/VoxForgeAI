import { NextRequest, NextResponse } from "next/server";
import { defaultElevenLabsService } from "@/lib/services/elevenlabs-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agent_id");

    if (!agentId || !agentId.trim()) {
      return NextResponse.json(
        { error: "agent_id query parameter is required", success: false },
        { status: 400 }
      );
    }

    const result = await defaultElevenLabsService.getSignedUrl(agentId.trim());
    return NextResponse.json({
      signed_url: result.signed_url,
      success: true,
    });
  } catch (err: unknown) {
    console.error("[GET /api/elevenlabs/signed-url] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to generate signed URL";
    const status = message.includes("ELEVENLABS_API_KEY is not configured") ? 401 : 500;
    return NextResponse.json({ error: message, success: false }, { status });
  }
}
