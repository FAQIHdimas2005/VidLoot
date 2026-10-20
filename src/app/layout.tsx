import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "VidLoot - Universal Social Media Video Downloader (TikTok, IG, X, FB, YT)",
  description:
    "Download video TikTok tanpa watermark, Instagram Reels, X/Twitter video, Facebook video, dan YouTube Shorts gratis dalam format MP4 Full HD dan MP3.",
  keywords: [
    "vidloot",
    "download video tiktok tanpa watermark",
    "unduh reels instagram",
    "download twitter video",
    "facebook video downloader",
    "youtube shorts download mp4",
    "snaptik",
    "ssstiktok",
    "savefrom",
  ],
  authors: [{ name: "VidLoot Team" }],
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
