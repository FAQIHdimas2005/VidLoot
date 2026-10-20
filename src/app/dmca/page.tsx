import { ShieldAlert, Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA & Disclaimer Hak Cipta - UnduhCepat",
  description: "Kebijakan hak cipta dan prosedur pemberitahuan DMCA untuk layanan UnduhCepat.",
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">DMCA & Disclaimer Hak Cipta</h1>
            <p className="text-xs text-slate-400 mt-1">Terakhir diperbarui: 2026</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
          <p>
            <strong>UnduhCepat</strong> menghormati hak kekayaan intelektual orang lain dan mematuhi Digital Millennium Copyright Act (DMCA).
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">1. Pernyataan Kepemilikan Konten</h2>
          <p>
            UnduhCepat adalah alat bantu teknis online yang memungkinkan pengguna mengunduh konten publik yang disediakan oleh platform pihak ketiga (seperti TikTok, Instagram, Twitter/X, Facebook, dan YouTube). Kami <strong>tidak meng-hosting, menyimpan, atau memiliki</strong> file media apa pun di server kami. Seluruh data dialirkan secara langsung (direct stream) dari server CDN resmi masing-masing platform.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">2. Penggunaan Pribadi</h2>
          <p>
            Layanan ini ditujukan semata-mata untuk pencadangan konten (backup) dan penggunaan pribadi yang sah (fair use). Pengguna bertanggung jawab penuh atas segala tindakan atau pelanggaran hak cipta yang timbul akibat penyebaran atau penyalahgunaan materi yang diunduh.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">3. Prosedur Pemberitahuan Pelanggaran DMCA</h2>
          <p>
            Jika Anda adalah pemilik hak cipta yang sah atau agen resminya dan meyakini bahwa materi apa pun yang diakses melalui situs kami melanggar hak cipta Anda, silakan hubungi kami dengan menyertakan informasi berikut:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li>Tanda tangan fisik atau elektronik dari pemilik hak cipta atau kuasanya.</li>
            <li>Identifikasi karya berhak cipta yang diklaim telah dilanggar.</li>
            <li>URL spesifik di situs kami atau URL konten yang bersangkutan.</li>
            <li>Informasi kontak Anda (nama lengkap, alamat email, dan nomor telepon).</li>
            <li>Pernyataan dengan itikad baik bahwa penggunaan materi tersebut tidak diizinkan oleh pemilik hak cipta.</li>
          </ul>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-slate-300">
            <Mail className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-white">Hubungi Tim Legal Kami:</p>
              <p className="text-blue-400 text-xs">dmca@unduhcepat.my.id (atau kontak form pengelola)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
