import type { Metadata } from "next";
import "./globals.css";
import { AuthGate } from "@/components/auth/auth-gate";
import { VoiceSessionProvider } from "@/app/sandbox/voice-session-context";

export const metadata: Metadata = {
  title: "North Vector",
  description: "Personal Chief of Staff Operating System.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {/* Mounted once here, not inside app/sandbox/page.tsx, so the voice
            session (mic capture, STT socket, TTS playback, wake-word
            listening) survives navigating to any other page instead of
            being torn down and restarted every time /sandbox unmounts —
            see voice-session-context.tsx's module comment. */}
        <AuthGate>
          <VoiceSessionProvider>{children}</VoiceSessionProvider>
        </AuthGate>
      </body>
    </html>
  );
}
