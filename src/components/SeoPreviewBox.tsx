import React, { useState } from 'react';
import { 
  Search, 
  Globe, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Sparkles, 
  Link2, 
  Eye, 
  Scissors,
  FileText
} from 'lucide-react';

interface SeoPreviewBoxProps {
  title: string;
  customSlug: string;
  excerpt: string;
  onChangeExcerpt: (val: string) => void;
  authorName?: string;
  coverImage?: string;
  createSlug: (text: string) => string;
}

export const SeoPreviewBox: React.FC<SeoPreviewBoxProps> = ({
  title,
  customSlug,
  excerpt,
  onChangeExcerpt,
  authorName = 'Redaksi SGA',
  coverImage,
  createSlug
}) => {
  const [activeTab, setActiveTab] = useState<'google' | 'social'>('google');

  const charCount = excerpt.length;
  const maxRecommended = 160;
  const minRecommended = 120;

  // Compute status
  let statusColor = 'text-slate-400 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800';
  let progressColor = 'bg-slate-400';
  let statusText = 'Terlalu pendek';
  let statusBadge = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';

  if (charCount === 0) {
    statusText = 'Belum diisi';
    statusColor = 'text-slate-400';
    progressColor = 'bg-slate-300 dark:bg-slate-700';
  } else if (charCount < 80) {
    statusText = 'Sangat pendek (Rekomendasi min 120 karakter)';
    statusBadge = 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    progressColor = 'bg-amber-500';
  } else if (charCount < minRecommended) {
    statusText = 'Cukup (Bisa ditambah sedikit lagi untuk SEO maksimal)';
    statusBadge = 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    progressColor = 'bg-blue-500';
  } else if (charCount <= maxRecommended) {
    statusText = 'Sangat Baik / Panjang Ideal Google SEO';
    statusBadge = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    progressColor = 'bg-emerald-500';
  } else {
    statusText = `Terlalu panjang (Akan terpotong ${charCount - maxRecommended} karakter di Google)`;
    statusBadge = 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
    progressColor = 'bg-rose-500';
  }

  const progressPercent = Math.min(100, Math.round((charCount / maxRecommended) * 100));

  // Build clean display URL
  const authorSlug = createSlug(authorName || 'penulis');
  const articleSlug = customSlug ? createSlug(customSlug) : (createSlug(title) || 'judul-artikel-berita');
  const fullUrl = `https://sganews.vercel.app/${authorSlug}/${articleSlug}`;
  const displayTitle = title ? `${title} - SGA News` : 'Judul Artikel Berita Utama - SGA News';

  // Handle trim to 160 characters
  const handleTrimToLimit = () => {
    if (excerpt.length > 160) {
      onChangeExcerpt(excerpt.substring(0, 160).trim());
    }
  };

  return (
    <div className="space-y-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
      {/* Header Meta Description & Realtime Counter */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-500" />
            Meta Deskripsi Berita (SEO) <span className="text-blue-500">*</span>
          </label>
          <div className="flex items-center gap-2">
            {/* Real-time Character Counter Badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold ${statusBadge}`}>
              {charCount > maxRecommended ? (
                <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
              ) : charCount >= minRecommended ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
              )}
              {charCount} / 160 karakter
            </span>

            {/* Quick Trim Button if > 160 */}
            {charCount > 160 && (
              <button
                type="button"
                onClick={handleTrimToLimit}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-lg transition active:scale-95"
                title="Potong otomatis ke 160 karakter"
              >
                <Scissors className="w-3 h-3" />
                Potong ke 160
              </button>
            )}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          rows={2}
          required
          placeholder="Tuliskan meta deskripsi singkat artikel (120-160 karakter) yang menggambarkan isi berita untuk mesin pencari Google & pratinjau media sosial..."
          value={excerpt}
          onChange={e => onChangeExcerpt(e.target.value)}
          className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 transition ${
            charCount > 160
              ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
              : charCount >= minRecommended
              ? 'border-emerald-300 dark:border-emerald-700 focus:ring-emerald-500'
              : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
          }`}
        />

        {/* Progress Bar & Status Text */}
        <div className="mt-1.5 space-y-1">
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${progressColor}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <span className="font-medium">{statusText}</span>
            <span className="font-mono">{160 - charCount >= 0 ? `Sisa ${160 - charCount} karakter` : `Melebihi ${charCount - 160} karakter`}</span>
          </div>
        </div>
      </div>

      {/* SERP Search Result Preview Box */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Pratinjau Hasil Pencarian & Media Sosial
            </span>
          </div>

          {/* Toggle Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-lg text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('google')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                activeTab === 'google'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Search className="w-3 h-3" />
              Google SERP
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('social')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                activeTab === 'social'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Share2 className="w-3 h-3" />
              Social Card
            </button>
          </div>
        </div>

        {/* Tab Content 1: Google SERP Preview */}
        {activeTab === 'google' && (
          <div className="p-3.5 bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs font-sans space-y-1.5 select-none">
            {/* Favicon & Breadcrumb */}
            <div className="flex items-center gap-2 text-xs">
              <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                S
              </div>
              <div className="flex flex-col leading-tight overflow-hidden">
                <span className="text-[12px] font-semibold text-[#202124] dark:text-[#e8eaed] truncate">
                  SGA News Portal
                </span>
                <span className="text-[11px] text-[#4d5156] dark:text-[#bdc1c6] font-mono truncate">
                  {fullUrl}
                </span>
              </div>
            </div>

            {/* Google Search Result Title Link */}
            <h3 className="text-sm sm:text-base font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer line-clamp-1 leading-snug">
              {displayTitle}
            </h3>

            {/* Google Meta Description Snippet */}
            <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
              {excerpt ? (
                <span>
                  {excerpt.length > 160 ? (
                    <>
                      <span>{excerpt.substring(0, 160)}</span>
                      <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-0.5 rounded font-bold underline decoration-rose-500" title="Karakter ini akan terpotong oleh Google">
                        {excerpt.substring(160)}
                      </span>
                      <span className="text-slate-400"> ...</span>
                    </>
                  ) : (
                    excerpt
                  )}
                </span>
              ) : (
                <span className="italic text-slate-400 dark:text-slate-500">
                  Pratinjau meta deskripsi akan muncul di sini saat Anda mengetik deskripsi artikel...
                </span>
              )}
            </p>
          </div>
        )}

        {/* Tab Content 2: Social Media OpenGraph Card Preview */}
        {activeTab === 'social' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs space-y-0">
            {coverImage && (
              <div className="aspect-[1.91/1] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-3 space-y-1 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                SGANEWS.VERCEL.APP
              </p>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                {title || 'Judul Artikel Utama'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {excerpt || 'Meta deskripsi artikel akan tampil sebagai pengantar ringkas saat dibagikan ke WhatsApp, Telegram, Facebook, atau Twitter.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
