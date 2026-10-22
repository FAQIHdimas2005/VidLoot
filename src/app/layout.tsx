import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "VidLoot - Universal Social Media Video Downloader (TikTok, IG, X, FB, YouTube)",
  description:
    "Fast, free online social media video downloader. Download TikTok videos without watermark, Instagram Reels, X/Twitter videos, Facebook clips, and YouTube Shorts in Full HD MP4 & MP3.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  keywords: [
    "vidloot",
    "tiktok downloader without watermark",
    "instagram reels downloader",
    "twitter video downloader",
    "x video downloader",
    "facebook video downloader",
    "youtube shorts download mp4",
    "snaptik alternative",
    "ssstik",
    "savefrom net alternative",
    "free video downloader",
  ],
  authors: [{ name: "VidLoot Global Team" }],
  robots: "index, follow",
  other: {
    monetag: "069c2f1cb6537f23160c0d5a85db8195",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="monetag" content="069c2f1cb6537f23160c0d5a85db8195" />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
