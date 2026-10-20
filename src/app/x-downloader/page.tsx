import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "X & Twitter Video Downloader MP4 HD - UnduhCepat",
  description:
    "Unduh video dan GIF dari X (Twitter) kualitas Full HD 1080p, 720p, dan MP3 secara instan dan gratis tanpa aplikasi.",
  keywords: [
    "twitter video downloader",
    "download video x",
    "x video downloader",
    "unduh video twitter mp4",
    "save twitter video",
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
          subtitleOverride="Simpan video tweet dan animasi GIF dari X (Twitter) ke format MP4 jernih dalam hitungan detik."
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
