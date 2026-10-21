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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<VideoExtractionResult | null>(null);
  const [canPaste, setCanPaste] = useState(false);

  // Rewarded Countdown Ad Modal states
  const [showAdModal, setShowAdModal] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [pendingResult, setPendingResult] = useState<VideoExtractionResult | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && Boolean(navigator.clipboard)) {
      setCanPaste(true);
    }
  }, []);

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
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(text);
      }
    } catch (err) {
      console.warn("Could not read clipboard", err);
    }
  };

  const handleClear = () => {
    setUrl("");
    setDetectedPlatform(initialPlatform || "unknown");
    setErrorMsg(null);
    setResult(null);
    setShowAdModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setErrorMsg("Please paste a valid video URL first.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data: VideoExtractionResult = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error ||
            "Unable to fetch video data. Please verify the link is public and accessible."
        );
      } else {
        // Trigger Rewarded Ad Modal before showing final download options
        setPendingResult(data);
        setCountdown(5);
        setShowAdModal(true);
      }
    } catch (err: any) {
      setErrorMsg("Connection error. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimDownload = () => {
    if (pendingResult) {
      setResult(pendingResult);
      setShowAdModal(false);
      setPendingResult(null);
    }
  };

  const getPlatformBadge = (platform: PlatformType) => {
    switch (platform) {
      case "tiktok":
        return { label: "TikTok", color: "bg-black text-cyan-400 border-cyan-500/30" };
      case "instagram":
        return {
          label: "Instagram",
          color: "bg-gradient-to-r from-pink-600 to-purple-600 text-white",
        };
      case "twitter":
        return { label: "X / Twitter", color: "bg-slate-900 text-white border-slate-700" };
      case "facebook":
        return { label: "Facebook", color: "bg-blue-600 text-white" };
      case "youtube":
        return { label: "YouTube", color: "bg-red-600 text-white" };
      default:
        return { label: "All-in-One", color: "bg-slate-800 text-slate-300" };
    }
  };

  const badge = getPlatformBadge(detectedPlatform);

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Title & Subtitle */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          Universal Social Media Video Downloader
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          {titleOverride || "Download Social Media Videos & Audio"}
          <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            No Watermark, 100% Free & Fast
          </span>
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          {subtitleOverride ||
            "Paste any public link from TikTok, Instagram Reels, Twitter/X, Facebook, or YouTube to download clean Full HD MP4 video or MP3 audio."}
        </p>
      </div>

      {/* Main Input Box */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <div className="relative flex items-center bg-slate-900/90 border-2 border-slate-700/80 rounded-2xl p-2 sm:p-2.5 shadow-2xl focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all">
          {/* Platform Indicator */}
          <div
            className={`hidden sm:inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 border ${badge.color} mr-2`}
          >
            {badge.label}
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste video link here (TikTok, IG, X, FB, YouTube)..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 px-3 py-2 outline-none"
            disabled={isLoading}
          />

          {/* Action buttons (Clear & Paste) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {canPaste && !url && (
              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Paste
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-blue-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Error alert */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-800/80 flex items-start gap-3 text-red-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-red-200">Extraction Error</span>
            {errorMsg}
          </div>
        </div>
      )}

      {/* REWARDED COUNTDOWN AD MODAL */}
      {showAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
            {/* Modal Header */}
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 animate-pulse text-yellow-400" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Generating High-Speed Download Link
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Please wait a few seconds while we prepare your stream in maximum quality.
            </p>

            {/* AD BANNER CONTAINER INSIDE MODAL (300x250) */}
            <div className="w-full my-5 p-4 rounded-2xl bg-slate-950/80 border border-dashed border-slate-700 flex flex-col items-center justify-center min-h-[250px]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2">
                Sponsored Advertisement
              </span>
              <div className="text-xs text-slate-400 text-center max-w-xs">
                Your ad banner (Adsterra / Monetag / A-Ads 300x250) will display here and generate revenue from every active downloader.
              </div>
            </div>

            {/* Countdown / Unlock Button */}
            {countdown > 0 ? (
              <div className="w-full py-3.5 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-slate-700">
                <Clock className="w-4 h-4 text-blue-400 animate-spin" />
                <span>Your link will unlock in {countdown} seconds...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimDownload}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
              >
                <span>Get Your Download Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESULTS CARD (UNLOCKED) */}
      {result && result.success && (
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col md:flex-row gap-5 items-start">
            {/* Thumbnail Preview */}
            {result.thumbnail && (
              <div className="relative w-full md:w-56 h-40 sm:h-48 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 group">
                <img
                  src={result.thumbnail}
                  alt={result.title || "Video Preview"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-sm text-white">
                  {result.platform}
                </div>
                {result.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-sm text-white">
                    {result.duration}
                  </div>
                )}
              </div>
            )}

            {/* Video details & download actions */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Ready to Download
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-white line-clamp-2">
                {result.title || "Video Successfully Extracted"}
              </h2>

              {result.author && (
                <p className="text-xs text-slate-400">
                  Author: <span className="text-slate-200 font-medium">{result.author}</span>
                </p>
              )}

              {/* Download Buttons List */}
              <div className="pt-2 space-y-2">
                {result.medias.map((media, idx) => {
                  const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(
                    media.url
                  )}&filename=${encodeURIComponent(
                    `VidLoot_${result.platform}_${idx + 1}.${media.format}`
                  )}`;

                  const isAudio = media.format === "mp3";

                  return (
                    <a
                      key={idx}
                      href={proxyUrl}
                      download
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

              {/* Reset button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Download another video
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
