import React, { useEffect, useState } from 'react';
import { Info, ExternalLink, X, ShieldCheck } from 'lucide-react';
import { GoogleAdsSettings, getStoredAdsSettings } from '../utils/googleAdsService';

interface GoogleAdUnitProps {
  position: 'header' | 'in-article' | 'sidebar' | 'bottom-sticky';
  settings?: GoogleAdsSettings;
  className?: string;
}

export const GoogleAdUnit: React.FC<GoogleAdUnitProps> = ({
  position,
  settings: propSettings,
  className = ''
}) => {
  const [settings, setSettings] = useState<GoogleAdsSettings>(propSettings || getStoredAdsSettings());
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (propSettings) {
      setSettings(propSettings);
    }
  }, [propSettings]);

  // Attempt to initialize Google Ads script if adsbygoogle exists
  useEffect(() => {
    if (settings.isApproved) {
      try {
        // @ts-expect-error Google Ads script injection
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        // Script might not be loaded in preview iframe, standard graceful handling
      }
    }
  }, [settings.isApproved, position]);

  if (!settings.isApproved || isDismissed) {
    return null;
  }

  // Check if position is enabled in admin settings
  const isPositionEnabled = 
    (position === 'header' && settings.adPositions.headerBanner) ||
    (position === 'in-article' && settings.adPositions.inArticle) ||
    (position === 'sidebar' && settings.adPositions.sidebarUnit) ||
    (position === 'bottom-sticky' && settings.adPositions.bottomBanner);

  if (!isPositionEnabled) {
    return null;
  }

  // Position specific layout styles
  const containerStyles = {
    header: 'w-full my-4 max-w-5xl mx-auto px-4',
    'in-article': 'w-full my-6 p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70',
    sidebar: 'w-full my-4 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70',
    'bottom-sticky': 'fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 text-white border-t border-slate-700 p-2.5 shadow-2xl backdrop-blur-md'
  };

  return (
    <div className={`${containerStyles[position]} ${className}`} id={`google-ad-${position}`}>
      <div className="flex flex-col gap-2">
        {/* Ad Header Label */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium px-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold uppercase text-[9px] border border-blue-200 dark:border-blue-800">
              <ShieldCheck className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
              Iklan Google (Disetujui Redaksi)
            </span>
            <span className="hidden sm:inline">• Publisher ID: <code className="font-mono text-[9px]">{settings.publisherId}</code></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInfoModal(!showInfoModal)}
              className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition"
              title="Mengapa Iklan Ini Muncul?"
            >
              <Info className="w-3 h-3 text-blue-500" />
              <span className="hidden sm:inline">Info Iklan</span>
            </button>

            {position === 'bottom-sticky' && (
              <button
                onClick={() => setIsDismissed(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                title="Tutup Iklan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Info Modal/Popover */}
        {showInfoModal && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 my-1 space-y-1 shadow-sm">
            <p className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Transparansi Iklan SGA News
            </p>
            <p className="text-[11px] leading-relaxed">
              Penayangan iklan Google AdSense ini secara resmi telah **disetujui oleh {settings.approvedBy}** pada {settings.approvedAt}. Keuntungan iklan digunakan untuk mendukung operasional independen portal berita warga SGA News.
            </p>
          </div>
        )}

        {/* Google AdSense ins markup for real AdSense crawlers */}
        <ins
          className="adsbygoogle hidden"
          style={{ display: 'block' }}
          data-ad-client={settings.publisherId}
          data-ad-slot="1234567890"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />

        {/* Visual Responsive Ad Content Card */}
        {position === 'header' && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 p-4 sm:p-5 text-white border border-blue-500/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-inner font-black text-lg">
                G
              </div>
              <div>
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">Mitra Resmi Google Cloud</span>
                <h4 className="font-black text-sm sm:text-base leading-tight">Bangun Aplikasi & Web Berita Modern Tanpa Batas</h4>
                <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">Infrastruktur cepat, aman, & terintegrasi AI Studio Google.</p>
              </div>
            </div>
            <a 
              href="https://ai.google.dev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
            >
              <span>Pelajari Selengkapnya</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {position === 'in-article' && (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                SGA
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Dukung Komunitas Jurnalisme Warga SGA News</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Kirim berita daerah Anda & dapatkan lencana redaksi terverifikasi.</div>
              </div>
            </div>
            <a 
              href="/redaksi/penulis" 
              className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-lg hover:opacity-90 transition shrink-0"
            >
              Mulai Menulis
            </a>
          </div>
        )}

        {position === 'sidebar' && (
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Iklan Terverifikasi</div>
            <div className="font-bold text-xs text-slate-900 dark:text-white">Google Workspace & Cloud Solutions</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tingkatkan produktivitas tim redaksi dengan Google Cloud Platform.</p>
            <a 
              href="https://workspace.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition"
            >
              Coba Gratis
            </a>
          </div>
        )}

        {position === 'bottom-sticky' && (
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <p className="truncate text-slate-200">
                <strong className="text-white">Google AdSense Partner:</strong> Pasang iklan bisnis Anda secara langsung di jaringan portal SGA News.
              </p>
            </div>
            <a 
              href="https://ads.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg shrink-0 transition"
            >
              Pasang Iklan
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
