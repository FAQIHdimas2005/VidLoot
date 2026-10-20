import { FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - VidLoot",
  description: "Terms and conditions governing the use of VidLoot web services.",
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Terms of Service</h1>
            <p className="text-xs text-slate-400 mt-1">Last Updated: 2026</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
          <p>
            Welcome to <strong>VidLoot</strong>. By accessing or using this website, you agree to comply with and be bound by the following Terms of Service.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">1. Permitted Use</h2>
          <p>
            Our service is provided to assist users in saving publicly accessible, unencrypted media for strictly personal, non-commercial, and archival use. You agree not to use VidLoot to infringe on any third-party copyrights or intellectual property rights.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">2. Warranty Disclaimer</h2>
          <p>
            The services on VidLoot are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. VidLoot does not guarantee uninterrupted, error-free, or fully secure operation under all conditions.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">3. Prohibited Conduct</h2>
          <p>
            You agree not to engage in malicious scraping, denial-of-service attacks, automated spam querying, or any activity that artificially degrades platform performance or compromises server integrity.
          </p>
        </div>
      </div>
    </div>
  );
}
