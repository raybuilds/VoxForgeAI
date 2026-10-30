import { NextResponse } from "next/server";
import { defaultElevenLabsService } from "@/lib/services/elevenlabs-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const voices = await defaultElevenLabsService.listVoices();
    return NextResponse.json({ voices, success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch voices";
    const status = message.includes("ELEVENLABS_API_KEY is not configured") ? 401 : 500;
    return NextResponse.json({ error: message, success: false }, { status });
  }
}
