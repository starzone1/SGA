import React from 'react';
import { Article } from '../types';
import { VerifiedBadge, isUserAdminOrVerified } from './VerifiedBadge';
import { Clock, Eye, Flame, ChevronRight, Bookmark } from 'lucide-react';
import { getOptimizedImageUrl } from '../utils/image';

interface HeroHeadlineProps {
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onToggleBookmark: (articleId: string) => void;
  bookmarkedIds: string[];
  onSelectAuthor?: (authorId: string, authorName: string) => void;
}

export const HeroHeadline: React.FC<HeroHeadlineProps> = ({
  articles,
  onSelectArticle,
  onToggleBookmark,
  bookmarkedIds,
  onSelectAuthor
}) => {
  const published = articles.filter(a => a.status === 'published');
  
  // Find primary featured/breaking
  const mainArticle = published.find(a => a.isBreaking || a.isFeatured) || published[0];
  const secondaryArticles = published.filter(a => a.id !== mainArticle?.id).slice(0, 2);
  const trendingList = published.filter(a => a.id !== mainArticle?.id && !secondaryArticles.some(s => s.id === a.id)).slice(0, 4);

  if (!mainArticle) return null;

  return (
    <section className="mb-8 sm:mb-10">
      
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2.5 mb-4 sm:mb-5 border-b-2 border-blue-600 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-5 sm:w-2.5 sm:h-6 bg-blue-600 rounded-sm"></span>
          <h2 className="text-sm sm:text-xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white font-sans">
            BERITA UTAMA
          </h2>
        </div>
        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          Redaksi Terkini
        </span>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Main Big Feature Article (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col group cursor-pointer">
          <div 
            onClick={() => onSelectArticle(mainArticle)}
            className="relative overflow-hidden rounded-2xl aspect-[16/10] bg-slate-900 shadow-xl"
          >
            <img 
              src={getOptimizedImageUrl(mainArticle.coverImage, 900, 80)} 
              alt={mainArticle.title}
              fetchPriority="high"
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
            
            {/* Category & Badges */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-blue-600 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-md shadow-md">
                {mainArticle.category}
              </span>
              {mainArticle.isBreaking && (
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500 text-slate-950 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-md animate-pulse">
                  <Flame className="w-3 h-3 fill-slate-950" />
                  BREAKING NEWS
                </span>
              )}
            </div>

            {/* Bookmark button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(mainArticle.id);
              }}
              aria-label="Simpan Berita Utama"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-2.5 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-blue-600 transition"
            >
              <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${bookmarkedIds.includes(mainArticle.id) ? 'fill-white' : ''}`} />
            </button>

            {/* Bottom Overlay Text */}
            <div className="absolute bottom-0 inset-x-0 p-3.5 sm:p-7 space-y-1.5 sm:space-y-2">
              <h3 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white leading-snug sm:leading-tight font-sans group-hover:text-blue-400 transition-colors line-clamp-2 sm:line-clamp-none">
                {mainArticle.title}
              </h3>
              <p className="text-[11px] sm:text-sm text-slate-300 line-clamp-2 leading-relaxed font-normal">
                {mainArticle.excerpt}
              </p>
              
              <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-[11px] text-slate-400 font-medium">
                <span 
                  onClick={(e) => {
                    if (onSelectAuthor) {
                      e.stopPropagation();
                      onSelectAuthor(mainArticle.authorId, mainArticle.authorName);
                    }
                  }}
                  className={`text-slate-200 font-semibold inline-flex items-center gap-1 ${onSelectAuthor ? 'hover:text-blue-400 hover:underline cursor-pointer' : ''}`}
                >
                  <span>{mainArticle.authorName}</span>
                  {isUserAdminOrVerified(mainArticle.authorRole, mainArticle.authorName, mainArticle.isVerified) && <VerifiedBadge size="xs" />}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(mainArticle.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {mainArticle.views} Dibaca
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Featured Articles (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {secondaryArticles.map((article) => (
            <div 
              key={article.id}
              onClick={() => onSelectArticle(article)}
              className="group cursor-pointer p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition flex gap-3 sm:gap-4 items-center"
            >
              <div className="relative w-32 sm:w-36 aspect-[4/3] rounded-xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800">
                <img 
                  src={getOptimizedImageUrl(article.coverImage, 400, 75)} 
                  alt={article.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase rounded">
                  {article.category}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                  {article.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium pt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                    <span>{article.authorName}</span>
                    {isUserAdminOrVerified(article.authorRole, article.authorName, article.isVerified) && <VerifiedBadge size="xs" />}
                  </span>
                  <span>•</span>
                  <span>{new Date(article.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Quick Trending List */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center justify-between">
              <span>TERPOPULER MINGGU INI</span>
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            </h5>
            
            <div className="space-y-2.5">
              {trendingList.map((item, idx) => (
                <div 
                  key={item.id}
                  onClick={() => onSelectArticle(item)}
                  className="group cursor-pointer flex items-start gap-3 text-xs"
                >
                  <span className="font-black text-blue-600 text-base leading-none">
                    0{idx + 1}
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
