import { NextResponse } from "next/server";


export async function GET() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  const elevenlabsConfigured = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim().length > 0);

  return NextResponse.json({
    geminiConfigured,
    elevenlabsConfigured,
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });
}
