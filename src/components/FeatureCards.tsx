import { Sparkles, Shield, Zap, Smartphone } from "lucide-react";

export default function FeatureCards() {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-yellow-400" />,
      title: "No Watermark",
      description: "Get clean, watermark-free video downloads from TikTok and Reels, ready for saving, editing, or archiving.",
    },
    {
      icon: <Zap className="w-6 h-6 text-blue-400" />,
      title: "Fast Direct Download",
      description: "Direct file attachment streaming prevents annoying blank tab redirects and saves straight to your storage.",
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-400" />,
      title: "100% Free & Unlimited",
      description: "No account registration or login required. Unlimited daily video extractions with zero subscription fees.",
    },
    {
      icon: <Smartphone className="w-6 h-6 text-purple-400" />,
      title: "All Devices Supported",
      description: "Flawless performance across iOS (iPhone & iPad), Android, Windows PC, Mac, Linux, and all modern browsers.",
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
