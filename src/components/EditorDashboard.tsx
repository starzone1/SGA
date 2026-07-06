import React, { useState } from 'react';
import { Article, User, UserRole } from '../types';
import { VerifiedBadge, isUserAdminOrVerified } from './VerifiedBadge';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  FileText, 
  Users, 
  Flame, 
  Star,
  Edit3,
  Bot,
  Zap,
  Trash2,
  ShieldAlert,
  Search,
  FileCode,
  DollarSign,
  Award,
  Globe,
  Sliders,
  Check,
  ExternalLink
} from 'lucide-react';
import { 
  updateArticleInFirestore, 
  deleteArticleFromFirestore,
  deleteUserAccountAndArticlesFromFirestore,
  updateUserInFirestore
} from '../services/firestoreService';
import { getStoredUsers, saveStoredUser, getStoredArticles, saveArticles } from '../utils/storage';
import { 
  auditArticleWithGoogleCrawler, 
  getCrawlerViolationLogs 
} from '../services/googleCrawlerService';
import { 
  getStoredAdsSettings, 
  saveAdsSettingsToFirestore, 
  GoogleAdsSettings 
} from '../utils/googleAdsService';

interface EditorDashboardProps {
  currentUser: User | null;
  allArticles: Article[];
  onRefreshArticles?: () => void;
  onSelectArticle: (article: Article) => void;
  usersList?: User[];
  onOpenSitemapModal?: () => void;
}

