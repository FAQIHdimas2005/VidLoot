import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facebook Video & Reels Downloader - UnduhCepat",
  description:
    "Download video Facebook publik, FB Watch, dan Facebook Reels dalam kualitas Full HD / SD secara gratis dan cepat.",
  keywords: [
    "facebook video downloader",
    "download video fb",
    "unduh video facebook",
    "fb reels downloader",
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
          subtitleOverride="Unduh video Facebook Watch, video beranda publik, dan FB Reels dengan kualitas video terbaik."
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
