import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nico Nico Douga Video Downloader (MP4 1080p/720p & MP3) - VidLoot",
  description:
    "Free online Nico Nico Douga (Niconico - ニコニコ動画) video downloader. Convert and download high-quality MP4 videos and MP3 audio from Niconico without software or account login.",
  keywords: [
    "niconico downloader",
    "nico nico douga downloader",
    "download niconico video mp4",
    "niconico to mp3",
    "niconico video saver",
    "nicovideo download online",
    "sm video downloader",
    "niconico douga converter",
  ],
  openGraph: {
    title: "Nico Nico Douga Video Downloader (HD MP4 & MP3) - VidLoot",
    description: "Download high-quality MP4 videos and MP3 audio from Nico Nico Douga for free.",
    url: "https://vid-loot.vercel.app/niconico-downloader",
  },
};

export default function NicoNicoDownloaderPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl pt-4">
        <AdBanner slot="top" />
      </div>

      <section className="w-full py-8 sm:py-12">
        <DownloaderForm
          initialPlatform="niconico"
          titleOverride="Nico Nico Douga Video Downloader"
          subtitleOverride="Download high-quality MP4 videos (1080p/720p/360p) and MP3 music from Nico Nico Douga (nicovideo.jp) quickly and safely."
        />
      </section>

      <div className="w-full max-w-4xl py-2">
        <AdBanner slot="results" />
      </div>

      <FeatureCards />
      <FaqSection />

      <div className="w-full max-w-4xl pb-8">
        <AdBanner slot="bottom" />
      </div>
    </div>
  );
}
