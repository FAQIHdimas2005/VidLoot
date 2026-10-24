"use client";

import Link from "next/link";
import { useState } from "react";
import { DownloadCloud, Menu, X, Sparkles, Coffee } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/tiktok-downloader", label: "TikTok" },
    { href: "/instagram-downloader", label: "Instagram" },
    { href: "/x-downloader", label: "X / Twitter" },
    { href: "/facebook-downloader", label: "Facebook" },
    { href: "/youtube-downloader", label: "YouTube" },
    { href: "/deviantart-downloader", label: "DeviantArt" },
    { href: "/niconico-downloader", label: "NicoNico" },
  ];

  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Vid<span className="text-blue-500">Loot</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                Universal Downloader
                <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Ko-fi Support Button */}
            <a
              href="https://ko-fi.com/teamvidloot"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 transition-all shadow-md shadow-amber-500/15 hover:shadow-amber-500/30 active:scale-95"
              title="Support VidLoot on Ko-fi"
            >
              <Coffee className="w-3.5 h-3.5 text-slate-950" />
              <span>Support</span>
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-300 hover:text-white hover:bg-slate-850"
            >
              {link.label} Downloader
            </Link>
          ))}
          <a
            href="https://ko-fi.com/teamvidloot"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 mt-3 shadow-md shadow-amber-500/15"
          >
            <Coffee className="w-4 h-4 text-slate-950" />
            <span>Support VidLoot on Ko-fi</span>
          </a>
        </div>
      )}
    </nav>
  );
}
