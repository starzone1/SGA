import React, { useState, useEffect } from 'react';
import { Article, User, ArticleStatus, UserRole } from '../types';
import { VerifiedBadge, isUserAdminOrVerified, getAuthorAvatar } from './VerifiedBadge';
import { ArticleCard } from './ArticleCard';
import { updateArticleSEO } from '../utils/seo';
import { 
  getFollowedAuthors, 
  toggleFollowAuthor, 
  getLikedProfiles, 
  toggleProfileLike 
} from '../utils/storage';
import { updateUserInFirestore } from '../services/firestoreService';
import { 
  ArrowLeft, 
  Calendar, 
  BookOpen, 
  Eye, 
  Shield, 
  PenTool, 
  Edit3, 
  UserCheck,
  UserPlus,
  Users,
  Heart,
  Share2,
  Sparkles,
  Check,
  Award,
  Camera,
  Edit,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react';

interface AuthorProfileProps {
  authorId?: string | null;
  authorName?: string | null;
  usersList: User[];
  allArticles: Article[];
  onBack: () => void;
  onSelectArticle: (article: Article) => void;
  onToggleBookmark: (id: string) => void;
  bookmarkedIds: string[];
  currentUser?: User | null;
  onOpenEditProfile?: () => void;
  onEditArticle?: (article: Article) => void;
}

export const AuthorProfile: React.FC<AuthorProfileProps> = ({
  authorId,
  authorName,
  usersList,
  allArticles,
  onBack,
  onSelectArticle,
  onToggleBookmark,
  bookmarkedIds,
  currentUser,
  onOpenEditProfile,
  onEditArticle
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<'semua' | 'published' | 'pending' | 'draft' | 'rejected'>('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState<'articles' | 'likes' | 'about'>('articles');
  const [sortFilter, setSortFilter] = useState<'latest' | 'popular'>('latest');

  const createSlug = (text: string) => {
    if (!text) return '';
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const targetSlug = authorName ? createSlug(authorName) : (authorId ? createSlug(authorId) : '');

  // Find matching user from users list by ID or by Name or Slug match
  let foundUser = usersList.find(u => 
    u && (
      (authorId && u.id === authorId) || 
      (authorName && u.id === authorName) ||
      (authorName && u.name && u.name.toLowerCase() === authorName.toLowerCase()) ||
      (targetSlug && u.name && createSlug(u.name) === targetSlug) ||
      (authorId && u.name && createSlug(u.name) === createSlug(authorId))
    )
  );

  // Fallback to currentUser if inspecting own profile or admin profile
  if (!foundUser && currentUser) {
    const isCurrentAdmin = currentUser.role === 'admin' && (
      authorId === 'user-admin-owner' || 
      targetSlug === 'admin-sga-redaksi' || 
      targetSlug === 'admin' ||
      (authorName && authorName.toLowerCase().includes('admin'))
    );
    if (
      isCurrentAdmin ||
      (authorId && currentUser.id === authorId) ||
      (authorName && currentUser.name && currentUser.name.toLowerCase() === authorName.toLowerCase()) ||
      (targetSlug && currentUser.name && createSlug(currentUser.name) === targetSlug)
    ) {
      foundUser = currentUser;
    }
  }

  // Find ALL articles written by this author (all statuses)
  const foundUserSlug = foundUser ? createSlug(foundUser.name) : '';

  const allAuthorArticles = allArticles.filter(a => {
    if (!a) return false;
    if (authorId && a.authorId === authorId) return true;
    if (foundUser && (a.authorId === foundUser.id || (foundUser.role === 'admin' && a.authorId === 'user-admin-owner'))) return true;
    if (authorName && a.authorName && a.authorName.toLowerCase() === authorName.toLowerCase()) return true;
    if (targetSlug && a.authorName && createSlug(a.authorName) === targetSlug) return true;
    if (foundUserSlug && a.authorName && createSlug(a.authorName) === foundUserSlug) return true;
    if ((foundUser?.role === 'admin' || targetSlug.includes('admin')) && (a.authorId === 'user-admin-owner' || a.authorRole === 'Pemred' || a.authorRole === 'Pemimpin Redaksi')) return true;
    return false;
  });

  // Check if current user is owner of profile or admin/editor
  const isOwnerOrAdmin = currentUser && (
    (foundUser && currentUser.id === foundUser.id) ||
    (authorName && currentUser.name && currentUser.name.toLowerCase() === authorName.toLowerCase()) ||
    currentUser.role === 'admin' ||
    currentUser.role === 'editor'
  );

  // Filter articles based on status tab and search query
  const filteredArticles = allAuthorArticles.filter(article => {
    // If not owner/admin, only show published articles to public visitors
    if (!isOwnerOrAdmin && article.status !== 'published') {
      return false;
    }

    if (selectedStatusTab !== 'semua' && article.status !== selectedStatusTab) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = article.title.toLowerCase().includes(query);
      const matchCategory = article.category.toLowerCase().includes(query);
      const matchTags = article.tags?.some(t => t.toLowerCase().includes(query));
      return matchTitle || matchCategory || matchTags;
    }

    return true;
  });

  // Sort articles based on SlideShare sub-filter (Latest vs Most Popular)
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortFilter === 'popular') {
      return (b.views || 0) - (a.views || 0);
    }
    return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime();
  });

  // Calculate stats
  const publishedArticles = allAuthorArticles.filter(a => a.status === 'published');
  const totalViews = publishedArticles.reduce((sum, a) => sum + (a.views || 0), 0);
  const pendingCount = allAuthorArticles.filter(a => a.status === 'pending').length;
  const draftCount = allAuthorArticles.filter(a => a.status === 'draft').length;
  const rejectedCount = allAuthorArticles.filter(a => a.status === 'rejected').length;

  // Clean presentation metadata
  const firstArticle = allAuthorArticles[0];
  const isAdminProfile = 
    (authorId === 'user-admin-owner' || authorId === 'user-admin-1') ||
    targetSlug.includes('admin') ||
    (authorName && authorName.toLowerCase().includes('admin')) ||
    (foundUser && foundUser.role === 'admin') ||
    (currentUser && currentUser.role === 'admin' && (authorId === currentUser.id || authorName === currentUser.name));

  const displayName = isAdminProfile 
    ? 'Admin SGA Redaksi' 
    : (foundUser?.name || (authorName && !authorName.includes('-') ? authorName : null) || firstArticle?.authorName || 'Penulis SGA');

  const displayRole = isAdminProfile 
    ? 'admin' 
    : (foundUser?.role || firstArticle?.authorRole || 'author');

  const displayAvatar = foundUser?.avatar || (isAdminProfile 
    ? 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png' 
    : getAuthorAvatar(firstArticle?.authorAvatar, displayRole, displayName));

  const displayBio = foundUser?.bio || (isAdminProfile 
    ? 'Pemimpin Redaksi Utama & Owner SGA News Portal. Bertanggung jawab atas kebijakan jurnalistik, verifikasi berita, dan pengawasan tim redaksi.' 
    : 'Kontributor jurnalistik dan penulis aktif di Portal Berita & Media Komunitas SGA News. Menyajikan warta terpercaya seputar isu terkini Indonesia.');

  const joinedDate = isAdminProfile ? 'Januari 2024' : (foundUser?.joinedDate || '2026');

  // Follow & Profile Likes Handler setup
  const authorKey = foundUser?.id || authorId || createSlug(displayName || 'author');

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [hasProfileLiked, setHasProfileLiked] = useState(false);
  const [profileLikesCount, setProfileLikesCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const followedList = getFollowedAuthors();
    const likedList = getLikedProfiles();

    const isFol = followedList.includes(authorKey);
    const isLik = likedList.includes(authorKey);

    setIsFollowing(isFol);
    setHasProfileLiked(isLik);

    const baseFollowers = foundUser?.followersCount ?? (isAdminProfile ? 1250 : 0);
    const baseLikes = foundUser?.profileLikesCount ?? (isAdminProfile ? 890 : 0);

    setFollowersCount(baseFollowers + (isFol ? 1 : 0));
    setProfileLikesCount(baseLikes + (isLik ? 1 : 0));
  }, [authorKey, foundUser, isAdminProfile]);

  const handleToggleFollow = async () => {
    const { isFollowing: nextFollowing } = toggleFollowAuthor(authorKey);
    setIsFollowing(nextFollowing);
    const newCount = nextFollowing ? followersCount + 1 : Math.max(0, followersCount - 1);
    setFollowersCount(newCount);
    
    if (foundUser?.id) {
      await updateUserInFirestore(foundUser.id, { followersCount: newCount }).catch(() => {});
    }

    setToastMessage(nextFollowing ? `Berhasil mengikuti ${displayName}! ✨` : `Batal mengikuti ${displayName}.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleProfileLike = async () => {
    const { hasLiked: nextLiked } = toggleProfileLike(authorKey);
    setHasProfileLiked(nextLiked);
    const newCount = nextLiked ? profileLikesCount + 1 : Math.max(0, profileLikesCount - 1);
    setProfileLikesCount(newCount);

    if (foundUser?.id) {
      await updateUserInFirestore(foundUser.id, { profileLikesCount: newCount }).catch(() => {});
    }

    setToastMessage(nextLiked ? `Apresiasi profil dikirim untuk ${displayName}! ❤️` : `Batal menyukai profil.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShareProfile = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage('Tautan profil berhasil disalin ke papan klip!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      setToastMessage('Gagal menyalin tautan.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Dynamic SEO Meta Tags Sync for Author Profile
  useEffect(() => {
    updateArticleSEO(
      null,
      'Semua',
      'author-profile',
      displayName,
      foundUser || { 
        id: authorId || '', 
        name: displayName, 
        email: '', 
        role: (displayRole as UserRole) || 'author', 
        avatar: displayAvatar, 
        bio: displayBio, 
        joinedDate: joinedDate 
      },
      publishedArticles.length,
      allAuthorArticles
    );
  }, [displayName, foundUser, displayBio, publishedArticles.length]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-extrabold uppercase border border-blue-200 dark:border-blue-800">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Pemimpin Redaksi / Admin
          </span>
        );
      case 'editor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-extrabold uppercase border border-amber-200 dark:border-amber-800">
            <Edit3 className="w-3.5 h-3.5 text-amber-600" />
            Redaktur / Editor
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-xs font-bold text-slate-800 dark:text-slate-200 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Berita Utama</span>
        </button>

        <span className="text-xs font-bold text-slate-400">
          Profil Penulis SGA
        </span>
      </div>

      {/* Author Profile Header Card - SlideShare Layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          
          {/* Author Avatar */}
          <div className="relative shrink-0 group">
            <img 
              src={displayAvatar} 
              alt={displayName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-xl" 
            />
            <span className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-md">
              <Award className="w-4 h-4" />
            </span>

            {/* Edit Photo Button */}
            {onOpenEditProfile && (currentUser?.id === foundUser?.id || currentUser?.name === displayName || currentUser?.role === 'admin') && (
              <button
                onClick={onOpenEditProfile}
                title="Ubah Foto Profil Akun"
                className="absolute top-1 right-1 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg shadow-lg backdrop-blur-sm transition flex items-center gap-1 text-[10px] font-bold"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Author Info & Bio */}
          <div className="space-y-3.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{displayName}</span>
                {isUserAdminOrVerified(displayRole, displayName, foundUser?.isVerified ?? firstArticle?.isVerified) && <VerifiedBadge size="md" title="Akun Admin / Redaksi SGA Terverifikasi" />}
              </h1>
              {getRoleBadge(displayRole)}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl whitespace-pre-line">
              {displayBio}
            </p>

            {/* Comprehensive Stats Bar: Followers, Likes, Articles, Views */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 max-w-xl">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-center sm:text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Users className="w-3 h-3 text-blue-500" /> Pengikut
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  {followersCount.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-center sm:text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Heart className="w-3 h-3 text-rose-500" /> Apresiasi
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  {profileLikesCount.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-center sm:text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <BookOpen className="w-3 h-3 text-emerald-500" /> Karya Tulis
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  {allAuthorArticles.length} Artikel
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-center sm:text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Eye className="w-3 h-3 text-amber-500" /> Total Pembaca
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">
                  {totalViews.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Interactive Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
              {/* Follow / Ikuti Button */}
              <button
                onClick={handleToggleFollow}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 ${
                  isFollowing
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Mengikuti</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>+ Ikuti Penulis</span>
                  </>
                )}
              </button>

              {/* Apresiasi / Suka Profil Button */}
              <button
                onClick={handleToggleProfileLike}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition active:scale-95 flex items-center gap-1.5 ${
                  hasProfileLiked
                    ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                }`}
              >
                <Heart className={`w-4 h-4 ${hasProfileLiked ? 'fill-white' : ''}`} />
                <span>{hasProfileLiked ? `Apresiasi (${profileLikesCount})` : `Suka Profil (${profileLikesCount})`}</span>
              </button>

              {/* Bagikan / Share Button */}
              <button
                onClick={handleShareProfile}
                title="Bagikan Tautan Profil"
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition active:scale-95 flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan</span>
              </button>

              {/* Edit Profil Button (if owner or admin) */}
              {onOpenEditProfile && (currentUser?.id === foundUser?.id || currentUser?.name === displayName || currentUser?.role === 'admin') && (
                <button
                  onClick={onOpenEditProfile}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Bio & Profil</span>
                </button>
              )}

              {/* About Tab Toggle */}
              <button
                onClick={() => setActiveMainTab(activeMainTab === 'about' ? 'articles' : 'about')}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition active:scale-95 flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>About / Tentang</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SlideShare Style Tab Navigation Strip */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 sm:px-4">
        <div className="flex items-center gap-1 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth text-xs font-bold text-slate-500 dark:text-slate-400">
          <button
            onClick={() => setActiveMainTab('articles')}
            className={`py-3.5 px-2 border-b-2 transition whitespace-nowrap ${
              activeMainTab === 'articles'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Artikel ({allAuthorArticles.length})
          </button>

          <button
            onClick={() => setActiveMainTab('likes')}
            className={`py-3.5 px-2 border-b-2 transition whitespace-nowrap ${
              activeMainTab === 'likes'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Disukai ({bookmarkedIds.length})
          </button>

          <button
            onClick={() => setActiveMainTab('about')}
            className={`py-3.5 px-2 border-b-2 transition whitespace-nowrap ${
              activeMainTab === 'about'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tentang / Bio
          </button>
        </div>
      </div>

      {/* Main Tab View Content */}
      {activeMainTab === 'about' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Tentang {displayName}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Biografi resmi dan profil kontributor SGA News
              </p>
            </div>

            {onOpenEditProfile && (currentUser?.id === foundUser?.id || currentUser?.name === displayName || currentUser?.role === 'admin') && (
              <button
                onClick={onOpenEditProfile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Bio & Profil</span>
              </button>
            )}
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-line">
              {displayBio}
            </p>
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Tanggal Bergabung</span>
              <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">{joinedDate}</span>
            </div>
            {isAdminProfile && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Peran Redaksi</span>
                <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">{displayRole.toUpperCase()}</span>
              </div>
            )}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Karya Tulis</span>
              <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">{allAuthorArticles.length} Artikel</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Pembaca</span>
              <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm">{totalViews.toLocaleString('id-ID')} views</span>
            </div>
          </div>
        </div>
      ) : activeMainTab === 'likes' ? (
        <div className="space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Artikel Disukai / Tersimpan</h3>
          {allArticles.filter(a => bookmarkedIds.includes(a.id)).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-500">
              Belum ada artikel tersimpan.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allArticles.filter(a => bookmarkedIds.includes(a.id)).map(article => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onSelectArticle={onSelectArticle}
                  onToggleBookmark={onToggleBookmark}
                  isBookmarked={true}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ARTICLES TAB */
        <div className="space-y-6">
          {/* Secondary Filter & Sorting Control Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
            
            {/* Sort Filter Pills (Terbaru vs Terpopuler) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortFilter('latest')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  sortFilter === 'latest'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Terbaru (Latest)
              </button>

              <button
                onClick={() => setSortFilter('popular')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  sortFilter === 'popular'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Terpopuler (Most Popular)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari artikel..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Status Filter Tabs (Visible if Owner or Admin) */}
          {isOwnerOrAdmin && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedStatusTab('semua')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedStatusTab === 'semua'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Semua Status ({allAuthorArticles.length})
              </button>

              <button
                onClick={() => setSelectedStatusTab('published')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedStatusTab === 'published'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Diterbitkan ({publishedArticles.length})
              </button>

              {pendingCount > 0 && (
                <button
                  onClick={() => setSelectedStatusTab('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedStatusTab === 'pending'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Menunggu Review ({pendingCount})
                </button>
              )}

              {draftCount > 0 && (
                <button
                  onClick={() => setSelectedStatusTab('draft')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedStatusTab === 'draft'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Draf ({draftCount})
                </button>
              )}

              {rejectedCount > 0 && (
                <button
                  onClick={() => setSelectedStatusTab('rejected')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selectedStatusTab === 'rejected'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  Perlu Revisi ({rejectedCount})
                </button>
              )}
            </div>
          )}

          {/* Articles Grid */}
          {sortedArticles.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Tidak ada artikel yang ditemukan
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery ? `Tidak ada hasil untuk kata kunci "${searchQuery}".` : 'Penulis ini belum memiliki publikasi di kategori status ini.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedArticles.map((article) => {
                const canEditThisArticle = isOwnerOrAdmin || (currentUser && (currentUser.id === article.authorId || currentUser.name.toLowerCase() === article.authorName.toLowerCase()));

                const renderStatusBadge = (st: ArticleStatus) => {
                  switch (st) {
                    case 'published':
                      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold uppercase shadow-sm"><CheckCircle2 className="w-3 h-3" /> Diterbitkan</span>;
                    case 'pending':
                      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold uppercase shadow-sm"><Clock className="w-3 h-3" /> Menunggu Review</span>;
                    case 'draft':
                      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-600 text-white text-[10px] font-extrabold uppercase shadow-sm"><FileText className="w-3 h-3" /> Draf</span>;
                    case 'rejected':
                      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase shadow-sm"><AlertCircle className="w-3 h-3" /> Perlu Revisi</span>;
                  }
                };

                return (
                  <div key={article.id} className="relative flex flex-col h-full group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-1">
                    <div className="flex-1">
                      <ArticleCard
                        article={article}
                        onSelectArticle={onSelectArticle}
                        onToggleBookmark={onToggleBookmark}
                        isBookmarked={bookmarkedIds.includes(article.id)}
                      />
                    </div>

                    {/* Status Overlay Badge & Edit Button Bar */}
                    <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        {renderStatusBadge(article.status)}
                      </div>

                      {/* EDIT ARTIKEL BUTTON */}
                      {canEditThisArticle && onEditArticle && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditArticle(article);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Artikel</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900/95 text-white text-xs font-bold rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
