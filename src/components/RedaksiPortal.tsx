import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { VerifiedBadge, isUserAdminOrVerified, getAuthorAvatar } from './VerifiedBadge';
import { Shield, Lock, PlusCircle, LogIn, LogOut, UserCheck, ArrowLeft, PenTool, Layout, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { getStoredUsers, setCurrentUser } from '../utils/storage';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface RedaksiPortalProps {
  currentUser: User | null;
  onUserChanged: (newUser: User | null) => void;
  onNavigateHome: () => void;
  onNavigateToView: (view: 'home' | 'detail' | 'author-cms' | 'editor-cms') => void;
  usersList: User[];
}

export const RedaksiPortal: React.FC<RedaksiPortalProps> = ({
  currentUser,
  onUserChanged,
  onNavigateHome,
  onNavigateToView,
  usersList
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBio, setNewBio] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Admin Account Definition
  const ADMIN_USER: User = {
    id: 'user-admin-owner',
    name: 'Admin SGA Redaksi',
    email: 'admin@sganews.id',
    role: 'admin',
    avatar: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png',
    bio: 'Pemimpin Redaksi Utama & Owner SGA News Portal. Bertanggung jawab atas kebijakan jurnalistik, verifikasi berita, dan pengawasan tim redaksi.',
    joinedDate: 'Januari 2024',
    articlesCount: 18,
    isVerified: true
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanEmail) {
      setLoginError('Harap isi email Anda.');
      return;
    }

    // 1. Check Admin SGA Redaksi Credentials (Securely typed by the project owner)
    if (cleanEmail === 'admin@sganews.id' || cleanEmail === 'admin') {
      if (cleanPass !== 'SGA2026-Pemred-Owner') {
        setLoginError('Sandi Pemred salah!');
        return;
      }
      setCurrentUser(ADMIN_USER);
      onUserChanged(ADMIN_USER);
      onNavigateToView('editor-cms');
      try {
        window.history.pushState({ view: 'editor-cms' }, '', '/redaksi/editor');
      } catch (e) {}
      return;
    }

    // 2. Check Registered Users in storage
    const storedUsers = getStoredUsers();
    const matchedUser = storedUsers.find(u => u.email.toLowerCase() === cleanEmail);

    if (matchedUser) {
      setCurrentUser(matchedUser);
      onUserChanged(matchedUser);
      if (matchedUser.role === 'admin' || matchedUser.role === 'editor') {
        onNavigateToView('editor-cms');
        try {
          window.history.pushState({ view: 'editor-cms' }, '', '/redaksi/editor');
        } catch (e) {}
      } else {
        onNavigateToView('author-cms');
        try {
          window.history.pushState({ view: 'author-cms' }, '', '/redaksi/penulis');
        } catch (e) {}
      }
      return;
    }

    setLoginError('Akun tidak terdaftar atau sandi salah.');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setRegisterSuccess('');

    if (!newName || !newEmail || !newPassword) {
      setLoginError('Harap lengkapi semua kolom wajib.');
      return;
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      name: newName,
      email: newEmail.trim(),
      role: 'author',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200`,
      bio: newBio || 'Penulis Komunitas Baru di SGA News Portal.',
      joinedDate: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      articlesCount: 0,
      followersCount: 0,
      profileLikesCount: 0,
      followers: [],
      isVerified: false
    };

    try {
      if (db) {
        await setDoc(doc(db, 'users', newUser.id), newUser);
      }
    } catch (err) {
      console.error('Failed to sync user to Firestore', err);
    }

    const existingUsers = getStoredUsers();
    const updated = [...existingUsers, newUser];
    localStorage.setItem('sga_news_users_v1', JSON.stringify(updated));

    setCurrentUser(newUser);
    onUserChanged(newUser);
    setRegisterSuccess('Pendaftaran berhasil! Akun Penulis Komunitas Anda telah aktif.');
    setTimeout(() => {
      onNavigateToView('author-cms');
      try {
        window.history.pushState({ view: 'author-cms' }, '', '/redaksi/penulis');
      } catch (ev) {}
    }, 1000);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    onUserChanged(null);
  };

  return (
    <div id="redaksi-portal-container" className="min-h-[80vh] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Left column: Branded sidebar (Dark & Elegant) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-950 to-slate-900 p-8 flex flex-col justify-between border-r border-slate-800/60">
          <div className="space-y-6">
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Portal Berita
            </button>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <img 
                  src="https://ik.imagekit.io/dxokd3m9y/sgaicon.png" 
                  alt="SGA Logo" 
                  className="w-10 h-10 rounded-xl object-cover border border-slate-800 shadow-lg"
                />
                <span className="font-black text-xl text-white tracking-tight uppercase">
                  SGA <span className="text-blue-500">NEWS</span>
                </span>
              </div>
              <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest leading-none">
                PUSAT REDAKSI & STAFF
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pt-2">
                Selamat datang di platform administrasi SGA News. Platform ini diisolasi khusus untuk Pemimpin Redaksi, Editor, dan Penulis Kontributor dalam mengelola warta publik.
              </p>
            </div>
          </div>

          <div className="pt-8 md:pt-0 space-y-4">
            <p className="text-[10px] text-slate-500">
              © 2026 SGA News Media Group. Hak Cipta Dilindungi Undang-Undang.
            </p>
          </div>
        </div>

        {/* Right column: Login / Register / Presets panel */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-slate-900/40">
          
          {/* Active User Status or Tab Selectors */}
          {currentUser ? (
            <div className="space-y-6">
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-lg font-black text-white">Sesi Akun Aktif</h3>
                <p className="text-xs text-slate-400">Anda telah masuk ke sistem staff redaksi.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <img 
                    src={getAuthorAvatar(currentUser.avatar, currentUser.role, currentUser.name, currentUser.isVerified)} 
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-800 shrink-0" 
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="truncate">{currentUser.name}</span>
                      {isUserAdminOrVerified(currentUser.role, currentUser.name, currentUser.isVerified) && <VerifiedBadge size="xs" />}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                    <span className="inline-block px-2 py-0.5 mt-1 text-[9px] font-black uppercase rounded bg-blue-950 text-blue-400 border border-blue-900">
                      {currentUser.role === 'admin' ? 'PEMRED / ADMIN' : currentUser.role === 'editor' ? 'REDAKTUR' : 'PENULIS KONTRIBUTOR'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-xl transition"
                  title="Keluar Akun"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {(currentUser.role === 'admin' || currentUser.role === 'editor') && (
                  <button
                    onClick={() => onNavigateToView('editor-cms')}
                    className="p-4 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-2xl transition shadow-lg flex flex-col items-center justify-center text-center gap-2 border border-amber-500"
                  >
                    <Layout className="w-6 h-6" />
                    <span>Masuk ke Dashboard Redaksi</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigateToView('author-cms')}
                  className="p-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-2xl transition shadow-lg flex flex-col items-center justify-center text-center gap-2 border border-blue-500"
                >
                  <PenTool className="w-6 h-6" />
                  <span>Masuk ke CMS Penulis</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition border border-dashed border-slate-800"
                >
                  Ganti Akun / Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Tab selector */}
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError('');
                  }}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'login'
                      ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk Akun
                </button>
                <button
                  onClick={() => {
                    setActiveTab('register');
                    setLoginError('');
                  }}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 ${
                    activeTab === 'register'
                      ? 'bg-slate-900 text-white shadow-sm border border-slate-800'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Daftar Penulis
                </button>
              </div>

              {/* TAB: MANUAL EMAIL LOGIN */}
              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Kredensial Redaksi</h4>
                    <p className="text-xs text-slate-400">Masuk dengan akun terdaftar atau akun Pemred.</p>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-red-950/40 border border-red-900 text-red-400 text-xs rounded-xl font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        ID / Alamat Email Staff
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="admin@sganews.id atau nama@sganews.id"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Kata Sandi Keamanan
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Lock className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Autentikasi & Masuk</span>
                  </button>
                </form>
              )}

              {/* TAB: REGISTER WRITER */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">Formulir Penulis Baru</h4>
                    <p className="text-xs text-slate-400">Daftarkan diri Anda sebagai penulis warta baru di SGA News.</p>
                  </div>

                  {registerSuccess ? (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{registerSuccess}</span>
                    </div>
                  ) : (
                    <>
                      {loginError && (
                        <div className="p-3 bg-red-950/40 border border-red-900 text-red-400 text-xs rounded-xl font-medium">
                          {loginError}
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Nama Lengkap Jurnalis
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="misal: Rahadian Maulana"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Alamat Email Resmi
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="nama@sganews.id"
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Kata Sandi
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="Minimal 6 karakter"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Biografi Singkat (Keahlian/Topik)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Jurnalis daerah, pengamat sepak bola, pengamat teknologi..."
                            value={newBio}
                            onChange={e => setNewBio(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-4 bg-slate-100 text-slate-950 hover:bg-white font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4 text-slate-950" />
                        <span>Daftarkan Kontributor</span>
                      </button>
                    </>
                  )}
                </form>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
