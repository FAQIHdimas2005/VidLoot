import { FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan (Terms of Service) - UnduhCepat",
  description: "Syarat dan ketentuan penggunaan situs dan layanan UnduhCepat.",
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Syarat & Ketentuan Layanan</h1>
            <p className="text-xs text-slate-400 mt-1">Terakhir diperbarui: 2026</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
          <p>
            Selamat datang di <strong>UnduhCepat</strong>. Dengan mengakses dan menggunakan situs web ini, Anda setuju untuk terikat oleh Syarat dan Ketentuan berikut.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">1. Penggunaan yang Diperbolehkan</h2>
          <p>
            Layanan kami dirancang untuk membantu pengguna mengunduh konten publik milik pribadi atau konten bebas lisensi untuk keperluan non-komersial dan penggunaan pribadi. Anda setuju untuk tidak menggunakan situs ini untuk mengunduh materi berhak cipta tanpa izin tertulis dari pemilik sah materi tersebut.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">2. Penafian Tanggung Jawab (Disclaimer)</h2>
          <p>
            Layanan ini disediakan atas dasar "sebagaimana adanya" (as is) dan "sebagaimana tersedia" (as available). Kami tidak memberikan jaminan bahwa situs akan selalu bebas gangguan atau bebas kesalahan teknis. Dalam keadaan apa pun, UnduhCepat tidak bertanggung jawab atas kerugian langsung atau tidak langsung akibat penggunaan layanan ini.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">3. Batasan dan Perlindungan Sistem</h2>
          <p>
            Anda dilarang melakukan tindakan yang dapat membebani infrastruktur server kami secara tidak wajar, termasuk penggunaan script scraping bot otomatis, serangan DDoS, atau upaya memintas sistem proteksi kami.
          </p>
        </div>
      </div>
    </div>
  );
}
