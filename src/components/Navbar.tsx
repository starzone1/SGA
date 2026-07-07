import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bookmark, 
  PenTool, 
  UserCheck, 
  ShieldCheck, 
  Moon, 
  Sun, 
  BookOpen, 
  Clock, 
  Flame,
  Menu,
  X,
  FileCode,
  Upload,
  BarChart2,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  User as UserIcon
} from 'lucide-react';
import { Category, User, Article } from '../types';
import { VerifiedBadge, isUserAdminOrVerified, getAuthorAvatar } from './VerifiedBadge';

interface NavbarProps {
  articles?: Article[];
  onSelectArticle?: (article: Article) => void;
  selectedCategory: Category | 'Semua';
  onSelectCategory: (cat: Category | 'Semua') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUser: User | null;
  onOpenRoleModal: () => void;
  onOpenLegalModal: () => void;
  onOpenBookmarks: () => void;
  bookmarkCount: number;
  onOpenWriteDashboard: () => void;
  onOpenRedaksiDashboard: () => void;
  activeView: 'home' | 'detail' | 'author-cms' | 'editor-cms' | 'author-profile';
  onNavigateHome: () => void;
  onOpenSitemapModal?: () => void;
  onSelectAuthor?: (authorId: string, authorName: string) => void;
  onOpenEditProfile?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  articles = [],
  onSelectArticle,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  currentUser,
  onOpenRoleModal,
  onOpenLegalModal,
  onOpenBookmarks,
  bookmarkCount,
  onOpenWriteDashboard,
  onOpenRedaksiDashboard,
  activeView,
  onNavigateHome,
  onOpenSitemapModal,
  onSelectAuthor,
  onOpenEditProfile,
  onLogout
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prepare relevant articles for running text ticker
  const publishedArticles = articles.filter(a => a.status === 'published');
  const relevantArticles = publishedArticles.filter(a => {
    if (selectedCategory !== 'Semua' && a.category !== selectedCategory) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const tickerArticles = relevantArticles.length > 0 ? relevantArticles : publishedArticles;

  // Duplicate for seamless 360 loop
  const marqueeItems = tickerArticles.length > 0 
    ? [...tickerArticles, ...tickerArticles, ...tickerArticles, ...tickerArticles]
    : [];

  useEffect(() => {
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('sga_theme');
    let isDark = false;
    
    if (savedTheme === 'dark') {
      isDark = true;
    } else if (savedTheme === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setIsDarkMode(isDark);

    // Sync theme across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sga_theme') {
        const dark = e.newValue === 'dark';
        setIsDarkMode(dark);
        if (dark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Date ticker
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentTime(now.toLocaleDateString('id-ID', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sga_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sga_theme', 'light');
    }
  };

  const categories: (Category | 'Semua')[] = [
    'Semua',
    'Sepak Bola',
    'Teknologi',
    'Olahraga',
    'Hiburan',
    'Bisnis',
    'Gaya Hidup'
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      
      {/* Top Ticker Bar */}
      <div className="bg-slate-900 text-slate-300 text-[10px] sm:text-[11px] py-1 px-3 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-hidden">
          
          <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1 relative">
            <span className="flex items-center gap-1 font-extrabold text-blue-400 uppercase tracking-wider whitespace-nowrap bg-blue-950/90 px-1.5 py-0.5 rounded text-[9px] border border-blue-800 shrink-0 z-10 shadow-sm">
              <Flame className="w-3 h-3 text-blue-400 animate-pulse" />
              BREAKING
            </span>
            
            <div className="overflow-hidden whitespace-nowrap relative flex-1">
              {marqueeItems.length > 0 ? (
                <div className="animate-marquee items-center text-slate-300 font-medium text-[11px] select-none">
                  {marqueeItems.map((art, idx) => (
                    <span 
                      key={`${art.id}-${idx}`}
                      onClick={() => onSelectArticle && onSelectArticle(art)}
                      className="inline-flex items-center gap-1.5 hover:text-blue-400 hover:underline cursor-pointer transition mr-4"
                    >
                      <span className="font-semibold text-slate-200">{art.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded font-bold uppercase shrink-0">
                        {art.category}
                      </span>
                      <span className="text-slate-600 ml-1">•</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="truncate text-slate-400 font-medium text-[11px]">
                  SGA News • Portal Warta & Media Komunitas Terkini
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-slate-400 shrink-0">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {currentTime || 'Jumat, 3 Juli 2026'}
            </span>
            <button 
              onClick={onOpenLegalModal}
              className="hover:text-white flex items-center gap-1 transition"
            >
              <BookOpen className="w-3 h-3" />
              Panduan Menulis
            </button>
          </div>

        </div>
      </div>

      {/* Main Header / Branding */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-8 py-2 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-2">
        
        {/* Brand Logo */}
        <div 
          onClick={onNavigateHome}
          className="cursor-pointer flex items-center gap-1.5 sm:gap-3 group shrink-0"
        >
          <img 
            src="https://ik.imagekit.io/dxokd3m9y/sgaicon.png" 
            alt="SGA News Logo" 
            className="w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform border border-slate-200 dark:border-slate-800 shrink-0"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-black text-base sm:text-2xl tracking-tight text-slate-900 dark:text-white uppercase font-sans leading-none">
                SGA <span className="text-blue-600 dark:text-blue-400">NEWS</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 rounded">
                PORTAL
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
              Portal Berita & Media Komunitas Independen
            </p>
          </div>
        </div>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex items-center relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Cari berita, topik, atau penulis..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Actions & User Persona Switcher */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title="Toggle Tema"
            aria-label="Toggle Tema"
            className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition shrink-0"
          >
            {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Bookmarks Toggle */}
          <button
            onClick={onOpenBookmarks}
            title="Tersimpan"
            aria-label="Tersimpan"
            className="relative p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition shrink-0"
          >
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
            {bookmarkCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-blue-600 text-white text-[8px] sm:text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* User Account / Sign in Section - Profile Dropdown when Logged In */}
          <div className="flex items-center gap-1.5">
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 px-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-full transition cursor-pointer select-none"
                >
                  <img
                    src={getAuthorAvatar(currentUser.avatar, currentUser.role, currentUser.name, currentUser.isVerified)}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* User Info Header */}
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <img
                          src={getAuthorAvatar(currentUser.avatar, currentUser.role, currentUser.name, currentUser.isVerified)}
                          alt={currentUser.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-slate-800 dark:text-white truncate flex items-center gap-1">
                            <span>{currentUser.name}</span>
                            {isUserAdminOrVerified(currentUser.role, currentUser.name, currentUser.isVerified) && (
                              <VerifiedBadge size="xs" />
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                            {currentUser.role === 'admin' ? 'Pemimpin Redaksi' : currentUser.role === 'editor' ? 'Editor Redaksi' : 'Penulis Staff'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="p-1 space-y-0.5">
                      {/* About / Profile */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onSelectAuthor) {
                            onSelectAuthor(currentUser.id, currentUser.name);
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-left"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Tentang / Profil</span>
                      </button>

                      {/* Artikel / Dashboard */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (currentUser.role === 'admin' || currentUser.role === 'editor') {
                            onOpenRedaksiDashboard();
                          } else {
                            onOpenWriteDashboard();
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-left"
                      >
                        <PenTool className="w-4 h-4 text-slate-400" />
                        <span>Artikel / Dashboard</span>
                      </button>

                      {/* Pengaturan Profil */}
                      {onOpenEditProfile && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onOpenEditProfile();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition text-left"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Pengaturan Profil</span>
                        </button>
                      )}
                    </div>

                    {/* Logout Option */}
                    <div className="px-1 pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Logout (Keluar)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="/redaksi"
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    window.history.pushState({ view: 'redaksi-portal' }, '', '/redaksi');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  } catch (err) {}
                }}
                className="hidden sm:inline-flex px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-full transition"
              >
                LOGIN AKUN
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu Navigasi"
            className="p-1.5 md:hidden text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Category Navigation Bar */}
      <nav className="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200/80 dark:border-slate-800 px-2 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto no-scrollbar scroll-smooth py-1.5 gap-1.5 sm:gap-2 touch-pan-x">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  onSelectCategory(cat);
                  onNavigateHome();
                }}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 bg-white/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari berita, topik, atau penulis..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 p-1 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="pt-1 flex flex-col gap-2">
            {currentUser ? (
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-850 rounded-xl p-3.5 space-y-3 shadow-inner">
                {/* Profile header */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-800">
                  <img
                    src={getAuthorAvatar(currentUser.avatar, currentUser.role, currentUser.name, currentUser.isVerified)}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white truncate flex items-center gap-1">
                      <span>{currentUser.name}</span>
                      {isUserAdminOrVerified(currentUser.role, currentUser.name, currentUser.isVerified) && (
                        <VerifiedBadge size="xs" />
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">
                      {currentUser.role === 'admin' ? 'Pemimpin Redaksi' : currentUser.role === 'editor' ? 'Editor' : 'Penulis'}
                    </p>
                  </div>
                </div>

                {/* Sub features buttons list */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* About / Profile */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onSelectAuthor) {
                        onSelectAuthor(currentUser.id, currentUser.name);
                      }
                    }}
                    className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-xs"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Profil / About</span>
                  </button>

                  {/* Artikel / Dashboard */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (currentUser.role === 'admin' || currentUser.role === 'editor') {
                        onOpenRedaksiDashboard();
                      } else {
                        onOpenWriteDashboard();
                      }
                    }}
                    className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-xs"
                  >
                    <PenTool className="w-3.5 h-3.5 text-slate-400" />
                    <span>Artikel / CMS</span>
                  </button>

                  {/* Pengaturan Profil */}
                  {onOpenEditProfile && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenEditProfile();
                      }}
                      className="flex items-center gap-1.5 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow-xs col-span-2 justify-center"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Pengaturan Profil</span>
                    </button>
                  )}
                </div>

                {/* Logout button */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-xs font-bold transition duration-150 active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout (Keluar)</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  try {
                    window.history.pushState({ view: 'redaksi-portal' }, '', '/redaksi');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  } catch (err) {}
                }}
                className="w-full flex items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700 text-xs font-bold shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>LOGIN AKUN</span>
              </button>
            )}
          </div>

          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <button
              onClick={() => {
                onOpenLegalModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 py-1 hover:text-blue-600 font-medium"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Kode Etik & Redaksi</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Mode Gelap</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

    </header>
  );
};
