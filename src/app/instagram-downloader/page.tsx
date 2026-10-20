import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instagram Reels & Video Downloader HD - UnduhCepat",
  description:
    "Cara mudah download Reels Instagram, IG Video, dan Story online gratis tanpa aplikasi. Simpan video IG kualitas tinggi langsung ke galeri HP.",
  keywords: [
    "instagram reels downloader",
    "download video ig",
    "unduh reels instagram",
    "save ig story",
    "ig downloader",
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
          subtitleOverride="Unduh Reels Instagram, Story, dan postingan video feed dalam kualitas HD jernih tanpa perlu login akun."
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
