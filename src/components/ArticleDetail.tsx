import React, { useState, useEffect } from 'react';
import { Article, User, ArticleComment } from '../types';
import { VerifiedBadge, isUserAdminOrVerified, getAuthorAvatar } from './VerifiedBadge';
import { 
  ArrowLeft, 
  ArrowUp,
  Clock, 
  Eye, 
  Bookmark, 
  Share2, 
  Sparkles, 
  ThumbsUp, 
  Heart, 
  Smile, 
  MessageSquare, 
  Send, 
  Check, 
  Copy,
  BookOpen
} from 'lucide-react';
import { 
  subscribeToArticleComments, 
  addCommentToFirestore, 
  toggleArticleLikeInFirestore, 
  addArticleReactionInFirestore, 
  incrementArticleViewsInFirestore 
} from '../services/firestoreService';
import { summarizeArticleText } from '../services/gemini';
import { GoogleAdUnit } from './GoogleAdUnit';
import { getNewsArticleJsonLd } from '../utils/seo';
import { useNewsArticleJsonLd } from '../hooks/useNewsArticleJsonLd';

interface ArticleDetailProps {
  article: Article;
  currentUser: User | null;
  onBack: () => void;
  onToggleBookmark: (id: string) => void;
  isBookmarked: boolean;
  onSelectArticle: (article: Article) => void;
  allArticles: Article[];
  onSelectAuthor?: (authorId: string, authorName: string) => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({
  article,
  currentUser,
  onBack,
  onToggleBookmark,
  isBookmarked,
  onSelectArticle,
  allArticles,
  onSelectAuthor
}) => {
  // Dynamically inject & update Google-compliant NewsArticle JSON-LD structured data into document.head
  useNewsArticleJsonLd(article);

  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // AI summary
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Likes & reactions
  const [likesCount, setLikesCount] = useState(article.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [currentReactions, setCurrentReactions] = useState(
    article.reactions || { suka: 0, inspiratif: 0, haru: 0, kaget: 0 }
  );

  // Floating Back to Top scroll listener (appears after 500px scroll)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // Increment view count once on mount in Firestore
    incrementArticleViewsInFirestore(article.id);
    
    // Subscribe to real-time comments from Firestore
    const unsubscribeComments = subscribeToArticleComments(article.id, (realtimeComments) => {
      setComments(realtimeComments);
    });
    
    // Reset state for new article
    setLikesCount(article.likes || 0);
    setCurrentReactions(article.reactions || { suka: 0, inspiratif: 0, haru: 0, kaget: 0 });
    setAiSummary(null);

    return () => {
      unsubscribeComments();
    };
  }, [article.id]);

  useEffect(() => {
    setLikesCount(article.likes || 0);
    setCurrentReactions(article.reactions || { suka: 0, inspiratif: 0, haru: 0, kaget: 0 });
  }, [article.likes, article.reactions]);

  const handleLike = () => {
    const nextLiked = !hasLiked;
    setHasLiked(nextLiked);
    toggleArticleLikeInFirestore(article.id, hasLiked);
  };

