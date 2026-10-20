import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instagram Reels & Video Downloader HD - VidLoot",
  description:
    "Fast and easy way to download Instagram Reels, IG videos, and Stories online for free. Save high-resolution Instagram MP4 videos directly to your gallery.",
  keywords: [
    "instagram reels downloader",
    "download ig video",
    "save instagram reels",
    "instagram story downloader",
    "ig video download",
  ],
};

export default function InstagramDownloaderPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl pt-4">
        <AdBanner slot="top" />
      </div>

      <section className="w-full py-8 sm:py-12">
        <DownloaderForm
          initialPlatform="instagram"
          titleOverride="Instagram Reels & Video Downloader"
          subtitleOverride="Download Instagram Reels, feed videos, and IG clips in high-definition quality without account login."
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
