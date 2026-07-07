import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Article, Category, User } from './types';
import { getCurrentUser, getStoredUsers, getBookmarks, toggleBookmark, OFFICIAL_ADMIN_USER, setCurrentUser as setStoredCurrentUser } from './utils/storage';
import { INITIAL_USERS, INITIAL_ARTICLES } from './data/initialData';
import { subscribeToArticles, subscribeToUsers } from './services/firestoreService';
import { updateArticleSEO } from './utils/seo';
import { isUserAdminOrVerified } from './components/VerifiedBadge';
import { Navbar } from './components/Navbar';
import { HeroHeadline } from './components/HeroHeadline';
import { TrendingSidebar } from './components/TrendingSidebar';
import { ArticleCard } from './components/ArticleCard';
import { ArticleDetail } from './components/ArticleDetail';
import { AuthorProfile } from './components/AuthorProfile';
import { Footer } from './components/Footer';
import { GoogleAdUnit } from './components/GoogleAdUnit';
import { RedaksiPortal } from './components/RedaksiPortal';
import { Search } from 'lucide-react';

// Lazy load heavy CMS Dashboards & Modals to optimize initial bundle size & PageSpeed
const AuthorDashboard = lazy(() => import('./components/AuthorDashboard').then(m => ({ default: m.AuthorDashboard })));
const EditorDashboard = lazy(() => import('./components/EditorDashboard').then(m => ({ default: m.EditorDashboard })));
const LegalModal = lazy(() => import('./components/LegalModal').then(m => ({ default: m.LegalModal })));
const EditProfileModal = lazy(() => import('./components/EditProfileModal').then(m => ({ default: m.EditProfileModal })));
const EditArticleModal = lazy(() => import('./components/EditArticleModal').then(m => ({ default: m.EditArticleModal })));
const BookmarksDrawer = lazy(() => import('./components/BookmarksDrawer').then(m => ({ default: m.BookmarksDrawer })));
const SitemapModal = lazy(() => import('./components/SitemapModal').then(m => ({ default: m.SitemapModal })));