  const handleAddReaction = (type: 'suka' | 'inspiratif' | 'haru' | 'kaget') => {
    setCurrentReactions(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));
    addArticleReactionInFirestore(article.id, type);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    
    const text = newCommentText.trim();
    setNewCommentText('');
    await addCommentToFirestore(article.id, text, currentUser);
  };

  const handleGenerateSummary = async () => {
    setLoadingAi(true);
    const summary = await summarizeArticleText(article.content);
    setAiSummary(summary);
    setLoadingAi(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Baca berita terbaru di SGA News: "${article.title}"\n${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Baca berita terbaru di SGA News: "${article.title}"`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  // Related articles in same category safely
  const related = (allArticles || [])
    .filter(a => a && a.id !== article.id && a.category === article.category && a.status === 'published')
    .slice(0, 3);

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm leading-relaxed';
      case 'lg': return 'text-lg leading-relaxed';
      case 'xl': return 'text-xl leading-relaxed';
      default: return 'text-base leading-relaxed';
    }
  };

  const jsonLdString = React.useMemo(() => {
    try {
      return JSON.stringify(getNewsArticleJsonLd(article));
    } catch (e) {
      return '';
    }
  }, [article]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Google Search Central Compliant NewsArticle JSON-LD Structured Data */}
      {jsonLdString && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdString
          }}
        />
      )}
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-xs font-bold text-slate-800 dark:text-slate-200 transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Kembali ke Berita Utama</span>
          <span className="sm:hidden">Kembali</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Font Size Adjuster */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 sm:p-1 border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setFontSize('sm')} 
              className={`px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-full ${fontSize === 'sm' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
            >
              A-
            </button>
            <button 
              onClick={() => setFontSize('base')} 
              className={`px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-full ${fontSize === 'base' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
            >
              A
            </button>
            <button 
              onClick={() => setFontSize('lg')} 
              className={`px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-full ${fontSize === 'lg' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
            >
              A+
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => onToggleBookmark(article.id)}
            aria-label="Simpan Berita"
            className={`p-1.5 sm:p-2 rounded-full border transition shrink-0 ${
              isBookmarked
                ? 'bg-blue-600 text-white border-blue-600 shadow'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white' : ''}`} />
          </button>
        </div>
      </div>

      {/* Article Header Header */}
      <div className="space-y-4">
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black uppercase tracking-wider rounded-md shadow">
            {article.category}
          </span>
          {article.isBreaking && (
            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-bold uppercase rounded-md">
              BREAKING
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight font-sans">
          {article.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic border-l-2 border-blue-600 pl-3">
          {article.excerpt}
        </p>

        {/* Author & Publication Meta */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200 dark:border-slate-800">
          <div 
            onClick={() => {
              if (onSelectAuthor) {
                onSelectAuthor(article.authorId, article.authorName);
              }
            }}
            className={`flex items-center gap-3 ${onSelectAuthor ? 'cursor-pointer group/author' : ''}`}
          >
            <img 
              src={getAuthorAvatar(article.authorAvatar, article.authorRole, article.authorName)} 
              alt={article.authorName}
              className="w-11 h-11 rounded-full object-cover border-2 border-blue-600 group-hover/author:scale-105 transition-transform" 
            />
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm group-hover/author:text-blue-600 dark:group-hover/author:text-blue-400 transition-colors flex items-center gap-1.5">
                <span>{article.authorName}</span>
                {isUserAdminOrVerified(article.authorRole, article.authorName, article.isVerified) && <VerifiedBadge size="sm" />}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                {article.authorRole || 'Jurnalis SGA News'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(article.createdAt).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {article.views} Dibaca
            </span>
          </div>
        </div>

      </div>

      {/* Cover Image */}
      <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
        <img 
          src={article.coverImage} 
          alt={article.title}
          className="w-full max-h-[480px] object-cover" 
        />
        <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
          Dokumentasi SGA News Media • Foto Utama Berita Kebangsaan
        </div>
      </div>

      {/* Main Formatted Article Content */}
      <div 
        className={`prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 ${getFontSizeClass()} space-y-4`}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* In-Article Google AdSense Unit */}
      <GoogleAdUnit position="in-article" />

      {/* Tags Badges */}
      {article.tags && article.tags.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Topik Terkait:</span>
          {article.tags.map(t => (
            <span key={t} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Compact Interactive Reactions & Share Bar */}
      <div className="py-3 px-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Reactions Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1 text-[11px] uppercase tracking-wider">Reaksi:</span>
          
          <button
            onClick={() => handleAddReaction('suka')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-full border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium active:scale-95"
            title="Suka"
          >
            <span>👍</span>
            <span className="text-slate-500 dark:text-slate-400">Suka</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{currentReactions.suka}</span>
          </button>

          <button
            onClick={() => handleAddReaction('inspiratif')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-full border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium active:scale-95"
            title="Inspiratif"
          >
            <span>💡</span>
            <span className="text-slate-500 dark:text-slate-400">Inspiratif</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{currentReactions.inspiratif}</span>
          </button>

          <button
            onClick={() => handleAddReaction('haru')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 rounded-full border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium active:scale-95"
            title="Haru"
          >
            <span>🥹</span>
            <span className="text-slate-500 dark:text-slate-400">Haru</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{currentReactions.haru}</span>
          </button>

          <button
            onClick={() => handleAddReaction('kaget')}
            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-full border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium active:scale-95"
            title="Kaget"
          >
            <span>😲</span>
            <span className="text-slate-500 dark:text-slate-400">Kaget</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{currentReactions.kaget}</span>
          </button>
        </div>

        {/* Share Buttons Row */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1 text-[11px] uppercase tracking-wider hidden sm:inline">Bagikan:</span>
          
          <button
            onClick={handleShareWhatsApp}
            title="Bagikan ke WhatsApp"
            className="p-1.5 sm:px-2.5 sm:py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </button>

          <button
            onClick={handleShareTwitter}
            title="Bagikan ke Twitter / X"
            className="p-1.5 sm:px-2.5 sm:py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border border-slate-800 dark:border-slate-700 shadow-xs"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span className="hidden sm:inline">Twitter / X</span>
          </button>

          <button
            onClick={handleShareLinkedIn}
            title="Bagikan ke LinkedIn"
            className="p-1.5 sm:px-2.5 sm:py-1 bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
            </svg>
            <span className="hidden sm:inline">LinkedIn</span>
          </button>

          <button
            onClick={handleShareFacebook}
            title="Bagikan ke Facebook"
            className="p-1.5 sm:px-2.5 sm:py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="hidden sm:inline">Facebook</span>
          </button>

          <button
            onClick={handleCopyLink}
            title="Salin Tautan Berita"
            className="p-1.5 sm:px-2.5 sm:py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      {/* Author Bio Box */}
      <div className="p-6 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-4">
        <img 
          src={getAuthorAvatar(article.authorAvatar, article.authorRole, article.authorName)} 
          alt={article.authorName}
          className="w-14 h-14 rounded-full object-cover border-2 border-blue-600 shrink-0" 
        />
        <div className="space-y-1">
          <div className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <span>{article.authorName}</span>
            {isUserAdminOrVerified(article.authorRole, article.authorName, article.isVerified) && <VerifiedBadge size="sm" />}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {article.authorRole || 'Jurnalis / Kontributor Komunitas SGA Media.'} Penulis aktif yang berkomitmen menyampaikan warta obyektif, bermanfaat, dan mencerahkan publik.
          </p>
        </div>
      </div>

      {/* Comment Section */}
      <section className="pt-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-600">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg uppercase tracking-tight font-sans">
            KOLOM DISKUSI & KOMENTAR ({comments.length})
          </h3>
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <img 
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} 
              alt={currentUser?.name || "Pembaca"}
              className="w-8 h-8 rounded-full object-cover border" 
            />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white">{currentUser?.name || "Pembaca Komunitas"}</span>
              <span className="text-slate-400 font-normal"> ({currentUser ? currentUser.role.toUpperCase() : 'TAMU'})</span>
            </div>
          </div>

          <textarea
            rows={3}
            required
            placeholder="Tulis tanggapan atau komentar Anda dengan santun..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim Komentar
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
              Belum ada komentar. Jadilah pembaca pertama yang memberikan tanggapan!
            </p>
          ) : (
            comments.map((comm) => (
              <div 
                key={comm.id}
                className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={getAuthorAvatar(comm.authorAvatar, comm.authorRole, comm.authorName)} 
                      alt={comm.authorName}
                      className="w-7 h-7 rounded-full object-cover" 
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                        <span>{comm.authorName}</span>
                        {isUserAdminOrVerified(comm.authorRole, comm.authorName) && <VerifiedBadge size="xs" />}
                        {comm.authorRole && (
                          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-semibold rounded">
                            {comm.authorRole}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(comm.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-9">
                  {comm.content}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related News Section */}
      {related.length > 0 && (
        <section className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg uppercase tracking-tight font-sans">
            BERITA TERKAIT KATEGORI {article.category.toUpperCase()}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map(rel => (
              <div
                key={rel.id}
                onClick={() => onSelectArticle(rel)}
                className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <img 
                  src={rel.coverImage} 
                  alt={rel.title}
                  className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform" 
                />
                <div className="p-3 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 group-hover:text-blue-600 transition">
                    {rel.title}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {new Date(rel.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Kembali ke Atas"
          title="Kembali ke Atas"
          className="fixed bottom-6 right-6 z-50 p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-white dark:border-slate-800 flex items-center justify-center group"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

    </div>
  );
};
