import Link from "next/link";
import { ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-950 mt-16 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-white font-bold text-lg tracking-tight">
              Vid<span className="text-blue-500">Loot</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Layanan online gratis untuk mengunduh video dan audio dari berbagai platform media sosial tanpa watermark. Cepat, aman, dan tanpa perlu instalasi aplikasi tambahan.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Aman & Tanpa Penyimpanan Data Pribadi</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm">Downloaders</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/tiktok-downloader" className="hover:text-white transition-colors">
                  TikTok Downloader
                </Link>
              </li>
              <li>
                <Link href="/instagram-downloader" className="hover:text-white transition-colors">
                  Instagram Downloader
                </Link>
              </li>
              <li>
                <Link href="/x-downloader" className="hover:text-white transition-colors">
                  X / Twitter Downloader
                </Link>
              </li>
              <li>
                <Link href="/facebook-downloader" className="hover:text-white transition-colors">
                  Facebook Downloader
                </Link>
              </li>
              <li>
                <Link href="/youtube-downloader" className="hover:text-white transition-colors">
                  YouTube Downloader
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Policy */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm">Legalitas & Privasi</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/dmca" className="hover:text-white transition-colors">
                  DMCA / Disclaimer Hak Cipta
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Kebijakan Privasi (Privacy Policy)
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-white transition-colors">
                  Syarat & Ketentuan (Terms of Service)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Warning */}
        <div className="border-t border-slate-900 pt-6 text-[11px] text-slate-400 leading-relaxed space-y-2">
          <p>
            <strong>Disclaimer:</strong> VidLoot tidak berafiliasi dengan TikTok, ByteDance, Instagram, Meta, Twitter/X, atau YouTube. Seluruh merek dagang dan hak cipta materi video adalah milik dari pemilik akun/pencipta konten masing-masing. Layanan ini murni alat teknis untuk membantu pengguna mencadangkan konten publik yang diizinkan untuk penggunaan pribadi. Kami tidak meng-hosting atau menyimpan video apa pun di server kami.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-900/60">
            <span>© {new Date().getFullYear()} VidLoot. Seluruh hak cipta dilindungi.</span>
            <span className="flex items-center gap-1 text-slate-400">
              Dibuat dengan <Heart className="w-3 h-3 text-red-500 fill-red-500" /> untuk kemudahan berbagi
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
