import { Sparkles, Shield, Zap, Smartphone } from "lucide-react";

export default function FeatureCards() {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      title: "Tanpa Watermark",
      description: "Hasil unduhan video bersih tanpa watermark mengganggu, ideal untuk edit ulang atau disimpan ke arsip galeri.",
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      title: "Direct Download Cepat",
      description: "File langsung tersimpan ke memori perangkat tanpa mental ke tab kosong berulang-ulang.",
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-400" />,
      title: "100% Gratis & Aman",
      description: "Tidak perlu login akun sosmed, tidak perlu bayar, dan tanpa batasan jumlah unduhan harian.",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-purple-400" />,
      title: "Semua Perangkat",
      description: "Kompatibel sempurna di Android, iPhone (iOS), iPad, laptop Windows, MacBook, maupun Linux.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto my-12 px-4">
      {features.map((feature, idx) => (
        <div
          key={idx}
          className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70 transition-all flex flex-col items-start gap-3 shadow-sm"
        >
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner">
            {feature.icon}
          </div>
          <h3 className="text-sm font-bold text-white tracking-tight">{feature.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
