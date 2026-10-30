import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoxForge AI — No-Code Voice Agent Builder",
  description: "Prompt-to-agent Voice AI studio powered by ElevenLabs architecture.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-page text-text-primary selection:bg-aqua/20 selection:text-aqua">
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}
