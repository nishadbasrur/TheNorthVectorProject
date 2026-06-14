import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "North Vector",
  description: "Personal operating system and Chief of Staff platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
