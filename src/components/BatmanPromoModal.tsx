import React, { useState, useEffect } from 'react';
import { X, Shield, Zap, ExternalLink, Flame, Trophy, CheckCircle2 } from 'lucide-react';

const bannerImg = 'https://ik.imagekit.io/dxokd3m9y/hatihati.webp';

interface BatmanPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BatmanPromoModal({ isOpen, onClose }: BatmanPromoModalProps) {
  const [loginUrl, setLoginUrl] = useState('https://badaksawah.pages.dev/?id=kancah4d');
  const [daftarUrl, setDaftarUrl] = useState('https://shortq.my/sganews');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setIsMounted(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen && !isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 transition-all duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop with a premium blur */}
      <div
        className={`absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full max-w-[440px] bg-gradient-to-b from-[#0e1329] to-[#060813] rounded-3xl overflow-hidden border border-yellow-500/30 shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col transition-all duration-300 transform ${
          isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Glow decorative accent at the top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_15px_rgba(234,179,8,1)] z-20" />

        {/* Banner Section with 2:1 Image Aspect Ratio */}
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-slate-950 flex flex-col justify-end border-b border-yellow-500/20">
          <img
            src={bannerImg}
            alt="KANCAH4D Promo"
            className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-700 hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient vignette over the image */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e1329]/80 via-transparent to-black/30" />

          {/* Close Button "X" with glowing effect */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-50 p-2 rounded-full bg-black/80 border border-yellow-500/30 text-yellow-400 hover:text-white hover:bg-yellow-500/30 hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all duration-300 cursor-pointer"
            aria-label="Close Promo"
          >
            <X size={14} className="stroke-[2.5]" />
          </button>

          {/* Glowing LIVE Tag inside image */}
          <div className="absolute top-3.5 left-3.5 z-40 flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 border border-red-500/50 rounded-full text-[9px] font-black tracking-widest text-white uppercase shadow-lg select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-white absolute" />
            SITUS GACOR
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col gap-4">
          {/* Brand Logo & Headline Section */}
          <div className="flex flex-col items-center text-center gap-2">
            {/* Glowing Badges & Tags */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <div className="flex items-center gap-1 px-2.5 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-[9px] font-extrabold text-yellow-400 uppercase select-none">
                <Shield size={9} className="stroke-[2.5]" />
                <span>MAIN AMAN</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[9px] font-extrabold text-cyan-400 uppercase select-none">
                <Zap size={9} className="stroke-[2.5] fill-cyan-400 text-cyan-400" />
                <span>AKSES CEPAT</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[9px] font-extrabold text-emerald-400 uppercase select-none">
                <Trophy size={9} className="stroke-[2.5]" />
                <span>MENANG NYAMAN</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: LOGIN & DAFTAR */}
          <div className="grid grid-cols-2 gap-3 mt-0.5">
            {/* LOGIN Button */}
            <a
              href={loginUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center gap-1.5 bg-[#121833] border border-slate-700/80 hover:border-yellow-500/60 text-white hover:text-yellow-400 rounded-xl py-2.5 px-3.5 font-black text-xs tracking-widest uppercase transition-all duration-300 shadow-lg hover:shadow-yellow-500/10 active:scale-[0.98] overflow-hidden cursor-pointer"
            >
              {/* Light sweep effect */}
              <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 animate-shine-sweep pointer-events-none" />
              <span>LOGIN</span>
              <ExternalLink size={12} className="text-slate-400 group-hover:text-yellow-400 transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200" />
            </a>

            {/* DAFTAR Button */}
            <a
              href={daftarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 rounded-xl py-2.5 px-3.5 font-black text-xs tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.55)] active:scale-[0.98] overflow-hidden cursor-pointer"
            >
              {/* Light sweep effect */}
              <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shine-sweep pointer-events-none" />
              <span>DAFTAR</span>
              <Zap size={12} className="fill-slate-950 text-slate-950 animate-bounce" />
            </a>
          </div>

          {/* Transparent Outline Panel with Text Content */}
          <div className="relative bg-slate-950/60 rounded-xl p-3 border border-slate-900/80 flex flex-col items-center justify-center text-center gap-1 shadow-inner overflow-hidden">
            {/* Light sweep effect */}
            <div className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-shine-sweep pointer-events-none" />
            <p className="text-slate-300 text-[10px] leading-relaxed font-semibold">
              <span className="text-yellow-400 font-bold">KANCAH4D</span> : Portal Game Online dengan Navigasi Ringan dan Akses Cepat
            </p>
            <p className="text-emerald-400 text-[9px] font-bold tracking-wider font-mono">
              &copy; COPYRIGHT 2026 | KANCAH4D | SEO Kedondong
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
