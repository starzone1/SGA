import React from 'react';
import { Article } from '../types';
import { Clock, Eye, Bookmark, Share2 } from 'lucide-react';
import { VerifiedBadge, isUserAdminOrVerified, getAuthorAvatar } from './VerifiedBadge';
import { getOptimizedImageUrl } from '../utils/image';

interface ArticleCardProps {
  article: Article;
  onSelectArticle: (article: Article) => void;
  onToggleBookmark: (articleId: string) => void;
  isBookmarked: boolean;
  onSelectAuthor?: (authorId: string, authorName: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelectArticle,
  onToggleBookmark,
  isBookmarked,
  onSelectAuthor
}) => {
  return (
    <article 
      onClick={() => onSelectArticle(article)}
      className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex flex-col h-full"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        <img 
          src={getOptimizedImageUrl(article.coverImage, 500, 75)} 
          alt={article.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        
        {/* Category Tag */}
        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm">
          {article.category}
        </span>

        {/* Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(article.id);
          }}
          aria-label="Simpan Berita"
          className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${
            isBookmarked
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-black/40 text-white hover:bg-blue-600'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Article Info */}
      <div className="p-3 sm:p-5 flex flex-col flex-1 justify-between space-y-2.5">
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {article.title}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal">
            {article.excerpt}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
          <div 
            onClick={(e) => {
              if (onSelectAuthor) {
                e.stopPropagation();
                onSelectAuthor(article.authorId, article.authorName);
              }
            }}
            className={`flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0 ${onSelectAuthor ? 'hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer group/author' : ''}`}
          >
            <img 
              src={getOptimizedImageUrl(getAuthorAvatar(article.authorAvatar, article.authorRole, article.authorName), 80, 75)} 
              alt={article.authorName}
              loading="lazy"
              decoding="async"
              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover shrink-0" 
            />
            <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover/author:text-blue-600 dark:group-hover/author:text-blue-400 truncate max-w-[80px] sm:max-w-[110px] transition-colors flex items-center gap-1">
              <span className="truncate">{article.authorName}</span>
              {isUserAdminOrVerified(article.authorRole, article.authorName, article.isVerified) && <VerifiedBadge size="xs" />}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] shrink-0 text-slate-400">
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {new Date(article.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-0.5 sm:gap-1">
              <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {article.views}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
