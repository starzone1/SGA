import React, { useState, useEffect } from 'react';
import { Article, Category, ArticleStatus, User } from '../types';
import { createSlug } from '../utils/seo';
import { SeoPreviewBox } from './SeoPreviewBox';
import { CoverImageUploader } from './CoverImageUploader';
import { TagInput } from './TagInput';
import { 
  X, 
  Edit3, 
  Sparkles, 
  Image as ImageIcon, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ShieldCheck,
  Zap,
  Link2
} from 'lucide-react';
import { updateArticleInFirestore, verifyUserLoginInFirestore } from '../services/firestoreService';
import { generateNewsHeadlineAndExcerpt } from '../services/gemini';
import { sendEditorialNotificationFormspree } from '../services/formspree';
import { processAutoGoogleCrawler } from '../services/googleCrawlerService';

interface EditArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  currentUser: User;
  onArticleUpdated?: () => void;
}

const CATEGORIES: Category[] = [
  'Sepak Bola',
  'Teknologi',
  'Ekonomi',
  'Olahraga',
  'Hiburan',
  'Gaya Hidup',
  'Internasional',
  'Edukasi',
  'Lingkungan'
];

export const EditArticleModal: React.FC<EditArticleModalProps> = ({
  isOpen,
  onClose,
  article,
  currentUser,
  onArticleUpdated
}) => {
  if (!isOpen || !article) return null;

  const [title, setTitle] = useState(article.title);
  const [customSlug, setCustomSlug] = useState(article.slug || '');
  const [category, setCategory] = useState<Category>(article.category);
  const [tagsInput, setTagsInput] = useState(article.tags ? article.tags.join(', ') : '');
  const [coverImage, setCoverImage] = useState(article.coverImage);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [excerpt, setExcerpt] = useState(article.excerpt);
  const [content, setContent] = useState(article.content);

  // Status & Feedback State
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state when article changes
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setCustomSlug(article.slug || '');
      setCategory(article.category);
      setTagsInput(article.tags ? article.tags.join(', ') : '');
      setCoverImage(article.coverImage);
      setCustomCoverUrl('');
      setExcerpt(article.excerpt);
      setContent(article.content);
      setAiSuggestions([]);
      setFeedback(null);
    }
  }, [article]);

  const handleAiAssist = async () => {
    if (!title && !content) {
      setFeedback({ type: 'error', message: 'Tuliskan judul atau isi artikel terlebih dahulu untuk bantuan AI.' });
      return;
    }
    setGeneratingAi(true);
    setFeedback(null);
    try {
      const result = await generateNewsHeadlineAndExcerpt(title || content, category);
      setAiSuggestions(result.titles);
      if (result.excerpt) {
        setExcerpt(result.excerpt);
      }
      setFeedback({ type: 'success', message: 'Saran judul dan ringkasan berhasil dibuat oleh Gemini AI!' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Gagal membuat saran AI.' });
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveArticle = async (targetStatus?: ArticleStatus) => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      setFeedback({ type: 'error', message: 'Mohon lengkapi Judul, Ringkasan, dan Isi Artikel.' });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      // Check user login validity
      const userCheck = await verifyUserLoginInFirestore(currentUser.id);
      if (!userCheck.isValid) {
        setFeedback({ type: 'error', message: `Akses Ditolak: ${userCheck.message || 'Status login Anda tidak terverifikasi.'}` });
        setIsSaving(false);
        return;
      }

      const finalCover = customCoverUrl.trim() || coverImage;
      const tagsArray = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const rawSlug = customSlug.trim() || title;
      const slug = createSlug(rawSlug) || ('berita-' + Date.now());

      // Determine status - default to published for registered users
      let newStatus: ArticleStatus = targetStatus || 'published';

      const updatedArticleObj: Article = {
        ...article,
        title: title.trim(),
        slug,
        category,
        tags: tagsArray,
        coverImage: finalCover,
        excerpt: excerpt.trim(),
        content: content.trim(),
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date().toISOString() : article.publishedAt
      };

      await updateArticleInFirestore(article.id, {
        title: title.trim(),
        slug,
        category,
        tags: tagsArray,
        coverImage: finalCover,
        excerpt: excerpt.trim(),
        content: content.trim(),
        status: newStatus,
        publishedAt: newStatus === 'published' ? new Date().toISOString() : article.publishedAt,
        editorialNotes: 'Diterbitkan langsung oleh penulis.'
      });

      if (newStatus === 'published') {
        // Run Google AI Safety Crawler audit
        const crawlerRes = await processAutoGoogleCrawler(updatedArticleObj, currentUser.id);

        if (!crawlerRes.passed) {
          alert(
            `⛔ [PELANGGARAN GOOGLE SAFETY CRAWLER]\n\n` +
            `Artikel yang Anda sunting terdeteksi melanggar Kebijakan Keselamatan Google:\n` +
            `- Jenis Pelanggaran: ${crawlerRes.auditResult.violationType || 'Konten Berbahaya/Ilegal'}\n` +
            `- Detail: ${crawlerRes.auditResult.violationReason}\n\n` +
            `[TINDAKAN OTOMATIS PLATFORM SGA NEWS]:\n` +
            `1. Artikel telah dihapus dari portal berita.\n` +
            `2. Akun Anda (${currentUser.name}) telah dinonaktifkan permanen.`
          );

          localStorage.removeItem('sga_news_current_user_v1');
          window.location.reload();
          return;
        }
      }

      setFeedback({ type: 'success', message: 'Perubahan artikel berhasil dipublikasikan dan lolos audit Google AI Safety Crawler!' });

      if (onArticleUpdated) {
        onArticleUpdated();
      }

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 800);

    } catch (err) {
      console.error('Error updating article:', err);
      setFeedback({ type: 'error', message: 'Gagal memperbarui artikel di database.' });
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                Edit Artikel Berita
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Perbarui judul, gambar, ringkasan, atau isi naskah berita
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            aria-label="Tutup Dialog"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSaveArticle(); }} className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          
          {/* Judul Artikel & AI Assist */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Judul Artikel Berita <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAiAssist}
                  disabled={generatingAi}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {generatingAi ? 'Membuat AI...' : 'AI Assistant (Gemini)'}
                </button>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Masukkan judul berita yang lugas dan informatif..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Custom Permalink / Slug Input */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-blue-500" />
                  Custom Permalink / URL Slug (Opsional)
                </label>
                <span className="text-[10px] text-slate-400">
                  Kustomisasi URL artikel Anda
                </span>
              </div>
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-mono select-none mr-1.5 shrink-0 text-[11px]">
                  sganews.vercel.app/
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={e => setCustomSlug(e.target.value)}
                  placeholder={createSlug(title) || 'permalink-kustom-artikel'}
                  className="w-full bg-transparent font-mono text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Pratinjau URL: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">https://sganews.vercel.app/{customSlug ? createSlug(customSlug) : (createSlug(title) || 'permalink-kustom-artikel')}</span>
              </p>
            </div>
          </div>

          {/* AI Suggestions Box */}
          {aiSuggestions.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl space-y-2">
              <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Pilih Saran Judul dari AI:
              </p>
              <div className="space-y-1">
                {aiSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTitle(sug)}
                    className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 transition font-medium"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Kategori & Tag */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Kategori Berita <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Interactive Tag Input */}
            <TagInput
              value={tagsInput}
              onChange={setTagsInput}
              label="Tag Berita / Kata Kunci"
              placeholder="Ketik tag baru lalu tekan Enter atau koma (,)..."
            />
          </div>

          {/* Cover Image Selector with File Upload */}
          <CoverImageUploader
            coverImage={coverImage}
            customCoverUrl={customCoverUrl}
            onSelectPreset={(url) => setCoverImage(url)}
            onChangeCustomUrl={(url) => setCustomCoverUrl(url)}
          />

          {/* Meta Deskripsi (SEO) & SERP Preview */}
          <SeoPreviewBox
            title={title}
            customSlug={customSlug}
            excerpt={excerpt}
            onChangeExcerpt={setExcerpt}
            authorName={article.authorName}
            coverImage={customCoverUrl || coverImage}
            createSlug={createSlug}
          />

          {/* Isi Artikel / Content */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Isi Lengkap Artikel Naskah <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={8}
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Tuliskan isi lengkap artikel berita di sini..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Batal
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveArticle('draft')}
                disabled={isSaving}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Simpan Draf
              </button>

              <button
                type="button"
                onClick={() => handleSaveArticle(currentUser.role === 'admin' || currentUser.role === 'editor' ? 'published' : 'pending')}
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSaving ? 'Menyimpan...' : currentUser.role === 'admin' || currentUser.role === 'editor' ? 'Simpan & Publikasikan' : 'Kirim untuk Peninjauan'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
