import { ShieldAlert, Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA & Copyright Policy - VidLoot",
  description: "Copyright disclaimer and Digital Millennium Copyright Act (DMCA) notice procedures for VidLoot.",
};

export default function DmcaPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">DMCA & Copyright Policy</h1>
            <p className="text-xs text-slate-400 mt-1">Last Updated: 2026</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
          <p>
            <strong>VidLoot</strong> respects the intellectual property rights of others and adheres strictly to the Digital Millennium Copyright Act (DMCA) and relevant international copyright treaties.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">1. No Content Hosting or Archiving</h2>
          <p>
            VidLoot is an online technical client-side utility designed to allow users to index and save publicly accessible media provided directly by third-party content platforms (such as TikTok, Instagram, Twitter/X, Facebook, and YouTube). We <strong>do not host, store, mirror, or cache</strong> media files on our web servers. All media data is streamed in real time directly from official public content delivery networks (CDNs).
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">2. Personal Fair Use</h2>
          <p>
            This service is intended strictly for personal archival, educational, and backup purposes (fair use). Users bear full and sole legal responsibility for any actions or copyright infringements resulting from unauthorized commercial distribution or reuse of downloaded content.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">3. DMCA Takedown Notice Procedure</h2>
          <p>
            If you are a verified copyright holder or an authorized agent representing one, and believe that any media accessed via our technical service infringes upon your copyrighted work, please submit a written notification including:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li>Physical or electronic signature of the copyright owner or authorized representative.</li>
            <li>Detailed identification of the copyrighted work claimed to have been infringed.</li>
            <li>Specific URL or direct locator of the allegedly infringing material.</li>
            <li>Your contact information (legal name, mailing address, telephone number, and official email address).</li>
            <li>A statement made in good faith that the use of the material is not authorized by the copyright owner.</li>
          </ul>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-slate-300">
            <Mail className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Legal & Compliance Department:</p>
              <p className="text-blue-400 text-xs">dmca@vidloot.com (or via our website contact channel)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
