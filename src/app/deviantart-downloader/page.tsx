import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DeviantArt Image & Art Downloader (Original Full Resolution) - VidLoot",
  description:
    "Free online DeviantArt downloader. Download original full-resolution artworks, illustrations, digital paintings, GIF animations, and videos from DeviantArt without account login or restrictions.",
  keywords: [
    "deviantart downloader",
    "download deviantart image full resolution",
    "deviantart image downloader",
    "deviantart art saver",
    "deviantart original quality",
    "download deviantart without login",
    "deviantart wallpaper download",
    "deviantart to jpg png",
  ],
  openGraph: {
    title: "DeviantArt Art & Image Downloader (Original HD/4K) - VidLoot",
    description: "Download original full-resolution artworks and illustrations from DeviantArt for free.",
    url: "https://vid-loot.vercel.app/deviantart-downloader",
  },
};

export default function DeviantArtDownloaderPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-4xl pt-4">
        <AdBanner slot="top" />
      </div>

      <section className="w-full py-8 sm:py-12">
        <DownloaderForm
          initialPlatform="deviantart"
          titleOverride="DeviantArt Video, GIF & Art Downloader"
          subtitleOverride="Save original full-resolution artworks (JPG/PNG), animated GIFs, and HD MP4 videos (1080p/720p) directly from DeviantArt."
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
