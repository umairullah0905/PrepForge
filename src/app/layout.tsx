import type { Metadata } from "next";
import { Bungee, Poppins, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Bungee({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const uiFont = Poppins({
  variable: "--font-ui",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DSA Quests — Slay Data Structures. Conquer Algorithms.",
  description:
    "The AI-powered DSA & System Design platform that teaches you the patterns, not just the answers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${uiFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}