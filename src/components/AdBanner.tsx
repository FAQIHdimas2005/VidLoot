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

  // If no specific script/HTML is configured, return null to keep the page clean and polished
  // (Monetag MultiTag automatically handles in-page push, vignette, and native ads globally)
  if (!adScriptUrl && !adHtmlContent) {
    return null;
  }

  return (
    <div
      className={`w-full flex flex-col items-center justify-center my-4 transition-all ${className}`}
    >
      <div className="w-full max-w-4xl px-2">
        <div
          ref={containerRef}
          className="w-full flex justify-center items-center overflow-hidden"
        />
      </div>
    </div>
  );
}
