import React, { useState } from 'react';
import { Article, User, Category, ArticleStatus } from '../types';
import { VerifiedBadge, isUserAdminOrVerified } from './VerifiedBadge';
import { createSlug } from '../utils/seo';
import { SeoPreviewBox } from './SeoPreviewBox';
import { CoverImageUploader, PRESET_COVERS } from './CoverImageUploader';
import { TagInput } from './TagInput';
import { 
  PenTool, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Eye, 
  Image as ImageIcon,
  Send,
  Save,
  BookOpen,
  Camera,
  ShieldCheck,
  Globe,
  Zap,
  ShieldAlert,
  Link2
} from 'lucide-react';
import { 
  addArticleToFirestore, 
  updateArticleInFirestore, 
  deleteArticleFromFirestore,
  verifyUserLoginInFirestore
} from '../services/firestoreService';
import { generateNewsHeadlineAndExcerpt } from '../services/gemini';
import { sendEditorialNotificationFormspree } from '../services/formspree';
import { processAutoGoogleCrawler } from '../services/googleCrawlerService';

interface AuthorDashboardProps {
  currentUser: User | null;
  userArticles: Article[];
  onRefreshArticles?: () => void;
  onSelectArticle: (article: Article) => void;
  onOpenLegalModal: () => void;
  onOpenEditProfile?: () => void;
}

