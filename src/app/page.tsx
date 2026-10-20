import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import { Copy, Link as LinkIcon, Download } from "lucide-react";

export default function Home() {
  const steps = [
    {
      num: "1",
      icon: <Copy className="w-5 h-5 text-blue-400" />,
      title: "Copy Video Link",
      desc: "Open TikTok, Instagram, Twitter/X, Facebook, or YouTube, and copy the URL link of the video post.",
    },
    {
      num: "2",
      icon: <LinkIcon className="w-5 h-5 text-indigo-400" />,
      title: "Paste into VidLoot",
      desc: "Paste the copied URL into the search box above, then click the 'Download' button.",
    },
    {
      num: "3",
      icon: <Download className="w-5 h-5 text-emerald-400" />,
      title: "Save Video or Audio",
      desc: "Choose between Full HD/SD MP4 video or MP3 audio. The file will save directly to your storage.",
    },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top Banner Ad Slot */}
      <div className="w-full max-w-4xl pt-4">
        <AdBanner slot="top" />
      </div>

      {/* Main Hero & Input Section */}
      <section className="w-full py-8 sm:py-12">
        <DownloaderForm />
      </section>

      {/* Results / Mid Page Ad Slot */}
      <div className="w-full max-w-4xl py-2">
        <AdBanner slot="results" />
      </div>

      {/* Features Overview */}
      <section className="w-full">
        <FeatureCards />
      </section>

      {/* Step-by-Step SEO Guide */}
      <section className="w-full max-w-4xl px-4 my-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            How to Download Social Media Videos Without Watermark
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto">
            It takes just 3 simple steps in less than 5 seconds to download your favorite media clips.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-left">
            {steps.map((st, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-3 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    {st.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-700">0{st.num}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{st.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection />

      {/* Bottom Banner Ad Slot */}
      <div className="w-full max-w-4xl pb-8">
        <AdBanner slot="bottom" />
      </div>
    </div>
  );
}
