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
              Free, fast, and secure online platform to download high-definition videos and audios from popular social media platforms without watermarks. No installation required.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Free, Secure & No Personal Data Stored</span>
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
            <h4 className="text-white font-semibold text-sm">Legal & Privacy</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/dmca" className="hover:text-white transition-colors">
                  DMCA / Copyright Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Warning */}
        <div className="border-t border-slate-900 pt-6 text-[11px] text-slate-400 leading-relaxed space-y-2">
          <p>
            <strong>Disclaimer:</strong> VidLoot is not affiliated, endorsed, or associated with TikTok, ByteDance, Instagram, Meta, Twitter/X, or YouTube. All trademarks, service marks, and trade names are the property of their respective owners. VidLoot is strictly an online technical utility helping users backup publicly accessible content for personal fair use. We do not host or archive any videos on our servers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-900/60">
            <span>© {new Date().getFullYear()} VidLoot. All rights reserved.</span>
            <span className="flex items-center gap-1 text-slate-400">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for creators worldwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
