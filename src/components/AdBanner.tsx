"use client";

import React, { useEffect, useRef } from "react";

interface AdBannerProps {
  slot: "top" | "results" | "bottom" | "sidebar";
  className?: string;
  // If user has script or iframe from Adsterra/Monetag/A-ads
  adScriptUrl?: string;
  adHtmlContent?: string;
}

export default function AdBanner({
  slot,
  className = "",
  adScriptUrl,
  adHtmlContent,
}: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If an ad script URL or HTML content is provided, inject it safely
    if (containerRef.current && (adScriptUrl || adHtmlContent)) {
      if (adHtmlContent) {
        containerRef.current.innerHTML = adHtmlContent;
      }
      if (adScriptUrl) {
        const script = document.createElement("script");
        script.src = adScriptUrl;
        script.async = true;
        containerRef.current.appendChild(script);
      }
    }
  }, [adScriptUrl, adHtmlContent]);

  // If no script/HTML is configured yet, display a styled placeholder slot
  const isAdConfigured = Boolean(adScriptUrl || adHtmlContent);

  return (
    <div
      className={`w-full flex flex-col items-center justify-center my-4 transition-all ${className}`}
    >
      <div className="w-full max-w-4xl px-2">
        {isAdConfigured ? (
          <div
            ref={containerRef}
            className="w-full flex justify-center items-center overflow-hidden"
          />
        ) : (
          <div className="w-full min-h-[90px] border border-dashed border-slate-700 bg-slate-900/60 rounded-xl flex flex-col items-center justify-center p-3 text-center text-slate-400 group hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Ad Placement Slot ({slot.toUpperCase()})
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Ready for ad integration (Adsterra / Monetag / A-Ads). Responsive banner renders automatically when ad script is provided.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
