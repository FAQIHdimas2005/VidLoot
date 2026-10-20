import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TikTok Video Downloader Without Watermark HD - VidLoot",
  description:
    "Download TikTok videos without watermark and convert TikTok audio to high-quality MP3 online for free on any device.",
  keywords: [
    "tiktok downloader",
    "download tiktok without watermark",
    "snaptik",
    "ssstik",
    "tiktok mp3 sound download",
  ],
};

export default function TikTokDownloaderPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl pt-4">
        <AdBanner slot="top" />
      </div>

      <section className="w-full py-8 sm:py-12">
        <DownloaderForm
          initialPlatform="tiktok"
          titleOverride="TikTok Video Downloader"
          subtitleOverride="Download TikTok videos without watermarks and extract TikTok audio sounds in crisp MP3 format for free."
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