export default function App() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Semua'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  
  // Views
  const [activeView, setActiveView] = useState<'home' | 'detail' | 'author-cms' | 'editor-cms' | 'author-profile' | 'redaksi-portal'>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [selectedAuthorName, setSelectedAuthorName] = useState<string | null>(null);

  // Modals & Drawers
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [bookmarksDrawerOpen, setBookmarksDrawerOpen] = useState(false);
  const [editArticleModalOpen, setEditArticleModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [sitemapModalOpen, setSitemapModalOpen] = useState(false);

  // Helper to generate clean SEO-friendly URL slugs without %20 or special chars
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

  // Helper to resolve current URL path to appropriate view and state
  const resolveRoute = (articlesList: Article[], usersList: User[]) => {
    // Merge provided list with INITIAL_ARTICLES so all fallback articles are always present and complete
    const articleMap = new Map<string, Article>();
    INITIAL_ARTICLES.forEach(a => { if (a && a.id) articleMap.set(a.id, a); });
    (articlesList || []).forEach(a => {
      if (a && a.id) {
        const existing = articleMap.get(a.id);
        if (existing) {
          articleMap.set(a.id, { ...existing, ...a });
        } else {
          articleMap.set(a.id, a);
        }
      }
    });
    const effectiveArticles = Array.from(articleMap.values());

    const userMap = new Map<string, User>();
    INITIAL_USERS.forEach(u => { if (u && u.id) userMap.set(u.id, u); });
    (usersList || []).forEach(u => {
      if (u && u.id) {
        const existing = userMap.get(u.id);
        if (existing) {
          userMap.set(u.id, { ...existing, ...u });
        } else {
          userMap.set(u.id, u);
        }
      }
    });
    const effectiveUsers = Array.from(userMap.values());

    const rawPathname = window.location.pathname;
    let decodedPath = rawPathname;
    try {
      decodedPath = decodeURIComponent(rawPathname);
    } catch (e) {
      decodedPath = rawPathname;
    }

    // Strip repository subpath prefix if hosted on GitHub Pages or Vercel subpaths
    if (decodedPath.startsWith('/sga-news-portal')) {
      decodedPath = decodedPath.substring('/sga-news-portal'.length);
    } else if (decodedPath.startsWith('/sganews')) {
      decodedPath = decodedPath.substring('/sganews'.length);
    }
    if (!decodedPath.startsWith('/')) {
      decodedPath = '/' + decodedPath;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const articleParam = searchParams.get('article');

    if (articleParam) {
      const art = effectiveArticles.find(a => a.id === articleParam);
      if (art) {
        setSelectedArticleId(art.id);
        setActiveView('detail');
        try {
          const authorSlug = createSlug(art.authorName || 'penulis');
          const articleSlug = art.slug ? createSlug(art.slug) : createSlug(art.title);
          const cleanPath = `/${authorSlug}/${articleSlug || art.id}`;
          window.history.replaceState({ view: 'detail', articleId: art.id }, '', cleanPath);
        } catch (e) {}
        return;
      }
    }

    if (decodedPath === '/' || decodedPath === '') {
      setActiveView('home');
      setSelectedArticleId(null);
      setSelectedAuthorId(null);
      setSelectedAuthorName(null);
      return;
    }

    if (decodedPath.startsWith('/penulis/')) {
      const name = decodedPath.replace('/penulis/', '').trim();
      if (name) {
        const slugName = createSlug(name);
        if (
          name === 'user-admin-owner' || 
          name === 'user-admin-1' || 
          slugName === 'admin-sga-redaksi' || 
          slugName === 'admin'
        ) {
          setSelectedAuthorId('user-admin-owner');
          setSelectedAuthorName('Admin SGA Redaksi');
          setActiveView('author-profile');
          try {
            window.history.replaceState({ view: 'author-profile', authorId: 'user-admin-owner', authorName: 'Admin SGA Redaksi' }, '', '/admin-sga-redaksi');
          } catch (e) {}
          return;
        }

        const u = effectiveUsers.find(usr => 
          usr && usr.name && (
            usr.id === name ||
            usr.name.toLowerCase() === name.toLowerCase() ||
            createSlug(usr.name) === createSlug(name)
          )
        ) || INITIAL_USERS.find(usr =>
          usr.id === name ||
          usr.name.toLowerCase() === name.toLowerCase() ||
          createSlug(usr.name) === createSlug(name)
        );
        const resolvedAuthorId = u?.id || null;
        const resolvedAuthorName = u ? u.name : name;
        setSelectedAuthorId(resolvedAuthorId);
        setSelectedAuthorName(resolvedAuthorName);
        setActiveView('author-profile');
        try {
          const authorSlug = createSlug(resolvedAuthorName);
          window.history.replaceState({ view: 'author-profile', authorId: resolvedAuthorId, authorName: resolvedAuthorName }, '', '/' + (authorSlug || name));
        } catch (e) {}
        return;
      }
    }

    if (decodedPath === '/redaksi' || decodedPath === '/admin') {
      setActiveView('redaksi-portal');
      return;
    }

    if (decodedPath === '/redaksi/penulis') {
      const activeUser = getCurrentUser();
      if (!activeUser) {
        setActiveView('redaksi-portal');
        try {
          window.history.replaceState({ view: 'redaksi-portal' }, '', '/redaksi');
        } catch (e) {}
      } else {
        setActiveView('author-cms');
      }
      return;
    }

    if (decodedPath === '/redaksi/editor') {
      const activeUser = getCurrentUser();
      if (!activeUser || (activeUser.role !== 'admin' && activeUser.role !== 'editor')) {
        setActiveView('redaksi-portal');
        try {
          window.history.replaceState({ view: 'redaksi-portal' }, '', '/redaksi');
        } catch (e) {}
      } else {
        setActiveView('editor-cms');
      }
      return;
    }

    // Parse URL path segments (e.g. /nama-penulis/judul-artikel or /kategori/nama-kategori)
    const pathSegments = decodedPath.split('/').filter(p => p.trim().length > 0);

    // Handle Category routes (e.g. /kategori/KANCAH4D or /kategori/Teknologi)
    if (pathSegments.length >= 2 && pathSegments[0].toLowerCase() === 'kategori') {
      const catRaw = pathSegments[1].trim();
      const catSlug = createSlug(catRaw);
      
      setActiveView('home');
      setSelectedArticleId(null);
      setSelectedAuthorId(null);
      setSelectedAuthorName(null);

      const validCategories: Category[] = [
        'Sepak Bola', 'Teknologi', 'Olahraga', 'Hiburan', 
        'Bisnis', 'Ekonomi', 'Gaya Hidup', 'Sains', 
        'Internasional', 'Edukasi', 'Lingkungan'
      ];

      const matchedCategory = validCategories.find(c => 
        c.toLowerCase() === catRaw.toLowerCase() || 
        createSlug(c) === catSlug
      );

      if (matchedCategory) {
        setSelectedCategory(matchedCategory);
        setSearchQuery('');
      } else {
        setSelectedCategory('Semua');
        setSearchQuery(catRaw);
      }
      return;
    }

    // Helper function to find matching article by segment string
    const findArticleBySegment = (segment: string) => {
      if (!segment) return null;
      const cleanSeg = segment.trim();
      const slugSeg = createSlug(cleanSeg);

      return effectiveArticles.find(a => {
        if (!a) return false;
        const aTitleSlug = createSlug(a.title || '');
        const aArtSlug = a.slug ? createSlug(a.slug) : '';
        return (
          a.id === cleanSeg ||
          a.slug === cleanSeg ||
          (a.slug && aArtSlug === slugSeg) ||
          (aTitleSlug && aTitleSlug === slugSeg) ||
          (a.title && a.title.toLowerCase() === cleanSeg.toLowerCase()) ||
          (slugSeg.length > 5 && (
            (aTitleSlug && (aTitleSlug.includes(slugSeg) || slugSeg.includes(aTitleSlug))) ||
            (aArtSlug && (aArtSlug.includes(slugSeg) || slugSeg.includes(aArtSlug)))
          ))
        );
      }) || null;
    };

    if (pathSegments.length > 0) {
      // 1. Try matching article from the last segment (e.g. /author-name/article-slug)
      let matchedArticle = findArticleBySegment(pathSegments[pathSegments.length - 1]);
      
      // 2. Fallback: Check any segment in the URL
      if (!matchedArticle && pathSegments.length > 1) {
        for (const seg of pathSegments) {
          matchedArticle = findArticleBySegment(seg);
          if (matchedArticle) break;
        }
      }

      if (matchedArticle) {
        setSelectedArticleId(matchedArticle.id);
        setActiveView('detail');
        return;
      }

      // If we are looking for a deep link article but Firestore has not synchronized yet,
      // let's defer fallback/redirects and stay in 'detail' to show the loading/connecting spinner.
      if (!isLiveConnected) {
        setSelectedArticleId(null);
        setActiveView('detail');
        return;
      }

      // If the URL has 2 or more segments and does NOT start with 'penulis' or 'kategori',
      // then it's almost certainly a direct article path. Since it wasn't matched above even after 
      // Firestore synchronized, let's keep it on 'detail' view with null article ID to trigger the 404 screen.
      const isPenulisPath = pathSegments.length >= 2 && pathSegments[0].toLowerCase() === 'penulis';
      const isCategoryPath = pathSegments.length >= 2 && pathSegments[0].toLowerCase() === 'kategori';
      
      if (pathSegments.length >= 2 && !isPenulisPath && !isCategoryPath) {
        setSelectedArticleId(null);
        setActiveView('detail');
        return;
      }

      // Check if path directly matches an Author slug/name/id (e.g., /admin-sga-redaksi)
      const rawTitleOrId = isPenulisPath ? pathSegments[1] : pathSegments[0];
      const slugOfPath = createSlug(rawTitleOrId);

      if (
        rawTitleOrId === 'user-admin-owner' || 
        rawTitleOrId === 'user-admin-1' || 
        slugOfPath === 'admin-sga-redaksi' || 
        slugOfPath === 'admin'
      ) {
        setSelectedAuthorId('user-admin-owner');
        setSelectedAuthorName('Admin SGA Redaksi');
        setActiveView('author-profile');
        return;
      }

      const u = effectiveUsers.find(usr => 
        usr && usr.name && (
          usr.id === rawTitleOrId ||
          usr.name.toLowerCase() === rawTitleOrId.toLowerCase() ||
          createSlug(usr.name) === slugOfPath ||
          createSlug(usr.id) === slugOfPath
        )
      ) || INITIAL_USERS.find(usr =>
        usr.id === rawTitleOrId ||
        usr.name.toLowerCase() === rawTitleOrId.toLowerCase() ||
        createSlug(usr.name) === slugOfPath ||
        createSlug(usr.id) === slugOfPath
      );

      if (u) {
        setSelectedAuthorId(u.id);
        setSelectedAuthorName(u.name);
        setActiveView('author-profile');
        return;
      }

      // Check if any article was written by an author matching this slug/name
      const artAuthor = effectiveArticles.find(a => 
        (a.authorName && createSlug(a.authorName) === slugOfPath) ||
        (a.authorName && a.authorName.toLowerCase() === rawTitleOrId.toLowerCase()) ||
        (a.authorId && (a.authorId === rawTitleOrId || createSlug(a.authorId) === slugOfPath))
      );

      if (artAuthor) {
        setSelectedAuthorId(artAuthor.authorId);
        setSelectedAuthorName(artAuthor.authorName);
        setActiveView('author-profile');
        return;
      }
    }

    // Default fallback to Home if path is unrecognized
    setActiveView('home');
    setSelectedArticleId(null);
  };

  // Subscribe to real-time Firestore synchronization
  useEffect(() => {
    setBookmarkedIds(getBookmarks());

    // Subscribe to Articles Collection in Firestore
    const unsubscribeArticles = subscribeToArticles((updatedArticles) => {
      setArticles(updatedArticles);
      setIsLiveConnected(true);
    });

    // Subscribe to Users Collection in Firestore
    const unsubscribeUsers = subscribeToUsers((updatedUsers) => {
      const stored = getStoredUsers();
      const userMap = new Map<string, User>();

      // 1. Initial base users
      INITIAL_USERS.forEach(u => {
        if (!u || !u.id) return;
        userMap.set(u.id, u);
      });
      userMap.set(OFFICIAL_ADMIN_USER.id, OFFICIAL_ADMIN_USER);

      // 2. Add stored local users as fallback
      stored.forEach(u => {
        if (!u || !u.id) return;
        const targetId = (u.id === OFFICIAL_ADMIN_USER.id || u.email === 'admin@sganews.id') ? OFFICIAL_ADMIN_USER.id : u.id;
        const existing = userMap.get(targetId) || {};
        userMap.set(targetId, { ...existing, ...u });
      });

      // 3. Apply real-time Firestore updates (Firestore is source of truth!)
      updatedUsers.forEach(u => {
        if (!u || !u.id) return;
        const targetId = (u.id === OFFICIAL_ADMIN_USER.id || u.email === 'admin@sganews.id') ? OFFICIAL_ADMIN_USER.id : u.id;
        const existing = userMap.get(targetId) || {};
        userMap.set(targetId, { ...existing, ...u });
      });

      const combined = Array.from(userMap.values());
      setUsers(combined);

      // 4. Real-time sync for current logged in user persona
      setCurrentUser(prevUser => {
        if (!prevUser) return prevUser;
        const targetId = (prevUser.id === OFFICIAL_ADMIN_USER.id || prevUser.email === 'admin@sganews.id') ? OFFICIAL_ADMIN_USER.id : prevUser.id;
        const updatedSelf = userMap.get(targetId);
        if (updatedSelf) {
          try {
            localStorage.setItem('sga_news_current_user_v1', JSON.stringify(updatedSelf));
          } catch (e) {}
          return updatedSelf;
        }
        return prevUser;
      });
    });

    return () => {
      unsubscribeArticles();
      unsubscribeUsers();
    };
  }, []);

  // Synchronize route whenever articles, users, or location pathname changes
  useEffect(() => {
    resolveRoute(articles, users);
  }, [articles, users, isLiveConnected]);

  // Sync route on browser back/forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      resolveRoute(articles, users);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [articles, users, isLiveConnected]);

  // Automatically sync articles with latest user verification badges, roles, and avatars
  const syncedArticles = React.useMemo(() => {
    const articleMap = new Map<string, Article>();
    INITIAL_ARTICLES.forEach(a => { if (a && a.id) articleMap.set(a.id, a); });
    (articles || []).forEach(a => { if (a && a.id) articleMap.set(a.id, a); });
    const combined = Array.from(articleMap.values());

    const mapped = combined.map(art => {
      const authorUser = users.find(u => 
        u && (
          (art.authorId && u.id === art.authorId) ||
          (art.authorName && u.name && u.name.toLowerCase() === art.authorName.toLowerCase())
        )
      );

      if (authorUser) {
        const isVerified = authorUser.isVerified ?? isUserAdminOrVerified(authorUser.role, authorUser.name, authorUser.isVerified);
        return {
          ...art,
          isVerified,
          authorRole: authorUser.role || art.authorRole,
          authorAvatar: authorUser.avatar || art.authorAvatar,
          authorName: authorUser.name || art.authorName
        };
      } else {
        const isVerified = art.isVerified ?? isUserAdminOrVerified(art.authorRole, art.authorName, art.isVerified);
        return {
          ...art,
          isVerified
        };
      }
    });

    // Sort by createdAt descending so newest articles are always shown first on the homepage/headlines
    return mapped.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [articles, users]);

  // Currently selected article (synced in real-time if updated)
  const selectedArticle = selectedArticleId 
    ? syncedArticles.find(a => a.id === selectedArticleId) || null 
    : null;

  // Dynamic SEO Meta Tags Sync Effect
  useEffect(() => {
    const authorUser = users.find(u => 
      u && (
        (selectedAuthorId && u.id === selectedAuthorId) || 
        (selectedAuthorName && u.name && u.name.toLowerCase() === selectedAuthorName.toLowerCase())
      )
    );
    const authorArticles = syncedArticles.filter(a => 
      a && (
        (selectedAuthorId && a.authorId === selectedAuthorId) || 
        (selectedAuthorName && a.authorName && a.authorName.toLowerCase() === selectedAuthorName.toLowerCase()) ||
        (authorUser && a.authorId === authorUser.id)
      )
    );

    updateArticleSEO(
      selectedArticle, 
      selectedCategory, 
      activeView, 
      selectedAuthorName,
      authorUser,
      authorArticles.filter(a => a.status === 'published' || !a.status).length,
      authorArticles
    );
  }, [selectedArticle, selectedCategory, activeView, selectedAuthorName, selectedAuthorId, users, syncedArticles]);

  const handleToggleBookmark = (id: string) => {
    toggleBookmark(id);
    setBookmarkedIds(getBookmarks());
  };

  const handleSelectArticle = (art: Article) => {
    setSelectedArticleId(art.id);
    setActiveView('detail');
    try {
      const authorSlug = createSlug(art.authorName || 'penulis');
      const articleSlug = art.slug ? createSlug(art.slug) : createSlug(art.title);
      const articlePath = `/${authorSlug}/${articleSlug || art.id}`;
      window.history.pushState({ view: 'detail', articleId: art.id }, '', articlePath);
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAuthor = (authorId: string, authorName: string) => {
    setSelectedAuthorId(authorId);
    setSelectedAuthorName(authorName);
    setActiveView('author-profile');
    try {
      const slug = createSlug(authorName);
      window.history.pushState({ view: 'author-profile', authorId, authorName }, '', '/' + (slug || authorId));
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setActiveView('home');
    setSelectedArticleId(null);
    setSelectedAuthorId(null);
    setSelectedAuthorName(null);
    try {
      window.history.pushState({ view: 'home' }, '', '/');
    } catch (e) {
      console.error(e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setStoredCurrentUser(null);
    setCurrentUser(null);
    handleNavigateHome();
  };

  // Filter published articles for home view
  const publishedArticles = syncedArticles.filter(a => a.status === 'published');
  
  const filteredArticles = publishedArticles.filter(a => {
    const matchCategory = selectedCategory === 'Semua' || a.category === selectedCategory;
    const matchSearch = !searchQuery || 
      (a.title && a.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.excerpt && a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.authorName && a.authorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.tags && a.tags.some(t => t && t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchCategory && matchSearch;
  });

  const bookmarkedArticles = publishedArticles.filter(a => bookmarkedIds.includes(a.id));

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Navbar Component */}
      <Navbar
        articles={syncedArticles}
        onSelectArticle={handleSelectArticle}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentUser={currentUser}
        onOpenRoleModal={() => {
          setActiveView('redaksi-portal');
          try {
            window.history.pushState({ view: 'redaksi-portal' }, '', '/redaksi');
          } catch (e) {}
        }}
        onOpenLegalModal={() => setLegalModalOpen(true)}
        onOpenBookmarks={() => setBookmarksDrawerOpen(true)}
        bookmarkCount={bookmarkedIds.length}
        onOpenWriteDashboard={() => {
          if (!currentUser) {
            setActiveView('redaksi-portal');
            try {
              window.history.pushState({ view: 'redaksi-portal' }, '', '/redaksi');
            } catch (e) {}
          } else {
            setActiveView('author-cms');
            try {
              window.history.pushState({ view: 'author-cms' }, '', '/redaksi/penulis');
            } catch (e) {}
          }
        }}
        onOpenRedaksiDashboard={() => {
          if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'editor')) {
            setActiveView('redaksi-portal');
            try {
              window.history.pushState({ view: 'redaksi-portal' }, '', '/redaksi');
            } catch (e) {}
          } else {
            setActiveView('editor-cms');
            try {
              window.history.pushState({ view: 'editor-cms' }, '', '/redaksi/editor');
            } catch (e) {}
          }
        }}
        activeView={activeView === 'redaksi-portal' ? 'editor-cms' : activeView} // keep active in navbar when in portal
        onNavigateHome={handleNavigateHome}
        onOpenSitemapModal={() => setSitemapModalOpen(true)}
        onSelectAuthor={handleSelectAuthor}
        onOpenEditProfile={() => setEditProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Header Google AdSense Banner (Renders if approved in Admin Dashboard) */}
      <GoogleAdUnit position="header" className="max-w-7xl w-full mx-auto px-3 sm:px-8 pt-3" />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-8 py-4 sm:py-6">
        
        {/* VIEW 1: HOME PAGE */}
        {activeView === 'home' && (
          <div className="space-y-10">
            
            {/* Hero Breaking News Section (Shows when no search query and 'Semua' category selected) */}
            {!searchQuery && selectedCategory === 'Semua' && (
              <HeroHeadline
                articles={syncedArticles}
                onSelectArticle={handleSelectArticle}
                onToggleBookmark={handleToggleBookmark}
                bookmarkedIds={bookmarkedIds}
                onSelectAuthor={handleSelectAuthor}
              />
            )}

            {/* Category Title / Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-6 bg-blue-600 rounded-sm"></span>
                <h2 className="text-xl font-extrabold uppercase tracking-tight text-slate-900 dark:text-white font-sans">
                  {searchQuery 
                    ? `HASIL PENCARIAN: "${searchQuery}"` 
                    : selectedCategory === 'Semua' 
                      ? 'INFORMATIF & TERKINI SEPUTAR INDONESIA' 
                      : `BERITA KATEGORI ${selectedCategory.toUpperCase()}`}
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  ({filteredArticles.length} Warta)
                </span>
              </div>

              {selectedCategory !== 'Semua' && (
                <button
                  onClick={() => setSelectedCategory('Semua')}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Lihat Semua Kategori
                </button>
              )}
            </div>

            {/* Main Content & Sidebar Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Main Articles Grid (8 cols) */}
              <div className="lg:col-span-8">
                {filteredArticles.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <Search className="w-10 h-10 text-slate-400 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      Tidak ditemukan berita yang cocok
                    </h3>
                    <p className="text-xs text-slate-500">
                      Coba gunakan kata kunci lain atau pilih kategori berita yang berbeda.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('Semua');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                    >
                      Bersihkan Filter
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {filteredArticles.map((art) => (
                      <ArticleCard
                        key={art.id}
                        article={art}
                        onSelectArticle={handleSelectArticle}
                        onToggleBookmark={handleToggleBookmark}
                        isBookmarked={bookmarkedIds.includes(art.id)}
                        onSelectAuthor={handleSelectAuthor}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar Widget Area (4 cols) */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                <TrendingSidebar
                  articles={publishedArticles}
                  onSelectArticle={handleSelectArticle}
                  onToggleBookmark={handleToggleBookmark}
                  bookmarkedIds={bookmarkedIds}
                  onSelectAuthor={handleSelectAuthor}
                />
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: ARTICLE DETAIL VIEW */}
        {activeView === 'detail' && (
          selectedArticle ? (
            <ArticleDetail
              article={selectedArticle}
              currentUser={currentUser}
              onBack={handleNavigateHome}
              onToggleBookmark={handleToggleBookmark}
              isBookmarked={bookmarkedIds.includes(selectedArticle.id)}
              onSelectArticle={handleSelectArticle}
              allArticles={syncedArticles}
              onSelectAuthor={handleSelectAuthor}
            />
          ) : !isLiveConnected ? (
            /* Loading State when Firestore is Synchronizing */
            <div className="max-w-2xl mx-auto my-16 py-16 px-6 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse mt-4">Menghubungkan ke Redaksi SGA...</p>
            </div>
          ) : (
            /* 404 State when Article is Not Found */
            <div className="max-w-2xl mx-auto my-8 py-14 px-6 text-center space-y-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-extrabold border border-blue-100 dark:border-blue-900">
                404
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Warta / Artikel Tidak Ditemukan
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Artikel yang Anda tuju belum diterbitkan di database SGA News Portal atau tautan URL tidak tersedia.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleNavigateHome}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Kembali ke Beranda Utama
                </button>
                {currentUser && (currentUser.role === 'admin' || currentUser.role === 'editor' || currentUser.role === 'author') && (
                  <button
                    onClick={() => {
                      setActiveView('author-cms');
                      try {
                        window.history.pushState({ view: 'author-cms' }, '', '/redaksi/penulis');
                      } catch (e) {}
                    }}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                  >
                    Tulis & Terbitkan Artikel Ini
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {/* VIEW 3: AUTHOR PROFILE VIEW */}
        {activeView === 'author-profile' && (
          <AuthorProfile
            authorId={selectedAuthorId}
            authorName={selectedAuthorName}
            usersList={users}
            allArticles={syncedArticles}
            onBack={handleNavigateHome}
            onSelectArticle={handleSelectArticle}
            onToggleBookmark={handleToggleBookmark}
            bookmarkedIds={bookmarkedIds}
            currentUser={currentUser}
            onOpenEditProfile={() => setEditProfileModalOpen(true)}
            onEditArticle={(art) => {
              setEditingArticle(art);
              setEditArticleModalOpen(true);
            }}
          />
        )}

        {/* VIEW 4: AUTHOR CMS DASHBOARD */}
        {activeView === 'author-cms' && currentUser && (
          <Suspense fallback={
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-pulse">
              {/* Dashboard Banner Header Skeleton */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4 max-w-xl">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 shrink-0"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-slate-800 rounded"></div>
                    <div className="h-6 w-48 bg-slate-800 rounded"></div>
                    <div className="h-3 w-72 bg-slate-800 rounded hidden sm:block"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-28 bg-slate-800 rounded-xl"></div>
                  <div className="h-9 w-28 bg-slate-800 rounded-xl"></div>
                </div>
              </div>

              {/* Stats Cards Overview Skeleton */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-16 bg-slate-800 rounded"></div>
                      <div className="w-4 h-4 bg-slate-800 rounded-full"></div>
                    </div>
                    <div className="h-8 w-12 bg-slate-800 rounded"></div>
                    <div className="h-2 w-20 bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>

              {/* Main CMS Navigation Tabs Skeleton */}
              <div className="flex border-b border-slate-800 gap-2 pb-0.5">
                <div className="h-10 w-36 bg-slate-800 rounded-t"></div>
                <div className="h-10 w-44 bg-slate-800 rounded-t"></div>
              </div>

              {/* Form / Content Skeleton */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="h-6 w-48 bg-slate-800 rounded"></div>
                <div className="space-y-3">
                  <div className="h-3 w-1/4 bg-slate-800 rounded"></div>
                  <div className="h-10 w-full bg-slate-800 rounded-xl"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-1/3 bg-slate-800 rounded"></div>
                  <div className="h-24 w-full bg-slate-800 rounded-xl"></div>
                </div>
              </div>
            </div>
          }>
            <AuthorDashboard
              currentUser={currentUser}
              userArticles={syncedArticles.filter(a => a.authorId === currentUser.id)}
              onSelectArticle={handleSelectArticle}
              onOpenLegalModal={() => setLegalModalOpen(true)}
              onOpenEditProfile={() => setEditProfileModalOpen(true)}
            />
          </Suspense>
        )}

        {/* VIEW 4: REDAKSI / EDITOR CMS DASHBOARD */}
        {activeView === 'editor-cms' && currentUser && (
          <Suspense fallback={
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-pulse">
              {/* Dashboard Banner Header Skeleton */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4 max-w-xl">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 shrink-0"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-slate-800 rounded"></div>
                    <div className="h-6 w-48 bg-slate-800 rounded"></div>
                    <div className="h-3 w-72 bg-slate-800 rounded hidden sm:block"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-28 bg-slate-800 rounded-xl"></div>
                  <div className="h-9 w-28 bg-slate-800 rounded-xl"></div>
                </div>
              </div>

              {/* Tabs Skeleton */}
              <div className="flex border-b border-slate-800 gap-2 pb-0.5 overflow-x-auto">
                <div className="h-10 w-28 bg-slate-800 rounded-t shrink-0"></div>
                <div className="h-10 w-32 bg-slate-800 rounded-t shrink-0"></div>
                <div className="h-10 w-24 bg-slate-800 rounded-t shrink-0"></div>
                <div className="h-10 w-28 bg-slate-800 rounded-t shrink-0"></div>
              </div>

              {/* Data Table Skeleton */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="h-6 w-48 bg-slate-800 rounded"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(row => (
                    <div key={row} className="flex items-center justify-between py-3 border-b border-slate-800/60">
                      <div className="space-y-2 flex-1 mr-4">
                        <div className="h-4 w-2/3 bg-slate-800 rounded"></div>
                        <div className="h-3 w-1/3 bg-slate-800 rounded"></div>
                      </div>
                      <div className="h-6 w-16 bg-slate-800 rounded-full mr-4"></div>
                      <div className="h-8 w-12 bg-slate-800 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }>
            <EditorDashboard
              currentUser={currentUser}
              allArticles={syncedArticles}
              onSelectArticle={handleSelectArticle}
              usersList={users}
              onOpenSitemapModal={() => setSitemapModalOpen(true)}
            />
          </Suspense>
        )}

        {/* VIEW 5: REDAKSI PORTAL LOGIN / ENTRY PAGE */}
        {activeView === 'redaksi-portal' && (
          <RedaksiPortal
            currentUser={currentUser}
            onUserChanged={(newUser) => {
              setCurrentUser(newUser);
              resolveRoute(articles, users);
            }}
            onNavigateHome={handleNavigateHome}
            onNavigateToView={(view) => {
              setActiveView(view as any);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            usersList={users}
          />
        )}

      </main>

      {/* Footer Component */}
      <Footer
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleNavigateHome();
        }}
        onOpenLegalModal={() => setLegalModalOpen(true)}
        onOpenSitemapModal={() => setSitemapModalOpen(true)}
        onOpenRedaksiPortal={() => {
          setActiveView('redaksi-portal');
          try {
            window.history.pushState({ view: 'redaksi-portal' }, '', '/redaksi');
          } catch (e) {}
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <Suspense fallback={null}>
        {/* Sitemap XML Generator Modal */}
        {sitemapModalOpen && (
          <SitemapModal
            isOpen={sitemapModalOpen}
            onClose={() => setSitemapModalOpen(false)}
            articles={articles}
          />
        )}

        {/* Edit Profile & Avatar Modal */}
        {editProfileModalOpen && (
          <EditProfileModal
            isOpen={editProfileModalOpen}
            onClose={() => setEditProfileModalOpen(false)}
            currentUser={currentUser}
            onUserUpdated={(updatedUser) => {
              setCurrentUser(updatedUser);
              setUsers(prevUsers => {
                const exists = prevUsers.some(u => u.id === updatedUser.id || u.email === updatedUser.email);
                if (exists) {
                  return prevUsers.map(u => (u.id === updatedUser.id || u.email === updatedUser.email) ? { ...u, ...updatedUser } : u);
                }
                return [...prevUsers, updatedUser];
              });
            }}
          />
        )}

        {/* Edit Article Modal */}
        {editArticleModalOpen && editingArticle && (
          <EditArticleModal
            isOpen={editArticleModalOpen}
            onClose={() => {
              setEditArticleModalOpen(false);
              setEditingArticle(null);
            }}
            article={editingArticle}
            currentUser={currentUser}
          />
        )}

        {/* Legal & Editorial Guidelines Modal */}
        {legalModalOpen && (
          <LegalModal
            isOpen={legalModalOpen}
            onClose={() => setLegalModalOpen(false)}
          />
        )}

        {/* Bookmarks Drawer */}
        {bookmarksDrawerOpen && (
          <BookmarksDrawer
            isOpen={bookmarksDrawerOpen}
            onClose={() => setBookmarksDrawerOpen(false)}
            bookmarkedArticles={bookmarkedArticles}
            onSelectArticle={handleSelectArticle}
            onRemoveBookmark={handleToggleBookmark}
          />
        )}
      </Suspense>

      {/* Floating Bottom Sticky Google AdSense Banner */}
      <GoogleAdUnit position="bottom-sticky" />

    </div>
  );
}
