import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "X & Twitter Video Downloader MP4 HD - VidLoot",
  description:
    "Download videos and GIF animations from X (formerly Twitter) in Full HD 1080p, 720p, and MP3 audio instantly for free.",
  keywords: [
    "twitter video downloader",
    "download video x",
    "x video downloader",
    "save twitter video mp4",
    "twitter gif download",
  ],
};

export default function XDownloaderPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl pt-4">
        <AdBanner slot="top" />
      </div>

      <section className="w-full py-8 sm:py-12">
        <DownloaderForm
          initialPlatform="twitter"
          titleOverride="X / Twitter Video Downloader"
          subtitleOverride="Save video tweets and animated GIFs from X (Twitter) in crystal-clear MP4 format in seconds."
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
