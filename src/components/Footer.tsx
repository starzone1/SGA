import React from 'react';
import { Category } from '../types';
import { BookOpen, PenTool, Mail, Phone, MapPin, ShieldCheck, FileCode, ExternalLink } from 'lucide-react';

interface FooterProps {
  onSelectCategory: (cat: Category | 'Semua') => void;
  onOpenLegalModal: () => void;
  onOpenSitemapModal?: () => void;
  onOpenRedaksiPortal: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenLegalModal,
  onOpenSitemapModal,
  onOpenRedaksiPortal
}) => {
  const categories: Category[] = [
    'Sepak Bola',
    'Teknologi',
    'Olahraga',
    'Hiburan',
    'Bisnis',
    'Gaya Hidup',
    'Sains'
  ];

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Col 1: SGA Brand (4 cols) */}
        <div className="md:col-span-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <img 
              src="https://ik.imagekit.io/dxokd3m9y/sgaicon.png" 
              alt="SGA Logo" 
              className="w-9 h-9 rounded-lg object-cover border border-slate-800"
            />
            <span className="font-black text-xl text-white uppercase font-sans">
              SGA <span className="text-blue-500">NEWS</span>
            </span>
          </div>

          <p className="text-slate-400 leading-relaxed">
            Portal Berita & Media Komunitas SGA Media. Menghadirkan informasi tepercaya, independen, dan berimbang seputar Teknologi, Sains, Bisnis, dan Gaya Hidup Nusantara.
          </p>

          <div className="pt-2 space-y-1 text-slate-400 text-[11px]">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              Gedung Pers Media SGA, Jakarta Pusat
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              redaksi@sganews.id
            </p>
          </div>
        </div>

        {/* Col 2: Kategori (3 cols) */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
            Kategori Berita Utama
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-xs">
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => onSelectCategory(cat)}
                  className="hover:text-blue-400 transition"
                >
                  • {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Legal & Guidelines (5 cols) */}
        <div className="md:col-span-5 space-y-3">
          <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
            Pedoman Redaksi & Hukum
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={onOpenLegalModal} className="hover:text-white flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Panduan Menulis & Kode Etik
              </button>
            </li>
            <li>
              <button onClick={onOpenLegalModal} className="hover:text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Syarat & Ketentuan Layanan (TOS)
              </button>
            </li>
            <li>
              <button onClick={onOpenLegalModal} className="hover:text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                Kebijakan Privasi Pengguna
              </button>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="bg-slate-900 py-4 px-4 sm:px-8 border-t border-slate-800 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <p>© 2026 SGA News Portal (sganews.id). Hak Cipta Dilindungi Undang-Undang.</p>
          <button 
            onClick={onOpenRedaksiPortal}
            className="text-slate-400 hover:text-white font-extrabold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Portal Redaksi & Admin Staff</span>
          </button>
        </div>
      </div>

    </footer>
  );
};
