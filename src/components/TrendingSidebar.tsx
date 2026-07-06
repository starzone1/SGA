import React, { useState } from 'react';
import { Article } from '../types';
import { Flame, Bookmark, Eye, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { VerifiedBadge, isUserAdminOrVerified } from './VerifiedBadge';
import { NewsletterSubscription } from './NewsletterSubscription';
import { GoogleAdUnit } from './GoogleAdUnit';

interface TrendingSidebarProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onToggleBookmark: (articleId: string) => void;
  bookmarkedIds: string[];
  onSelectAuthor?: (authorId: string, authorName: string) => void;
}

export const TrendingSidebar: React.FC<TrendingSidebarProps> = ({
  articles,
  onSelectArticle,
  onToggleBookmark,
  bookmarkedIds,
  onSelectAuthor
}) => {
  const [filterType, setFilterType] = useState<'views' | 'bookmarks'>('views');

  // Helper for relative time (e.g., "2 hari lalu")
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Kemarin';
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // 1. Filter articles published in the last 7 days
  const nowMs = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const published = articles.filter(a => a.status === 'published' || !a.status);
  
  const recent7DaysArticles = published.filter(a => {
    const articleTime = new Date(a.publishedAt || a.createdAt).getTime();
    return (nowMs - articleTime) <= SEVEN_DAYS_MS;
  });

  // Use recent 7 days pool if we have at least 3 articles, otherwise fallback to all published
  const sourcePool = recent7DaysArticles.length >= 3 ? recent7DaysArticles : published;

  // 2. Sort depending on filter: 'views' (Most Viewed) vs 'bookmarks' (Most Bookmarked)
  const sortedArticles = [...sourcePool].sort((a, b) => {
    if (filterType === 'bookmarks') {
      const aIsBM = bookmarkedIds.includes(a.id) ? 1000 : 0;
      const bIsBM = bookmarkedIds.includes(b.id) ? 1000 : 0;
      const scoreA = aIsBM + (a.likes || 0) * 10 + (a.views || 0);
      const scoreB = bIsBM + (b.likes || 0) * 10 + (b.views || 0);
      return scoreB - scoreA;
    } else {
      // Views primary
      return (b.views || 0) - (a.views || 0);
    }
  }).slice(0, 5);

  return (
    <aside className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 font-sans transition-colors">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md shadow-orange-500/20">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h3 className="text-base font-extrabold uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Trending Sekarang
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Populer 7 Hari Terakhir
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-300/50 dark:border-amber-700/50">
          7 Hari
        </span>
      </div>

      {/* Tabs Filter */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
        <button
          onClick={() => setFilterType('views')}
          className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            filterType === 'views'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Banyak Dibaca</span>
        </button>

        <button
          onClick={() => setFilterType('bookmarks')}
          className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            filterType === 'bookmarks'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Banyak Disimpan</span>
        </button>
      </div>

      {/* Trending Items List */}
      <div className="space-y-3.5 pt-1">
        {sortedArticles.map((art, index) => {
          const isTop3 = index < 3;
          const isBookmarked = bookmarkedIds.includes(art.id);

          return (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group cursor-pointer p-2.5 -mx-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-start gap-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
            >
              {/* Rank Number Badge */}
              <div className="flex shrink-0 items-center justify-center">
                <span
                  className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
                    index === 0
                      ? 'bg-amber-500 text-white shadow-amber-500/30'
                      : index === 1
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100'
                      : index === 2
                      ? 'bg-amber-700 text-amber-100'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {index + 1}
                </span>
              </div>

              {/* Text & Metadata */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {art.category}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {getRelativeTime(art.publishedAt || art.createdAt)}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {art.title}
                </h4>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5 min-w-0 truncate">
                    <span 
                      onClick={(e) => {
                        if (onSelectAuthor) {
                          e.stopPropagation();
                          onSelectAuthor(art.authorId, art.authorName);
                        }
                      }}
                      className={`inline-flex items-center gap-1 font-semibold truncate ${onSelectAuthor ? 'hover:text-blue-600 hover:underline cursor-pointer' : ''}`}
                    >
                      <span className="truncate">{art.authorName}</span>
                      {isUserAdminOrVerified(art.authorRole, art.authorName, art.isVerified) && <VerifiedBadge size="xs" />}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 shrink-0">
                      <Eye className="w-3 h-3 text-slate-400" />
                      <span>{art.views.toLocaleString('id-ID')}</span>
                    </span>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(art.id);
                    }}
                    title={isBookmarked ? 'Hapus Simpan' : 'Simpan Artikel'}
                    className={`p-1 rounded-md transition ${
                      isBookmarked
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                        : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Cover Image Thumbnail */}
              <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 shadow-xs">
                <img
                  src={art.coverImage}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Widget Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-medium text-slate-500 pb-1">
        <span className="flex items-center gap-1 text-[11px]">
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          Dilepas berdasarkan interaksi pembaca
        </span>
      </div>

      {/* Newsletter Subscription Widget */}
      <div className="pt-2">
        <NewsletterSubscription />
      </div>

      {/* Google AdSense Sidebar Unit */}
      <div className="pt-2">
        <GoogleAdUnit position="sidebar" />
      </div>

    </aside>
  );
};
