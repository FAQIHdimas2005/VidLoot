import DownloaderForm from "@/components/DownloaderForm";
import AdBanner from "@/components/AdBanner";
import FeatureCards from "@/components/FeatureCards";
import FaqSection from "@/components/FaqSection";
import { Copy, Link as LinkIcon, Download, Check } from "lucide-react";

export default function Home() {
  const steps = [
    {
      num: "1",
      icon: <Copy className="w-5 h-5 text-blue-400" />,
      title: "Salin Link Video",
      desc: "Buka TikTok, Instagram, Twitter/X, FB, atau YouTube, lalu salin URL tautan postingan videonya.",
    },
    {
      num: "2",
      icon: <LinkIcon className="w-5 h-5 text-indigo-400" />,
      title: "Tempel di UnduhCepat",
      desc: "Paste link tersebut ke kolom formulir di atas, lalu tekan tombol 'Download'.",
    },
    {
      num: "3",
      icon: <Download className="w-5 h-5 text-emerald-400" />,
      title: "Simpan File Video / MP3",
      desc: "Pilih kualitas MP4 (Full HD/HD) atau format audio MP3. Video otomatis tersimpan di galeri/folder unduhan.",
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
            Cara Download Video Semua Sosmed Tanpa Watermark
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-lg mx-auto">
            Hanya butuh 3 langkah singkat kurang dari 5 detik untuk menyimpan konten favoritmu.
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