export const AuthorDashboard: React.FC<AuthorDashboardProps> = ({
  currentUser,
  userArticles,
  onRefreshArticles,
  onSelectArticle,
  onOpenLegalModal,
  onOpenEditProfile
}) => {
  if (!currentUser) return null;

  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'profile'>('create');
  
  // Form State
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [category, setCategory] = useState<Category>('Teknologi');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_COVERS[0].url);
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  
  // AI Generator Loading
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // User Profile State
  const [bioInput, setBioInput] = useState(currentUser.bio || '');

  // Form Submission & Firestore Protection State
  const [submitting, setSubmitting] = useState(false);

  // Form Reset
  const resetForm = () => {
    setEditingArticleId(null);
    setTitle('');
    setCustomSlug('');
    setCategory('Teknologi');
    setTagsInput('');
    setCoverImage(PRESET_COVERS[0].url);
    setCustomCoverUrl('');
    setExcerpt('');
    setContent('');
    setAiSuggestions([]);
  };

  const handleEditClick = (art: Article) => {
    setEditingArticleId(art.id);
    setTitle(art.title);
    setCustomSlug(art.slug || '');
    setCategory(art.category);
    setTagsInput(art.tags ? art.tags.join(', ') : '');
    setCoverImage(art.coverImage);
    setExcerpt(art.excerpt);
    setContent(art.content);
    setActiveTab('create');
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus draf artikel ini?')) {
      await deleteArticleFromFirestore(id);
      if (onRefreshArticles) onRefreshArticles();
    }
  };

  const handleAiAssist = async () => {
    if (!title && !content) {
      alert('Tuliskan draf singkat atau topik berita di kolom judul atau isi terlebih dahulu.');
      return;
    }
    setGeneratingAi(true);
    const result = await generateNewsHeadlineAndExcerpt(title || content, category);
    setAiSuggestions(result.titles);
    if (result.excerpt) {
      setExcerpt(result.excerpt);
    }
    setGeneratingAi(false);
  };

  const handleSubmitArticle = async (submitStatus: ArticleStatus) => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      alert('Mohon lengkapi Judul, Ringkasan, dan Isi Artikel sebelum mengirimkan.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. PROTEKSI FIRESTORE: Memeriksa status login pengguna di Firestore sebelum submit
      const userCheck = await verifyUserLoginInFirestore(currentUser.id);
      if (!userCheck.isValid) {
        alert(`[Akses Ditolak] Pengiriman dibatalkan.\n${userCheck.message || 'Status login Anda tidak terverifikasi di Firestore. Silakan masuk kembali.'}`);
        setSubmitting(false);
        return;
      }

      const finalCover = customCoverUrl.trim() || coverImage;
      const tagsArray = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const rawSlug = customSlug.trim() || title;
      const slug = createSlug(rawSlug) || ('berita-' + Date.now());

      let savedArticleId = editingArticleId;
      // Pengguna terdaftar langsung terbit secara mandiri ('published') tanpa menunggu persetujuan admin!
      const effectiveStatus: ArticleStatus = submitStatus === 'draft' ? 'draft' : 'published';

      let constructedArticle: Article;

      if (editingArticleId) {
        await updateArticleInFirestore(editingArticleId, {
          title,
          slug,
          category,
          tags: tagsArray,
          coverImage: finalCover,
          excerpt,
          content,
          status: effectiveStatus,
          publishedAt: effectiveStatus === 'published' ? new Date().toISOString() : undefined,
          editorialNotes: effectiveStatus === 'published' ? 'Diterbitkan langsung oleh penulis.' : undefined
        });

        constructedArticle = {
          id: editingArticleId,
          title,
          slug,
          excerpt,
          content,
          coverImage: finalCover,
          category,
          tags: tagsArray,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatar,
          authorRole: currentUser.role === 'admin' ? 'Pemred' : currentUser.role === 'editor' ? 'Redaktur' : 'Penulis Komunitas',
          createdAt: new Date().toISOString(),
          status: effectiveStatus,
          views: 0,
          likes: 0
        };
      } else {
        const newArt = await addArticleToFirestore({
          title,
          slug,
          excerpt,
          content,
          coverImage: finalCover,
          category,
          tags: tagsArray,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatar,
          authorRole: currentUser.role === 'admin' ? 'Pemred' : currentUser.role === 'editor' ? 'Redaktur' : 'Penulis Komunitas',
          status: effectiveStatus,
          publishedAt: effectiveStatus === 'published' ? new Date().toISOString() : undefined,
          editorialNotes: effectiveStatus === 'published' ? 'Diterbitkan langsung oleh penulis.' : undefined
        });
        savedArticleId = newArt.id;
        constructedArticle = newArt;
      }

      if (effectiveStatus === 'draft') {
        alert('Draf artikel berhasil disimpan.');
        resetForm();
        if (onRefreshArticles) onRefreshArticles();
        setActiveTab('manage');
      } else {
        // 2. SISTEM GOOGLE AI SAFETY CRAWLER: Mengaudit artikel baru secara otomatis & real-time
        const crawlerRes = await processAutoGoogleCrawler(constructedArticle, currentUser.id);

        if (crawlerRes.passed) {
          // Notifikasi background ke Formspree (jika aktif)
          sendEditorialNotificationFormspree({
            title,
            category,
            excerpt,
            content,
            authorName: currentUser.name,
            authorEmail: currentUser.email,
            authorRole: currentUser.role,
            articleId: savedArticleId || undefined
          }).catch(e => console.warn('Formspree background notification note:', e));

          alert(
            `🚀 PUBLIKASI LANGSUNG BERHASIL!\n\n` +
            `Artikel Anda ("${title}") telah TERBIT LANGSUNG ke portal SGA News tanpa perlu menunggu persetujuan admin.\n\n` +
            `🤖 [Google AI Safety Crawler System]:\n` +
            `Artikel telah dirayapi dan dinyatakan LOLOS audit Kebijakan Keselamatan Google (Safety & Publisher Policy).`
          );

          resetForm();
          if (onRefreshArticles) onRefreshArticles();
          setActiveTab('manage');
        } else {
          // Bila melanggar: Artikel dihapus & Akun dinonaktifkan!
          alert(
            `⛔ [PELANGGARAN KEBIJAKAN GOOGLE SAFETY CRAWLER]\n\n` +
            `Artikel yang Anda buat terdeteksi melanggar Kebijakan Keselamatan Google:\n` +
            `- Jenis Pelanggaran: ${crawlerRes.auditResult.violationType || 'Konten Berbahaya/Ilegal'}\n` +
            `- Detail: ${crawlerRes.auditResult.violationReason}\n\n` +
            `[TINDAKAN OTOMATIS PLATFORM SGA NEWS]:\n` +
            `1. Artikel telah dihapus dari portal berita.\n` +
            `2. Akun Anda (${currentUser.name}) telah dinonaktifkan permanen untuk menjaga platform dari penyalahgunaan.`
          );

          // Force logout & reload page
          localStorage.removeItem('sga_news_current_user_v1');
          window.location.reload();
          return;
        }
      }

    } catch (err: any) {
      console.error('Terjadi kesalahan saat menyimpan artikel:', err);
      alert('Gagal mengirimkan artikel: ' + (err?.message || 'Error tidak diketahui'));
    } finally {
      setSubmitting(false);
    }
  };

  // Stats
  const publishedCount = userArticles.filter(a => a.status === 'published').length;
  const pendingCount = userArticles.filter(a => a.status === 'pending').length;
  const draftCount = userArticles.filter(a => a.status === 'draft').length;
  const totalViews = userArticles.reduce((acc, a) => acc + (a.views || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Dashboard Banner Header */}
      <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 rounded-2xl text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4 max-w-xl">
          <div className="relative shrink-0 group">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-400 shadow-md" 
            />
            {onOpenEditProfile && (
              <button
                onClick={onOpenEditProfile}
                title="Ubah Foto Profil"
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded">
                DASHBOARD PENULIS
              </span>
              <span className="text-xs text-slate-300">| SGA Media Community</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Selamat Datang, {currentUser.name}!</span>
              {isUserAdminOrVerified(currentUser.role, currentUser.name, currentUser.isVerified) && <VerifiedBadge size="sm" />}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Platform pembuatan artikel dan berita warga. Kirimkan karya Anda untuk diperiksa Redaksi SGA sebelum diterbitkan secara online.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onOpenEditProfile && (
            <button
              onClick={onOpenEditProfile}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md"
            >
              <Camera className="w-4 h-4" />
              Ubah Foto Profil
            </button>
          )}

          <button
            onClick={onOpenLegalModal}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            Panduan Menulis
          </button>
        </div>
      </div>

      {/* Stats Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Terbit</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {publishedCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Artikel Online</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Menunggu Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {pendingCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Dalam Antrean Redaksi</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Draf / Simpanan</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {draftCount}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Belum Diajukan</p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pembaca</span>
            <Eye className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalViews}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Total Pembaca Karya</p>
        </div>
      </div>

      {/* Main CMS Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'create'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PenTool className="w-4 h-4" />
          {editingArticleId ? 'Edit Artikel' : 'Tulis Artikel Baru'}
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'manage'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Kelola Artikel Saya ({userArticles.length})
        </button>
      </div>

      {/* TAB 1: FORM TULIS ARTIKEL */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
              {editingArticleId ? 'Sunting Draf Berita' : 'Formulir Pembuatan Berita Baru'}
            </h3>

            {/* AI Assistant Button */}
            <button
              type="button"
              onClick={handleAiAssist}
              disabled={generatingAi}
              className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {generatingAi ? 'Memproses AI...' : 'Bantu Judul & Ringkasan AI'}
            </button>
          </div>

          {/* AI Suggestions Display */}
          {aiSuggestions.length > 0 && (
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase">
                Rekomendasi Judul dari Asisten Redaksi AI:
              </span>
              <div className="space-y-1.5">
                {aiSuggestions.map((sug, i) => (
                  <div 
                    key={i} 
                    onClick={() => setTitle(sug)}
                    className="p-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 font-semibold cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900 transition flex items-center justify-between"
                  >
                    <span>{sug}</span>
                    <span className="text-[10px] text-purple-600 font-bold">Gunakan Judul Ini</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Berita Utama <span className="text-blue-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="misal: Peluncuran Program Beasiswa Riset Digital untuk Mahasiswa..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Berita <span className="text-blue-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Sepak Bola">Sepak Bola</option>
                <option value="Teknologi">Teknologi</option>
                <option value="Olahraga">Olahraga</option>
                <option value="Hiburan">Hiburan</option>
                <option value="Bisnis">Bisnis</option>
                <option value="Gaya Hidup">Gaya Hidup</option>
                <option value="Sains">Sains</option>
              </select>
            </div>

            {/* Tags Input Feature */}
            <TagInput
              value={tagsInput}
              onChange={setTagsInput}
              label="Kata Kunci / Tag Artikel"
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
            authorName={currentUser.name}
            coverImage={customCoverUrl || coverImage}
            createSlug={createSlug}
          />

          {/* Content Body Editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Isi Lengkap Berita (Mendukung paragraf HTML / &lt;p&gt; &lt;h3&gt; &lt;blockquote&gt;) <span className="text-blue-500">*</span>
            </label>
            <textarea
              rows={8}
              required
              placeholder="Tuliskan berita lengkap Anda di sini..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Google AI Safety Crawler Info Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-blue-950/60 border border-emerald-500/30 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Sistem Publikasi Langsung & Protection Google AI Safety Crawler</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Bebas Hambatan:</strong> Akun Anda berhak mempublikasikan berita secara <strong>LANGSUNG</strong> tanpa perlu menunggu persetujuan admin. Artikel akan langsung terbit online ke portal SGA News.
            </p>
            <div className="flex items-start gap-2 p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 text-slate-400 text-[11px]">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Aturan Keselamatan Google:</strong> Sistem Crawler AI Google akan merayapi & memeriksa setiap artikel secara otomatis. Jika terdeteksi konten berbahaya (penipuan, SARA, judi, malware, atau pornografi), artikel akan <strong>otomatis dihapus</strong> dan <strong>akun pembuat dinonaktifkan permanen</strong>.
              </span>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300 transition disabled:opacity-50"
            >
              Reset Form
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmitArticle('draft')}
                disabled={submitting}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Memproses...' : 'Simpan Draf'}
              </button>

              <button
                type="button"
                onClick={() => handleSubmitArticle('published')}
                disabled={submitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                {submitting ? 'Mengaudit & Mempublikasikan...' : 'Publikasikan Artikel Langsung'}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MANAGE MY ARTICLES */}
      {activeTab === 'manage' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
            Daftar Berita & Status Publikasi
          </h3>

          {userArticles.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <p className="text-sm font-medium">Anda belum pernah membuat berita.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
              >
                Tulis Berita Pertama Anda
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="py-3 px-2">Berita</th>
                    <th className="py-3 px-2">Kategori</th>
                    <th className="py-3 px-2">Status Redaksi</th>
                    <th className="py-3 px-2">Pembaca</th>
                    <th className="py-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {userArticles.map(art => (
                    <tr key={art.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-2 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {art.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(art.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        {art.editorialNotes && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                            Catatan Redaksi: {art.editorialNotes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded">
                          {art.category}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        {art.status === 'published' && (
                          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Terbit Online
                          </span>
                        )}
                        {art.status === 'pending' && (
                          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold rounded-full inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Menunggu Review
                          </span>
                        )}
                        {art.status === 'draft' && (
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-full">
                            Draf
                          </span>
                        )}
                        {art.status === 'rejected' && (
                          <span className="px-2.5 py-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold rounded-full inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Ditolak / Perlu Revisi
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">
                        {art.views || 0}
                      </td>

                      <td className="py-3 px-2 text-right space-x-1">
                        {art.status === 'published' && (
                          <button
                            onClick={() => onSelectArticle(art)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded"
                            title="Lihat Tampilan Pembaca"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(art)}
                          className="p-1.5 text-blue-500 hover:text-blue-700 rounded"
                          title="Edit Artikel"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(art.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
