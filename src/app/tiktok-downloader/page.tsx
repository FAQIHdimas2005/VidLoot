import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TikTok Downloader Tanpa Watermark HD - UnduhCepat",
  description:
    "Download video TikTok tanpa watermark dan konversi audio TikTok MP3 kualitas jernih secara gratis dan cepat di semua perangkat.",
  keywords: [
    "tiktok downloader",
    "download video tiktok no watermark",
    "snaptik",
    "ssstiktok",
    "unduh audio tiktok mp3",
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
          subtitleOverride="Unduh video TikTok tanpa watermark dan audio sound TikTok MP3 dalam resolusi Full HD secara gratis."
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
