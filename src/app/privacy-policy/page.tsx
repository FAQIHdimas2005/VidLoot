import { Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - VidLoot",
  description: "Privacy policy regarding user data handling and cookies on VidLoot.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-xs text-slate-400 mt-1">Last Updated: 2026</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
          <p>
            At <strong>VidLoot</strong>, accessible via our web platform, user privacy is one of our foremost priorities. This Privacy Policy outlines the types of information collected and how we handle it.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">1. Personal Data Collection</h2>
          <p>
            VidLoot <strong>does not require user registration</strong>. We never collect personal identification information such as names, physical addresses, email addresses, or social media passwords. URLs submitted to our input fields are processed ephemerally in server memory solely to retrieve media information and are discarded immediately.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">2. Server Log Files</h2>
          <p>
            Like standard web services globally, VidLoot employs standard log files for system performance monitoring, security diagnostics, and bot/DDoS mitigation. These include internet protocol (IP) addresses, browser user-agents, referring pages, and date/time stamps. This information is not linked to any personally identifiable information.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">3. Cookies & Advertising Partners</h2>
          <p>
            VidLoot displays advertisements via reputable third-party ad networks (such as Adsterra, Monetag, and A-Ads). These third-party vendors may use cookies, web beacons, or local storage mechanisms to deliver relevant, non-intrusive advertisements based on visits to this site and other websites across the web.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">4. Consent</h2>
          <p>
            By using our website, you hereby consent to our Privacy Policy and agree to its terms.
          </p>
        </div>
      </div>
    </div>
  );
}
