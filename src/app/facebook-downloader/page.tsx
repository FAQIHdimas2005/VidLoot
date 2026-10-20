import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facebook Video & Reels Downloader HD - VidLoot",
  description:
    "Download Facebook public videos, FB Watch, and Facebook Reels in Full HD / SD quality for free without installing apps.",
  keywords: [
    "facebook video downloader",
    "download video fb",
    "fb reels downloader",
    "facebook watch download",
    "fdown",
  ],
};

export default function FacebookDownloaderPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl pt-4">
        <AdBanner slot="top" />
      </div>

      <section className="w-full py-8 sm:py-12">
        <DownloaderForm
          initialPlatform="facebook"
          titleOverride="Facebook Video & Reels Downloader"
          subtitleOverride="Download Facebook Watch videos, public feed clips, and FB Reels in optimal resolution."
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
