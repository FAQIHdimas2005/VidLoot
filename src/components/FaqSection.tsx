"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "How do I download videos using VidLoot?",
    a: "It takes just 3 simple steps: 1) Copy the video link from TikTok, Instagram, X (Twitter), Facebook, or YouTube. 2) Paste the link into the search box above. 3) Click 'Download'. Choose your preferred resolution (MP4 Full HD) or audio format (MP3), and the file will save directly to your device.",
  },
  {
    q: "Are TikTok videos downloaded without watermarks?",
    a: "Yes! VidLoot automatically detects and extracts original, clean video streams without the TikTok watermark or author logo.",
  },
  {
    q: "Where are downloaded files saved on my device?",
    a: "Files are automatically saved into your browser's default 'Downloads' folder. On iPhone and Android mobile devices, the video will appear in your Photos/Gallery or Files app.",
  },
  {
    q: "Is VidLoot completely free to use?",
    a: "Yes, VidLoot is 100% free with no hidden charges, trial periods, or credit card requirements. You can download as many videos as you like.",
  },
  {
    q: "Does VidLoot store or host copies of downloaded videos?",
    a: "No. VidLoot never stores, hosts, or archives any video or audio files on our servers. All media is streamed live and directly from official public content delivery networks (CDNs).",
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="max-w-3xl mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Frequently Asked Questions (FAQ)
        </h2>
        <p className="text-xs text-slate-400 mt-2">
          Everything you need to know about using VidLoot safely and easily.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="border border-slate-800 bg-slate-900/40 rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-slate-200 hover:text-white transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                    isOpen ? "rotate-180 text-blue-400" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
