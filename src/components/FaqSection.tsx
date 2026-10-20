"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "Bagaimana cara download video dari media sosial menggunakan VidLoot?",
    a: "Caranya sangat mudah: 1) Salin (copy) link video dari aplikasi TikTok, Instagram, X/Twitter, Facebook, atau YouTube. 2) Tempel (paste) link ke kolom input di atas. 3) Klik tombol 'Download'. 4) Pilih kualitas video (MP4 HD) atau audio (MP3) yang kamu inginkan, dan file akan otomatis tersimpan ke perangkatmu.",
  },
  {
    q: "Apakah video TikTok yang diunduh benar-benar bebas watermark?",
    a: "Ya, sistem kami secara otomatis menyaring dan mengambil video versi orisinal berkualitas tertinggi tanpa watermark logo TikTok.",
  },
  {
    q: "Di mana file video tersimpan setelah saya klik tombol download?",
    a: "File unduhan akan langsung masuk ke folder 'Downloads' atau 'Unduhan' di browser perangkatmu. Di ponsel Android/iPhone, video akan otomatis muncul di galeri atau aplikasi Files.",
  },
  {
    q: "Apakah layanan ini dipungut biaya atau memerlukan registrasi?",
    a: "Layanan ini 100% gratis selamanya tanpa perlu mendaftar akun atau memasukkan informasi kartu kredit apa pun.",
  },
  {
    q: "Apakah VidLoot menyimpan salinan video yang saya unduh?",
    a: "Tidak. Kami tidak menyimpan atau mengarsipkan video di server kami. Seluruh proses pengambilan data dilakukan secara langsung (live stream) dari server penyedia konten publik.",
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
          Pertanyaan yang Sering Diajukan (FAQ)
        </h2>
        <p className="text-xs text-slate-400 mt-2">
          Semua yang perlu kamu ketahui tentang cara kerja dan keamanan VidLoot.
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
