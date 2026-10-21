"use client";

import React, { useState, useEffect } from "react";
import {
  Clipboard,
  X,
  Loader2,
  Download,
  Music,
  Video,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PlatformType, VideoExtractionResult } from "@/lib/types";
import { detectPlatform } from "@/lib/platform";

interface DownloaderFormProps {
  initialPlatform?: PlatformType;
  titleOverride?: string;
  subtitleOverride?: string;
}

export default function DownloaderForm({
  initialPlatform,
  titleOverride,
  subtitleOverride,
}: DownloaderFormProps) {
  const [url, setUrl] = useState("");
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformType>(
    initialPlatform || "unknown"
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<VideoExtractionResult | null>(null);
  const [thumbError, setThumbError] = useState(false);

  // Rewarded Countdown Ad Modal states
  const [showAdModal, setShowAdModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [extractionDone, setExtractionDone] = useState(false);
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [pendingResult, setPendingResult] = useState<VideoExtractionResult | null>(null);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAdModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [showAdModal, countdown]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setErrorMsg(null);
    if (!value.trim()) {
      setDetectedPlatform(initialPlatform || "unknown");
      return;
    }
    const detected = detectPlatform(value);
    setDetectedPlatform(detected);
  };

  const handlePaste = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleUrlChange(text);
          return;
        }
      }
    } catch {
      // Fallback for permissions
    }
    const manualText = prompt("Paste your video link here:");
    if (manualText) {
      handleUrlChange(manualText);
    }
  };

  const handleClear = () => {
    setUrl("");
    setDetectedPlatform(initialPlatform || "unknown");
    setErrorMsg(null);
    setResult(null);
    setThumbError(false);
    setShowAdModal(false);
    setPendingResult(null);
    setExtractionDone(false);
    setExtractionFailed(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setErrorMsg("Please paste a valid video URL first.");
      return;
    }

    // Reset states and immediately open Rewarded Ad Modal
    setErrorMsg(null);
    setResult(null);
    setPendingResult(null);
    setCountdown(5);
    setExtractionDone(false);
    setExtractionFailed(false);
    setShowAdModal(true);
    setIsExtracting(true);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: trimmed }),
      });

      const data: VideoExtractionResult = await res.json();

      if (!res.ok || !data.success) {
        setExtractionFailed(true);
        setErrorMsg(
          data.error ||
            "Unable to retrieve video. Please verify the link is public and accessible."
        );
      } else {
        setPendingResult(data);
        setExtractionDone(true);
      }
    } catch {
      setExtractionFailed(true);
      setErrorMsg("Network connection error. Please verify your connection and try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleClaimDownload = () => {
    // Open Monetag / Adsterra SmartLink if configured in env
    if (typeof window !== "undefined") {
      const smartLink = process.env.NEXT_PUBLIC_MONETAG_DIRECT_LINK;
      if (smartLink) {
        window.open(smartLink, "_blank", "noopener,noreferrer");
      }
    }

    if (pendingResult) {
      setResult(pendingResult);
      setThumbError(false);
      setShowAdModal(false);
      setPendingResult(null);
      // Smooth scroll to results
      setTimeout(() => {
        const el = document.getElementById("results-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const getPlatformBadge = (platform: PlatformType) => {
    switch (platform) {
      case "tiktok":
        return { label: "TikTok", color: "bg-black text-cyan-400 border-cyan-500/40" };
      case "instagram":
        return {
          label: "Instagram",
          color: "bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-500/30",
        };
      case "twitter":
        return { label: "X / Twitter", color: "bg-slate-900 text-cyan-300 border-slate-700" };
      case "facebook":
        return { label: "Facebook", color: "bg-blue-600 text-white border-blue-400/30" };
      case "youtube":
        return { label: "YouTube", color: "bg-red-600 text-white border-red-400/30" };
      default:
        return { label: "All-in-One", color: "bg-slate-800 text-slate-300 border-slate-700" };
    }
  };

  const badge = getPlatformBadge(detectedPlatform);

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Title & Subtitle */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          Universal Social Media Video Downloader
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          {titleOverride || "Download Social Media Videos & Audio"}
          <span className="block mt-1 bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            No Watermark, 100% Free & Fast
          </span>
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          {subtitleOverride ||
            "Paste any public link from TikTok, Instagram Reels, Twitter/X, Facebook, or YouTube to download clean Full HD MP4 video or MP3 audio."}
        </p>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center bg-slate-900/95 border-2 border-slate-700/80 hover:border-slate-600 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 rounded-2xl p-2 sm:p-2.5 shadow-2xl transition-all">
          {/* Platform Badge */}
          <div
            className={`hidden sm:inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border ${badge.color} mr-2 transition-all`}
          >
            {badge.label}
          </div>

          {/* Input Element */}
          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste video link here (TikTok, IG, X, FB, YouTube)..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 px-3 py-2 outline-none"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {url ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            )}

            <button
              type="submit"
              disabled={!url.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </form>

      {/* Error alert on page */}
      {errorMsg && !showAdModal && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/50 border border-red-800/80 flex items-start gap-3 text-red-300 text-xs sm:text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-red-200 mb-0.5">Extraction Notice</span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* REWARDED COUNTDOWN AD MODAL */}
      {showAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
            {/* Header Icon */}
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 animate-pulse text-yellow-400" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Preparing High-Speed Download
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Please wait while our servers fetch and process your video in maximum quality.
            </p>

            {/* AD BANNER SLOT (300x250) */}
            <div className="w-full my-4 p-4 rounded-2xl bg-slate-950/90 border border-dashed border-slate-700 flex flex-col items-center justify-center min-h-[250px] relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
                Sponsored Advertisement
              </span>
              <div className="text-xs text-slate-400 text-center max-w-xs px-2">
                Your ad banner (Adsterra / Monetag / A-Ads 300x250) will display here and monetize every single download request.
              </div>
            </div>

            {/* Status & Countdown Bar */}
            <div className="w-full space-y-3">
              {countdown > 0 ? (
                <div className="w-full py-3.5 px-4 rounded-xl bg-slate-800 text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-slate-700">
                  <Clock className="w-4 h-4 text-blue-400 animate-spin" />
                  <span>Your download unlocks in {countdown} seconds...</span>
                </div>
              ) : isExtracting ? (
                <div className="w-full py-3.5 px-4 rounded-xl bg-slate-800 text-slate-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-slate-700">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span>Finalizing video stream...</span>
                </div>
              ) : extractionFailed ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300">
                    {errorMsg || "Unable to extract video. Please check the URL and try again."}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdModal(false)}
                    className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                  >
                    Close & Try Again
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleClaimDownload}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>Get Your Download Link</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RESULTS CARD (UNLOCKED) */}
      {result && result.success && (
        <div
          id="results-section"
          className="mt-8 p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Thumbnail Preview */}
            <div className="relative w-full md:w-56 h-40 sm:h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 group">
              {result.thumbnail && !thumbError ? (
                <img
                  src={
                    result.platform === "instagram"
                      ? `/api/download-proxy?url=${encodeURIComponent(result.thumbnail)}`
                      : result.thumbnail
                  }
                  alt={result.title || "Video Preview"}
                  referrerPolicy="no-referrer"
                  onError={() => setThumbError(true)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 text-slate-400 p-4 text-center">
                  <Video className="w-8 h-8 text-blue-400/80 mb-2" />
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    {result.platform} Preview
                  </span>
                </div>
              )}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-sm text-white">
                {result.platform}
              </div>
              {result.duration && (
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 backdrop-blur-sm text-white">
                  {result.duration}
                </div>
              )}
            </div>

            {/* Video Details & Download Buttons */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Ready to Download
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white line-clamp-2">
                {result.title || "Video Successfully Extracted"}
              </h2>

              {result.author && (
                <p className="text-xs text-slate-400">
                  Creator: <span className="text-slate-200 font-medium">{result.author}</span>
                </p>
              )}

              {/* Download Buttons List */}
              <div className="pt-2 space-y-2">
                {result.medias.map((media, idx) => {
                  const rawClean = (result.title || `VidLoot_${result.platform}`)
                    .replace(/[/\\?%*:|"<>]/g, '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .replace(/^\.+|\.+$/g, '')
                    .trim()
                    .slice(0, 100);

                  const validTitle =
                    rawClean && /[a-zA-Z0-9]/.test(rawClean)
                      ? rawClean
                      : `VidLoot_${result.platform}_${Date.now().toString().slice(-4)}`;

                  const filename = `${validTitle}.${media.format}`;

                  const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(
                    media.url
                  )}&origUrl=${encodeURIComponent(url)}&platform=${encodeURIComponent(
                    result.platform
                  )}&quality=${encodeURIComponent(
                    media.quality || 'default'
                  )}&filename=${encodeURIComponent(filename)}`;

                  const isAudio = media.format === "mp3" || media.quality === "mp3";

                  return (
                    <a
                      key={idx}
                      href={proxyUrl}
                      download={filename}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md group ${
                        idx === 0
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20"
                          : isAudio
                          ? "bg-purple-900/40 border border-purple-700/60 text-purple-200 hover:bg-purple-900/60"
                          : "bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-750 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isAudio ? (
                          <Music className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        ) : (
                          <Video className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        )}
                        <span>{media.label || `Download ${media.quality}`}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-normal opacity-80">
                        {media.size && <span>{media.size}</span>}
                        <Download className="w-4 h-4" />
                      </div>
                    </a>
                  );
                })}
              </div>

              {/* Reset / Download another button */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Download another video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