export const EditorDashboard: React.FC<EditorDashboardProps> = ({
  currentUser,
  allArticles,
  onRefreshArticles,
  onSelectArticle,
  usersList: propUsersList,
  onOpenSitemapModal
}) => {
  if (!currentUser) return null;
  const [activeTab, setActiveTab] = useState<'pending' | 'articles' | 'users' | 'google-ads' | 'crawler'>('articles');
  const [reviewModalArticle, setReviewModalArticle] = useState<Article | null>(null);
  const [editorNote, setEditorNote] = useState('');
  const [isBreakingCheck, setIsBreakingCheck] = useState(false);
  const [isFeaturedCheck, setIsFeaturedCheck] = useState(false);
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [scanReport, setScanReport] = useState<{ total: number; clean: number; deleted: number; logs: string[] } | null>(null);

  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Google AdSense State & Controls
  const [adsSettings, setAdsSettings] = useState<GoogleAdsSettings>(getStoredAdsSettings());
  const [publisherInput, setPublisherInput] = useState(adsSettings.publisherId);

  const pendingQueue = allArticles.filter(a => a.status === 'pending');
  const publishedArticles = allArticles.filter(a => a.status === 'published');
  
  // Merge users from Firestore subscription and LocalStorage to ensure all registered users are visible
  const localUsers = getStoredUsers();
  const usersMap = new Map<string, User>();
  (propUsersList || []).forEach(u => { if (u && u.id) usersMap.set(u.id, u); });
  localUsers.forEach(u => {
    if (u && u.id) {
      const existing = usersMap.get(u.id) || {};
      usersMap.set(u.id, { ...existing, ...u });
    }
  });
  const usersList = Array.from(usersMap.values());

  const filteredUsers = usersList.filter(u => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  // Handler for granting or revoking verification badge
  const handleToggleUserVerification = async (targetUser: User) => {
    const isCurrentlyVerified = targetUser.isVerified ?? isUserAdminOrVerified(targetUser.role, targetUser.name);
    const newVerifiedState = !isCurrentlyVerified;
    const actionText = newVerifiedState ? 'MEMBERIKAN Lencana Verifikasi Redaksi kepada' : 'MENCABUT Lencana Verifikasi dari';

    if (!confirm(`Apakah Anda yakin ingin ${actionText} "${targetUser.name}"?`)) return;

    const updatedUser: User = {
      ...targetUser,
      isVerified: newVerifiedState
    };

    // Save locally & to Firestore
    saveStoredUser(updatedUser);
    await updateUserInFirestore(targetUser.id, updatedUser);

    // Update articles written by this user
    const currentArticles = getStoredArticles();
    const updatedArticles = currentArticles.map(art => {
      if (art.authorId === targetUser.id || art.authorName === targetUser.name) {
        return { ...art, isVerified: newVerifiedState };
      }
      return art;
    });
    saveArticles(updatedArticles);

    for (const art of updatedArticles) {
      if (art.authorId === targetUser.id || art.authorName === targetUser.name) {
        await updateArticleInFirestore(art.id, { isVerified: newVerifiedState }).catch(() => {});
      }
    }

    alert(`Status lencana "${targetUser.name}" berhasil diperbarui!\n\nLencana Verifikasi: ${newVerifiedState ? 'AKTIF (Terverifikasi Redaksi SGA)' : 'DINONAKTIFKAN'}.`);
    if (onRefreshArticles) onRefreshArticles();
  };

  // Handler for changing user role
  const handleUserRoleChange = async (targetUser: User, newRole: UserRole) => {
    if (targetUser.id === 'user-admin-owner' || targetUser.email === 'admin@sganews.id') {
      alert('Peran Pemimpin Redaksi Utama SGA News (Owner) tidak dapat diubah.');
      return;
    }

    if (!confirm(`Ubah peran "${targetUser.name}" menjadi "${newRole.toUpperCase()}"?`)) return;

    const newIsVerified = newRole === 'admin' ? true : (newRole === 'author' ? false : targetUser.isVerified);

    const updatedUser: User = {
      ...targetUser,
      role: newRole,
      isVerified: newIsVerified
    };

    saveStoredUser(updatedUser);
    await updateUserInFirestore(targetUser.id, updatedUser);

    // Update articles authored by this user
    const roleDisplay = newRole === 'admin' ? 'Admin Redaksi' : newRole === 'editor' ? 'Redaktur' : 'Penulis Komunitas';
    const currentArticles = getStoredArticles();
    const updatedArticles = currentArticles.map(art => {
      if (art.authorId === targetUser.id || art.authorName === targetUser.name) {
        return {
          ...art,
          authorRole: roleDisplay,
          isVerified: newIsVerified
        };
      }
      return art;
    });
    saveArticles(updatedArticles);

    for (const art of updatedArticles) {
      if (art.authorId === targetUser.id || art.authorName === targetUser.name) {
        await updateArticleInFirestore(art.id, { 
          authorRole: roleDisplay,
          isVerified: newIsVerified 
        }).catch(() => {});
      }
    }

    alert(`Peran ${targetUser.name} berhasil diubah menjadi ${newRole.toUpperCase()}!`);
    if (onRefreshArticles) onRefreshArticles();
  };

  // Handler for Google Ads Consent Toggle
  const handleToggleAdsConsent = async () => {
    const newConsent = !adsSettings.isApproved;
    const updated: GoogleAdsSettings = {
      ...adsSettings,
      isApproved: newConsent,
      approvedBy: currentUser.name || 'Admin SGA Redaksi',
      approvedAt: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    };
    setAdsSettings(updated);
    await saveAdsSettingsToFirestore(updated);
    alert(`Persetujuan Iklan Google AdSense berhasil ${newConsent ? 'DISETUJUI & DIAKTIFKAN' : 'DINONAKTIFKAN'}.\n\nPersetujuan dicatat oleh: ${updated.approvedBy} pada ${updated.approvedAt}.`);
  };

  // Handler for saving AdSense Publisher ID
  const handleSavePublisherId = async () => {
    if (!publisherInput.trim()) {
      alert('Masukkan ID Publisher Google AdSense yang valid (contoh: ca-pub-3906503668371928).');
      return;
    }
    const updated: GoogleAdsSettings = {
      ...adsSettings,
      publisherId: publisherInput.trim()
    };
    setAdsSettings(updated);
    await saveAdsSettingsToFirestore(updated);
    alert(`ID Publisher Google AdSense berhasil diperbarui: ${publisherInput.trim()}`);
  };

  // Handler for toggling specific ad placement positions
  const handleToggleAdPosition = async (posKey: keyof GoogleAdsSettings['adPositions']) => {
    const updated: GoogleAdsSettings = {
      ...adsSettings,
      adPositions: {
        ...adsSettings.adPositions,
        [posKey]: !adsSettings.adPositions[posKey]
      }
    };
    setAdsSettings(updated);
    await saveAdsSettingsToFirestore(updated);
  };

  const handleRunFullCrawlerAudit = async () => {
    if (publishedArticles.length === 0) {
      alert('Tidak ada artikel terbit untuk dipindai.');
      return;
    }

    if (!confirm(`Sistem akan merayapi & mengaudit ${publishedArticles.length} artikel terbit menggunakan Google AI Safety Crawler. Jika ada artikel melanggar kebijakan Google, artikel & akun pembuatnya akan dihapus secara otomatis. Lanjutkan?`)) {
      return;
    }

    setIsScanningAll(true);
    setScanReport(null);

    let cleanCount = 0;
    let deletedCount = 0;
    const logs: string[] = [];

    for (const art of publishedArticles) {
      logs.push(`[Scanning] "${art.title}" (Penulis: ${art.authorName})...`);
      const audit = await auditArticleWithGoogleCrawler(art);

      if (audit.isViolating) {
        logs.push(`❌ MELANGGAR: ${audit.violationType} - ${audit.violationReason}`);
        logs.push(`🚮 Menghapus artikel ID: ${art.id} & Menonaktifkan akun user ID: ${art.authorId}`);
        await deleteUserAccountAndArticlesFromFirestore(art.authorId, art.id);
        deletedCount++;
      } else {
        logs.push(`✅ LOLOS AUDIT: Konten aman dan sesuai Kebijakan Google.`);
        cleanCount++;
      }
    }

    setScanReport({
      total: publishedArticles.length,
      clean: cleanCount,
      deleted: deletedCount,
      logs
    });

    setIsScanningAll(false);
    if (onRefreshArticles) onRefreshArticles();
  };

  const handleOpenReviewModal = (art: Article) => {
    setReviewModalArticle(art);
    setEditorNote('');
    setIsBreakingCheck(art.isBreaking || false);
    setIsFeaturedCheck(art.isFeatured || false);
  };

  const handleApproveAndPublish = async () => {
    if (!reviewModalArticle) return;
    
    await updateArticleInFirestore(reviewModalArticle.id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
      isBreaking: isBreakingCheck,
      isFeatured: isFeaturedCheck,
      editorialNotes: 'Telah diperiksa & disetujui oleh Redaksi SGA Media.'
    });

    alert(`Artikel "${reviewModalArticle.title}" berhasil diterbitkan secara live di portal berita!`);
    setReviewModalArticle(null);
    if (onRefreshArticles) onRefreshArticles();
  };

  const handleRejectOrRevision = async (type: 'revision' | 'reject') => {
    if (!reviewModalArticle) return;
    if (!editorNote.trim()) {
      alert('Mohon tuliskan catatan redaksi atau alasan revisi untuk penulis.');
      return;
    }

    await updateArticleInFirestore(reviewModalArticle.id, {
      status: 'rejected',
      editorialNotes: type === 'revision' 
        ? `Permintaan Revisi Redaksi: ${editorNote}`
        : `Ditolak Redaksi: ${editorNote}`
    });

    alert(type === 'revision' ? 'Catatan revisi telah dikirimkan ke penulis.' : 'Artikel ditolak.');
    setReviewModalArticle(null);
    if (onRefreshArticles) onRefreshArticles();
  };

  const handleToggleFeature = async (articleId: string, field: 'isBreaking' | 'isFeatured', currentValue: boolean) => {
    await updateArticleInFirestore(articleId, {
      [field]: !currentValue
    });
    if (onRefreshArticles) onRefreshArticles();
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus artikel ini dari sistem?')) {
      await deleteArticleFromFirestore(articleId);
      if (onRefreshArticles) onRefreshArticles();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Redaksi Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black uppercase rounded">
              PORTAL REDAKSI & MANAJEMEN SGA
            </span>
            <span className="text-xs text-slate-400">| Hak Akses {currentUser.role.toUpperCase()}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pusat Kendali Redaksi & Kurasi Berita
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Periksa antrean artikel warga, setujui penayangan berita, atur status breaking news, dan kelola integritas jurnalisme portal SGA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-950/60 border border-blue-800/80 rounded-xl text-center">
            <div className="text-xs font-semibold text-blue-400 uppercase">Antrean Review</div>
            <div className="text-2xl font-black text-blue-500">{pendingQueue.length} Artikel</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          Antrean Review Kontributor ({pendingQueue.length})
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'articles'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-500" />
          Semua Artikel Diterbitkan ({publishedArticles.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-500" />
          Pengguna & Penulis ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('google-ads')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'google-ads'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-500" />
          Iklan Google AdSense
          {adsSettings.isApproved ? (
            <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] rounded font-extrabold border border-emerald-200 dark:border-emerald-800">AKTIF</span>
          ) : (
            <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded font-extrabold">OFF</span>
          )}
        </button>
      </div>

      {/* TAB 1: PENDING QUEUE */}
      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
            Artikel Menunggu Kelayakan Terbit
          </h3>

          {pendingQueue.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold">Semua artikel warga telah diperiksa! Tidak ada antrean pending saat ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingQueue.map((item) => (
                <div 
                  key={item.id}
                  className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                        Oleh: <strong className="text-slate-800 dark:text-slate-200">{item.authorName}</strong>
                        {isUserAdminOrVerified(item.authorRole, item.authorName, item.isVerified) && <VerifiedBadge size="xs" />}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReviewModal(item)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Periksa & Tinjau
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL PUBLISHED ARTICLES */}
      {activeTab === 'articles' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
            Katalog Artikel Berita SGA Online
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                  <th className="py-3 px-2">Berita</th>
                  <th className="py-3 px-2">Penulis</th>
                  <th className="py-3 px-2">Fitur Khusus</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {publishedArticles.map(art => (
                  <tr key={art.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-2 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {art.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {art.category} • {art.views} views
                      </div>
                    </td>

                    <td className="py-3 px-2 font-medium text-slate-700 dark:text-slate-300">
                      {art.authorName}
                    </td>

                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggleFeature(art.id, 'isBreaking', !!art.isBreaking)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                            art.isBreaking 
                              ? 'bg-amber-500 text-slate-950' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <Flame className="w-3 h-3" />
                          Breaking
                        </button>

                        <button
                          onClick={() => handleToggleFeature(art.id, 'isFeatured', !!art.isFeatured)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition ${
                            art.isFeatured 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          <Star className="w-3 h-3" />
                          Headline
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-right space-x-1">
                      <button
                        onClick={() => onSelectArticle(art)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title="Lihat"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(art.id)}
                        className="p-1.5 text-red-500 hover:text-red-700"
                        title="Hapus"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Daftar Akun Pengguna & Penulis Terdaftar ({usersList.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sebagai Pemilik SGA News Portal, Anda dapat memantau seluruh email dan akun pengguna yang telah terdaftar di database portal berita.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800">
                Total {usersList.length} Akun
              </span>
            </div>
          </div>

          {/* Search bar for Users */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari nama penulis, email, atau peran (admin, editor, author)..."
                value={userSearchQuery}
                onChange={e => setUserSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              {userSearchQuery && (
                <button 
                  onClick={() => setUserSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((usr) => (
                <div 
                  key={usr.id} 
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:border-blue-400 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={usr.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
                        alt={usr.name} 
                        className="w-12 h-12 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0 shadow-sm" 
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white text-sm truncate flex items-center gap-1.5">
                          <span className="truncate">{usr.name}</span>
                          {isUserAdminOrVerified(usr.role, usr.name, usr.isVerified) && <VerifiedBadge size="xs" />}
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate flex items-center gap-1">
                          📧 {usr.email}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Bergabung: {usr.joinedDate || '2026'} • {usr.articlesCount || 0} Artikel
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg shrink-0 ${
                      usr.role === 'admin' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900'
                        : usr.role === 'editor'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    }`}>
                      {usr.role}
                    </span>
                  </div>

                  {usr.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      "{usr.bio}"
                    </p>
                  )}

                  {/* Admin Badge & Role Management Controls */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleUserVerification(usr)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                        usr.isVerified || isUserAdminOrVerified(usr.role, usr.name, usr.isVerified)
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-red-100 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-300'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200'
                      }`}
                      title={usr.isVerified ? "Klik untuk mencabut lencana" : "Klik untuk berikan Lencana Verifikasi Redaksi"}
                    >
                      <Award className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        {usr.isVerified || isUserAdminOrVerified(usr.role, usr.name, usr.isVerified)
                          ? 'Lencana Verifikasi (Aktif)'
                          : '+ Beri Lencana Verifikasi'}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[10px] text-slate-400 font-semibold">Peran:</span>
                      <select
                        value={usr.role}
                        onChange={(e) => handleUserRoleChange(usr, e.target.value as UserRole)}
                        disabled={usr.id === 'user-admin-owner' || usr.email === 'admin@sganews.id'}
                        className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="author">Author (Kontributor)</option>
                        <option value="editor">Editor Redaksi</option>
                        <option value="admin">Admin Portal</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                    <span className="text-slate-400 font-medium">
                      ID: <code className="font-mono text-[10px] text-slate-500">{usr.id}</code>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(usr.email);
                        alert(`Email ${usr.email} berhasil disalin!`);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      Salin Email
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-8 text-center text-slate-500 text-xs font-medium">
                Tidak ada pengguna yang sesuai dengan pencarian "{userSearchQuery}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE ADSENSE & IKLAN MANAGEMENT */}
      {activeTab === 'google-ads' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-xl">
                  Persetujuan & Integrasi Iklan Google AdSense
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Sebagai Pemimpin Redaksi & Admin SGA News, Anda memegang hak penuh persetujuan penayangan jaringan iklan Google AdSense pada portal berita warga ini.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleAdsConsent}
                className={`px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition shadow-md active:scale-95 ${
                  adsSettings.isApproved
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-700 hover:bg-slate-800 text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {adsSettings.isApproved
                    ? 'STATUS: DISETUJUI & AKTIF (Klik Nonaktifkan)'
                    : 'STATUS: NONAKTIF (Klik Berikan Persetujuan)'}
                </span>
              </button>
            </div>
          </div>

          {/* Status Consent Certificate Box */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            adsSettings.isApproved 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-100'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                adsSettings.isApproved ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {adsSettings.isApproved ? <Check className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base">
                  {adsSettings.isApproved
                    ? 'Persetujuan Iklan Google Telah Resmi Diberikan'
                    : 'Iklan Google Saat Ini Dalam Status Penangguhan / Nonaktif'}
                </h4>
                <p className="text-xs opacity-90 mt-0.5">
                  Disetujui oleh: <strong>{adsSettings.approvedBy}</strong> • Tanggal: <strong>{adsSettings.approvedAt}</strong>
                </p>
                <p className="text-[11px] opacity-75 mt-1 italic">
                  "{adsSettings.notes}"
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className={`px-3 py-1.5 rounded-lg font-black text-xs inline-block uppercase ${
                adsSettings.isApproved ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
              }`}>
                {adsSettings.isApproved ? 'Terverifikasi Disetujui' : 'Memerlukan Izin Admin'}
              </span>
            </div>
          </div>

          {/* Form Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Publisher ID & Settings */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                Konfigurasi ID Publisher Google AdSense
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Masukkan ID akun Google AdSense resmi Anda agar pendapatan iklan masuk langsung ke akun portal SGA News Anda.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  AdSense Publisher Client ID (ca-pub-xxxx):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={publisherInput}
                    onChange={(e) => setPublisherInput(e.target.value)}
                    placeholder="ca-pub-3906503668371928"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSavePublisherId}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-sm active:scale-95"
                  >
                    Simpan ID
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] text-blue-800 dark:text-blue-200 space-y-1">
                <span className="font-bold">Info Validasi AdSense:</span>
                <p>Google Crawler Safety Audit SGA News akan memverifikasi script & ads.txt otomatis di domain Anda.</p>
              </div>
            </div>

            {/* Position Toggles */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-500" />
                Atur Lokasi Penayangan Banner Iklan
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih posisi letak unit iklan Google AdSense yang diizinkan tayang di portal SGA News.
              </p>

              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">1. Banner Atas Header (Di Bawah Navigasi)</span>
                  <input
                    type="checkbox"
                    checked={adsSettings.adPositions.headerBanner}
                    onChange={() => handleToggleAdPosition('headerBanner')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">2. In-Article Banner (Di Dalam Konten Berita)</span>
                  <input
                    type="checkbox"
                    checked={adsSettings.adPositions.inArticle}
                    onChange={() => handleToggleAdPosition('inArticle')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">3. Sidebar Right Unit (Di Bawah Trending Berita)</span>
                  <input
                    type="checkbox"
                    checked={adsSettings.adPositions.sidebarUnit}
                    onChange={() => handleToggleAdPosition('sidebarUnit')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400 transition">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">4. Floating Sticky Banner (Banner Melayang Bawah)</span>
                  <input
                    type="checkbox"
                    checked={adsSettings.adPositions.bottomBanner}
                    onChange={() => handleToggleAdPosition('bottomBanner')}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & APPROVAL MODAL */}
      {reviewModalArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded">
                  {reviewModalArticle.category}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mt-1">
                  Pemeriksaan Redaksi: {reviewModalArticle.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Penulis: <strong>{reviewModalArticle.authorName}</strong>
                </p>
              </div>
              <button 
                onClick={() => setReviewModalArticle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed border">
              <p className="font-bold italic text-slate-600 dark:text-slate-300">
                "{reviewModalArticle.excerpt}"
              </p>
              <div 
                className="prose dark:prose-invert text-xs space-y-2 pt-2 border-t"
                dangerouslySetInnerHTML={{ __html: reviewModalArticle.content }}
              />
            </div>

            {/* Feature Options */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isBreakingCheck} 
                  onChange={e => setIsBreakingCheck(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Tandai sebagai Breaking News
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isFeaturedCheck} 
                  onChange={e => setIsFeaturedCheck(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Jadikan Berita Headline Utama
              </label>
            </div>

            {/* Editorial Notes Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan Redaksi untuk Penulis (Wajib jika Minta Revisi)
              </label>
              <textarea
                rows={2}
                placeholder="Tuliskan masukan atau alasan penolakan jika ada..."
                value={editorNote}
                onChange={e => setEditorNote(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleRejectOrRevision('reject')}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-300"
              >
                Tolak Artikel
              </button>

              <button
                onClick={() => handleRejectOrRevision('revision')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Minta Revisi
              </button>

              <button
                onClick={handleApproveAndPublish}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Setujui & Terbitkan Live
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
