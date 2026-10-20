import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Shorts & Video Downloader MP4/MP3 - VidLoot",
  description:
    "Unduh video YouTube Shorts dan klip video online dalam format MP4 HD atau ekstrak audio MP3 secara gratis.",
  keywords: [
    "youtube shorts downloader",
    "download youtube mp4",
    "unduh youtube mp3",
    "y2mate",
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
          subtitleOverride="Simpan video YouTube Shorts dan format audio MP3 berkualitas jernih langsung ke perangkatmu."
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
