import React from 'react';
import { Article } from '../types';
import { X, Bookmark, Trash2, ArrowRight } from 'lucide-react';

interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarkedArticles: Article[];
  onSelectArticle: (article: Article) => void;
  onRemoveBookmark: (articleId: string) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  bookmarkedArticles,
  onSelectArticle,
  onRemoveBookmark
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-blue-600 fill-blue-600" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Berita Tersimpan ({bookmarkedArticles.length})
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Articles List */}
          <div className="mt-4 space-y-3">
            {bookmarkedArticles.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Bookmark className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-medium">Belum ada berita tersimpan.</p>
                <p className="text-[10px] text-slate-500">Klik ikon pita bookmark pada artikel berita untuk menyimpannya di sini.</p>
              </div>
            ) : (
              bookmarkedArticles.map((art) => (
                <div 
                  key={art.id}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex gap-3 items-center group"
                >
                  <img 
                    src={art.coverImage} 
                    alt={art.title} 
                    className="w-16 h-16 rounded-lg object-cover shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-blue-600 uppercase">
                      {art.category}
                    </span>
                    <h4 
                      onClick={() => {
                        onSelectArticle(art);
                        onClose();
                      }}
                      className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 cursor-pointer hover:text-blue-600 transition"
                    >
                      {art.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => onRemoveBookmark(art.id)}
                    className="p-1 text-slate-400 hover:text-blue-600 transition"
                    title="Hapus Simpanan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl"
          >
            Tutup Daftar Simpanan
          </button>
        </div>

      </div>
    </div>
  );
};
