import React, { useState } from 'react';
import { X, ShieldCheck, FileText, BookOpen, CheckCircle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'terms' | 'privacy' | 'guidelines';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, defaultTab = 'guidelines' }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'guidelines'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <img 
              src="https://ik.imagekit.io/dxokd3m9y/sgaicon.png" 
              alt="SGA Logo" 
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700" 
            />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Dokumen Kebijakan & Redaksi SGA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aturan & Regulasi Resmi Portal Berita SGA Media
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50 px-6">
          <button
            onClick={() => setActiveTab('guidelines')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'guidelines'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Panduan Menulis & Kode Etik
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Syarat & Ketentuan (TOS)
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'privacy'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Kebijakan Privasi
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          {activeTab === 'guidelines' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 text-base mb-1">
                  Panduan Editorial Penulis Komunitas SGA News
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  Seluruh artikel warga dan kontributor akan melalui proses pemeriksaan oleh Redaktur Eksekutif sebelum diterbitkan secara umum.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  1. Keaslian & Kebenaran Fakta (Anti-Hoax)
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                  Setiap berita wajib memiliki sumber informasi yang jelas. Dilarang keras menyebarkan berita bohong (hoax), ujaran kebencian, Isu SARA, pornografi, atau promosi judi online/konten ilegal.
                </p>

                <h5 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  2. Larangan Plagiarisme & Hak Cipta Foto
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                  Artikel harus ditulis sendiri oleh kontributor. Pengutipan berita dari media lain wajib mencantumkan sumber rujukan jelas. Foto sampul berita harus menyertakan atribusi lisensi/kredit foto.
                </p>

                <h5 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  3. Standar Format & Bahasa Indonesia Baku
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                  Minimal artikel terdiri dari 300 kata, menggunakan bahasa Indonesia yang santun, ejaan baku (PUEBI), serta struktur berita piramida terbalik (Lead -&gt; Isi -&gt; Kesimpulan).
                </p>

                <h5 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  4. Alur Review & Persetujuan Redaksi
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                  Artikel yang dikirimkan kontributor akan berada dalam status <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium rounded">Menunggu Review</span>. Redaktur berhak menyunting judul, memperbaiki tata bahasa, atau meminta revisi jika diperlukan.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Syarat & Ketentuan Penggunaan SGA News Portal
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dengan mendaftar sebagai kontributor atau membaca di portal ini, Anda menyetujui seluruh syarat dan ketentuan berikut:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li><strong>Tanggung Jawab Konten:</strong> Kontributor bertanggung jawab penuh atas kebenaran materi tulisan yang dipublikasikan atas nama akun mereka.</li>
                <li><strong>Hak Cipta:</strong> Hak cipta karya tulis tetap milik penulis, namun SGA News memiliki hak tidak terbatas untuk menayangkan dan menyebarluaskan tulisan di seluruh saluran media SGA.</li>
                <li><strong>Penghapusan Konten:</strong> Pengelola berhak menghapus artikel atau menangguhkan akun yang melanggar kode etik jurnalistik tanpa pemberitahuan sebelumnya.</li>
                <li><strong>Sistem Komentar:</strong> Komentar pembaca dipantau oleh sistem moderation untuk menjaga ruang diskusi yang bersih dan saling menghormati.</li>
              </ol>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Kebijakan Privasi Pengguna (Privacy Policy)
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                SGA News menghormati dan melindungi privasi data pribadi seluruh anggota komunitas dan pembaca kami.
              </p>

              <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li><strong>Data yang Disimpan:</strong> Nama, email, dan biografi singkat saat melakukan pendaftaran akun penulis.</li>
                <li><strong>Penggunaan Data:</strong> Data hanya digunakan untuk otentikasi akun, atribusi penulis pada berita, dan verifikasi identifikasi redaksi.</li>
                <li><strong>Keamanan:</strong> Kami tidak pernah menjual atau membagikan data pribadi Anda kepada pihak ketiga mana pun tanpa izin eksplisit.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-lg transition"
          >
            Saya Mengerti
          </button>
        </div>

      </div>
    </div>
  );
};
