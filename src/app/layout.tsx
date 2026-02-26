import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MouseTrail from "@/components/MouseTrail";
import RippleEffect from "@/components/RippleEffect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kenneth Kwok | AI Application Engineer",
  description:
    "Portfolio of Kenneth Kwok - AI Application Engineer specializing in LLM Integration & Rapid Prototyping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#050510] text-white antialiased`}
      >
        <MouseTrail />
        <RippleEffect />
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 h-[800px] w-[800px] rounded-full bg-cyan-500/5 blur-[120px]" />
          <div className="absolute -bottom-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-purple-500/5 blur-[120px]" />
          <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-400/3 blur-[80px]" />
        </div>
        {children}
      </body>
    </html>
  );
}
