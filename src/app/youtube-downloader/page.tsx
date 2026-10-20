import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Shorts & Video Downloader MP4/MP3 - VidLoot",
  description:
    "Download YouTube Shorts and videos online in HD MP4 format or convert to clean MP3 audio tracks for free.",
  keywords: [
    "youtube shorts downloader",
    "download youtube mp4",
    "convert youtube mp3",
    "y2mate alternative",
    "yt shorts downloader",
  ],
};

export default function YouTubeDownloaderPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl pt-4">
        <AdBanner slot="top" />
      </div>

      <section className="w-full py-8 sm:py-12">
        <DownloaderForm
          initialPlatform="youtube"
          titleOverride="YouTube Shorts & Video Downloader"
          subtitleOverride="Save YouTube Shorts videos in MP4 format or extract high-fidelity MP3 music tracks straight to your device."
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
