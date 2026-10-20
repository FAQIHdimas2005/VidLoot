import { Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi (Privacy Policy) - VidLoot",
  description: "Kebijakan privasi mengenai penggunaan data di situs VidLoot.",
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
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Kebijakan Privasi</h1>
            <p className="text-xs text-slate-400 mt-1">Terakhir diperbarui: 2026</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
          <p>
            Di <strong>VidLoot</strong>, privasi pengunjung kami adalah salah satu prioritas utama kami. Dokumen Kebijakan Privasi ini berisi jenis informasi yang dikumpulkan dan dicatat oleh situs kami serta bagaimana kami menggunakannya.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">1. Pengumpulan Data Pribadi</h2>
          <p>
            Kami <strong>tidak mewajibkan pendaftaran akun</strong> dan kami tidak mengumpulkan informasi identitas pribadi (seperti nama lengkap, alamat rumah, atau kata sandi media sosial Anda). Tautan URL yang Anda masukkan hanya diproses secara instan di memori sementara untuk mengambil file media dan tidak disimpan secara permanen di basis data kami.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">2. File Log (Log Files)</h2>
          <p>
            Seperti kebanyakan situs web standar lainnya, UnduhCepat menggunakan file log server standar untuk tujuan pemeliharaan sistem, analisis performa situs, dan pencegahan penyalahgunaan (DDoS/Spam). Data ini mencakup alamat protokol internet (IP), jenis browser, Internet Service Provider (ISP), dan waktu kunjungan. Data ini tidak terhubung dengan informasi yang dapat diidentifikasi secara pribadi.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">3. Cookie & Mitra Periklanan</h2>
          <p>
            Situs kami dapat menggunakan cookie untuk meningkatkan pengalaman pengguna dan menampilkan iklan melalui jaringan pihak ketiga (seperti Adsterra, Monetag, atau A-Ads). Vendor pihak ketiga tersebut dapat menggunakan cookie atau web beacon untuk menyajikan iklan yang relevan kepada pengunjung berdasarkan kunjungan mereka ke situs ini atau situs web lain di internet.
          </p>

          <h2 className="text-base sm:text-lg font-bold text-white pt-2">4. Persetujuan</h2>
          <p>
            Dengan menggunakan situs web kami, Anda dengan ini menyetujui Kebijakan Privasi kami dan menyetujui syarat-syaratnya.
          </p>
        </div>
      </div>
    </div>
  );
}
