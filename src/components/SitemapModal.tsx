import React, { useState } from 'react';
import { Article } from '../types';
import { generateSitemapXml, downloadSitemapFile, copySitemapToClipboard } from '../utils/sitemap';
import { 
  X, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  Search,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface SitemapModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
}

export const SitemapModal: React.FC<SitemapModalProps> = ({
  isOpen,
  onClose,
  articles
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'xml' | 'guide'>('preview');
  const [baseUrl, setBaseUrl] = useState('https://sganews.vercel.app');

  if (!isOpen) return null;

  const publishedArticles = articles.filter(a => a.status === 'published' || !a.status);
  const xmlContent = generateSitemapXml(articles, baseUrl);

  const handleCopy = async () => {
    const success = await copySitemapToClipboard(xmlContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    downloadSitemapFile(xmlContent, 'sitemap.xml');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Sitemap Generator SGA News
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded-full font-mono">
                  Google Index Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Peta situs XML otomatis memuat semua tautan artikel terbit untuk percepatan indeksasi Google Search Console.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Domain Config Bar */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300 font-medium">Domain Utama:</span>
            <input 
              type="text" 
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-blue-400 font-mono px-3 py-1 rounded-lg focus:outline-none focus:border-blue-500 text-xs w-60"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total URL Terdaftar:</span>
            <span className="px-2.5 py-0.5 bg-blue-600 text-white font-mono font-bold rounded-lg text-xs">
              {publishedArticles.length + 1} URL
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Daftar Link Artikel ({publishedArticles.length})
          </button>
          <button
            onClick={() => setActiveTab('xml')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'xml'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Kode XML Asli
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-1.5 border-b-2 ${
              activeTab === 'guide'
                ? 'border-blue-500 text-blue-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Panduan Google Console
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[380px] overflow-y-auto">
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="text-emerald-400 font-bold font-mono">1. Halaman Beranda / Root</span>
                  <p className="text-slate-400 font-mono text-[11px] truncate">{baseUrl}/</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-mono">Priority: 1.0</span>
              </div>

              {publishedArticles.map((art, idx) => {
                const authorSlug = art.authorName ? art.authorName.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-') : 'penulis';
                const titleSlug = art.title.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-');
                const articleUrl = `${baseUrl}/${authorSlug}/${titleSlug}`;

                return (
                  <div key={art.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 text-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[10px]">{idx + 2}.</span>
                        <span className="font-bold text-slate-200 truncate">{art.title}</span>
                        <span className="px-1.5 py-0.2 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] rounded">
                          {art.category}
                        </span>
                      </div>
                      <p className="text-blue-400/90 font-mono text-[11px] truncate hover:underline">
                        <a href={articleUrl} target="_blank" rel="noopener noreferrer">{articleUrl}</a>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0">
                      <span>Lastmod: {(art.publishedAt || art.createdAt).split('T')[0]}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                        Priority: {art.isFeatured || art.isBreaking ? '0.9' : '0.8'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'xml' && (
            <div className="relative">
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed select-all">
                {xmlContent}
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-blue-950/40 border border-blue-800/60 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Cara Submit Sitemap ke Google Search Console:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed pl-1">
                  <li>
                    Klik tombol <strong className="text-white">"Download sitemap.xml"</strong> di bawah untuk mengunduh berkas sitemap terbaru.
                  </li>
                  <li>
                    Tempatkan berkas <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">sitemap.xml</code> ke folder <code className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono">public/</code> di repositori Vercel / GitHub Anda.
                  </li>
                  <li>
                    Buka <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-semibold">Google Search Console</a>, pilih properti situs Anda (<code className="text-blue-300 font-mono">sganews.vercel.app</code>).
                  </li>
                  <li>
                    Di menu sebelah kiri, klik <strong className="text-white">Peta Situs (Sitemaps)</strong>.
                  </li>
                  <li>
                    Ketik <code className="bg-slate-800 text-emerald-300 px-2 py-0.5 rounded font-mono">sitemap.xml</code> pada kolom <strong className="text-white">Tambahkan peta situs baru</strong> lalu klik <strong className="text-white">KIRIM (SUBMIT)</strong>.
                  </li>
                </ol>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-white">Kenapa Setiap Artikel Butuh Sitemap?</h5>
                <p className="text-slate-400 leading-relaxed">
                  Robot perayap Google (Googlebot) menggunakan sitemap untuk menemukan artikel berita baru secara otomatis tanpa harus menunggu navigasi manual. Dengan memasukkan slug judul artikel dan nama penulis ke sitemap.xml, Google akan merayapi dan menayangkan artikel berita SGA News di hasil pencarian Google News.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <a
            href="https://search.google.com/search-console/sitemaps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1.5 underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka Google Search Console
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin XML
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
            >
              <Download className="w-4 h-4" />
              Download sitemap.xml
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
