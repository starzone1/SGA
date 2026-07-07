import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { VerifiedBadge, isUserAdminOrVerified, getAuthorAvatar } from './VerifiedBadge';
import { Shield, Lock, PlusCircle, LogIn, LogOut, UserCheck, ArrowLeft, PenTool, Layout, FileText, CheckCircle2, AlertCircle, Mail } from 'lucide-react';
import { getStoredUsers, setCurrentUser } from '../utils/storage';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { signInUserWithAuth, signUpUserWithAuth } from '../services/firestoreService';
import { ForgotPasswordModal } from './ForgotPasswordModal';

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
  const [newRecoveryPin, setNewRecoveryPin] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  // Forgot Password Modal State & Auth loading state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsAuthChecking(true);

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (!cleanEmail || !cleanPass) {
      setLoginError('Harap isi email dan kata sandi Anda.');
      setIsAuthChecking(false);
      return;
    }

    try {
      const user = await signInUserWithAuth(cleanEmail, cleanPass);
      setCurrentUser(user);
      onUserChanged(user);
      
      if (user.role === 'admin' || user.role === 'editor') {
        onNavigateToView('editor-cms');
        try {
          window.history.pushState({ view: 'editor-cms' }, '', '/redaksi/editor');
        } catch (err) {}
      } else {
        onNavigateToView('author-cms');
        try {
          window.history.pushState({ view: 'author-cms' }, '', '/redaksi/penulis');
        } catch (err) {}
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setLoginError(error.message || 'Gagal masuk. Periksa kembali email dan kata sandi.');
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setRegisterSuccess('');

    if (!newName || !newEmail || !newPassword || !newRecoveryPin) {
      setLoginError('Harap lengkapi semua kolom wajib (termasuk PIN Pemulihan).');
      return;
    }

    if (newPassword.trim().length < 6) {
      setLoginError('Kata sandi minimal harus 6 karakter.');
      return;
    }

    const cleanPin = newRecoveryPin.trim();
    if (cleanPin.length !== 6 || isNaN(Number(cleanPin))) {
      setLoginError('PIN Pemulihan Akun harus berupa 6 digit angka.');
      return;
    }

    setIsAuthChecking(true);
    try {
      const user = await signUpUserWithAuth(newEmail, newPassword, newName, newBio, cleanPin);
      setCurrentUser(user);
      onUserChanged(user);
      setRegisterSuccess('Pendaftaran berhasil! Akun Penulis Komunitas Anda telah aktif.');
      setTimeout(() => {
        onNavigateToView('author-cms');
        try {
          window.history.pushState({ view: 'author-cms' }, '', '/redaksi/penulis');
        } catch (ev) {}
      }, 1000);
    } catch (error: any) {
      console.error('Sign up error:', error);
      setLoginError(error.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    onUserChanged(null);
  };

  if (isAuthChecking) {
    return (
      <div id="redaksi-portal-loading-skeleton" className="min-h-[80vh] flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8 bg-slate-950">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-pulse">
          {/* Left Sidebar Skeleton */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-950 to-slate-900 p-8 flex flex-col justify-between border-r border-slate-800/60 space-y-6">
            <div className="space-y-6">
              <div className="h-4 w-28 bg-slate-800 rounded-md"></div>
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
                  <div className="h-6 w-32 bg-slate-800 rounded-md"></div>
                </div>
                <div className="h-3 w-40 bg-slate-800 rounded-md"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-full bg-slate-800 rounded-md"></div>
                  <div className="h-3 w-3/4 bg-slate-800 rounded-md"></div>
                </div>
              </div>
            </div>
            <div className="h-3 w-48 bg-slate-800 rounded-md"></div>
          </div>

          {/* Right Content Form Skeleton */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-slate-900/40 space-y-6">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-slate-800 rounded-md"></div>
              <div className="h-3.5 w-32 bg-slate-800 rounded-md"></div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-800 rounded-md"></div>
                <div className="h-10 w-full bg-slate-800 rounded-xl"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-28 bg-slate-800 rounded-md"></div>
                <div className="h-10 w-full bg-slate-800 rounded-xl"></div>
              </div>
              <div className="h-12 w-full bg-slate-800 rounded-xl mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">SGA NEWS PORTAL</h4>
                    <p className="text-xs text-slate-400">Login Akun SGA News Portal</p>
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
                        USERNAME / EMAIL
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Username"
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

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline transition flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Lupa Kata Sandi? Reset di Sini
                    </button>
                  </div>
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
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              PIN Pemulihan Akun (6 Digit Angka)
                            </label>
                            <span className="text-[10px] text-amber-500 font-bold">Penting & Rahasia!</span>
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            pattern="\d{6}"
                            placeholder="Contoh: 882910"
                            value={newRecoveryPin}
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, ''); // only allow digits
                              setNewRecoveryPin(val);
                            }}
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <p className="text-[10px] text-slate-500 mt-1">Gunakan PIN ini untuk menyetel ulang kata sandi secara instan & aman jika Anda lupa sandi di kemudian hari.</p>
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

      {/* Forgot Password Modal Support */}
      <ForgotPasswordModal 
        isOpen={isForgotPasswordOpen} 
        onClose={() => setIsForgotPasswordOpen(false)} 
      />
    </div>
  );
};
