import React, { useState, useRef } from 'react';
import { User } from '../types';
import { 
  Camera, 
  X, 
  Upload, 
  Link as LinkIcon, 
  Grid, 
  Check, 
  User as UserIcon, 
  Sparkles,
  Save
} from 'lucide-react';
import { setCurrentUser, getStoredUsers } from '../utils/storage';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdated: (updatedUser: User) => void;
}

// 12 High-Quality Preset Avatars (Professional & Journalistic)
const PRESET_AVATARS = [
  { id: 'sga-logo', name: 'Logo Resmi SGA News', url: 'https://ik.imagekit.io/dxokd3m9y/sgaicon.png' },
  { id: '1', name: 'Jurnalis Pria 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250' },
  { id: '2', name: 'Jurnalis Pria 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250' },
  { id: '3', name: 'Jurnalis Wanita 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250' },
  { id: '4', name: 'Jurnalis Wanita 2', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250' },
  { id: '5', name: 'Editor Formal', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250' },
  { id: '6', name: 'Penulis Kreatif', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250' },
  { id: '7', name: 'Penulis Sains', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250' },
  { id: '8', name: 'Analis Bisnis', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250' },
  { id: '9', name: 'Jurnalis Olahraga', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250' },
  { id: '10', name: 'Kreator Konten', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250' },
  { id: '11', name: 'Penulis Seni', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250' },
  { id: '12', name: 'Jurnalis Minimalis', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250' },
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  
  // Profile Form States
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setAvatarUrl(currentUser.avatar || '');
    }
  }, [currentUser]);
  
  // Custom URL input state
  const [customUrlInput, setCustomUrlInput] = useState('');
  
  // UI Status
  const [uploadError, setUploadError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !currentUser) return null;

  // Handle local image file upload (converts to Base64 data URL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Ukuran file maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        setSuccessMsg('Foto profil berhasil diunggah!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    };
    reader.onerror = () => {
      setUploadError('Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  // Handle image URL submission
  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    const trimmed = customUrlInput.trim();
    if (!trimmed) {
      setUploadError('Harap masukkan URL foto yang valid.');
      return;
    }
    setAvatarUrl(trimmed);
    setCustomUrlInput('');
    setSuccessMsg('Tautan foto profil berhasil diterapkan!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Handle saving profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    setUploadError('');

    const updatedUser: User = {
      ...currentUser,
      name: name.trim() || currentUser.name,
      avatar: avatarUrl || currentUser.avatar,
      bio: bio.trim()
    };

    try {
      // 1. Update current user in localStorage
      setCurrentUser(updatedUser);

      // 2. Update users list in localStorage
      const usersList = getStoredUsers();
      const updatedList = usersList.map(u => u.id === currentUser.id ? updatedUser : u);
      // If user isn't in list yet, append
      if (!usersList.some(u => u.id === currentUser.id)) {
        updatedList.push(updatedUser);
      }
      localStorage.setItem('sga_news_users_v1', JSON.stringify(updatedList));

      // 3. Sync to Firestore if available
      if (db) {
        try {
          await setDoc(doc(db, 'users', currentUser.id), updatedUser, { merge: true });
        } catch (err) {
          console.warn('Firestore user update sync note:', err);
        }
      }

      // 4. Update React state
      onUserUpdated(updatedUser);
      setSuccessMsg('Profil dan foto berhasil diperbarui!');
      
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 500);

    } catch (err) {
      console.error('Error saving user profile:', err);
      setUploadError('Gagal menyimpan perubahan profil.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                Ubah Foto Profil & Profil Akun
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur foto profil resmi untuk postingan berita Anda
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            aria-label="Tutup Dialog"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Profile Card Preview */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-4">
          <div className="relative shrink-0 group">
            <img 
              src={avatarUrl} 
              alt="Pratinjau Foto Profil" 
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Ganti Foto"
              className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                {name || 'Nama Penulis'}
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
              {bio || 'Belum ada biografi singkat.'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {currentUser.email}
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {uploadError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs rounded-xl font-medium">
            {uploadError}
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" />
            {successMsg}
          </div>
        )}

        {/* Photo Selection Tabs */}
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Pilih Sumber Foto Profil
          </label>

          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Unggah File
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Pilihan Avatar
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Link URL
            </button>
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 text-center cursor-pointer transition group"
              >
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Klik untuk Memilih File Foto dari Perangkat
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Mendukung JPG, PNG, WebP (Maksimal 5MB)
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PRESET AVATARS GRID */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = avatarUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(preset.url);
                      setSuccessMsg(`Memilih avatar: ${preset.name}`);
                      setTimeout(() => setSuccessMsg(''), 2000);
                    }}
                    title={preset.name}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition transform hover:scale-105 ${
                      isSelected 
                        ? 'border-blue-600 ring-2 ring-blue-500/50 scale-105' 
                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.name}
                      className="w-full h-full object-cover" 
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 3: CUSTOM URL INPUT */}
          {activeTab === 'url' && (
            <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-153..."
                value={customUrlInput}
                onChange={e => setCustomUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:bg-slate-800 transition"
              >
                Gunakan
              </button>
            </form>
          )}
        </div>

        {/* Edit Name & Bio Inputs */}
        <form onSubmit={handleSaveProfile} className="mt-5 space-y-3.5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Pengguna / Penulis
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Biografi Singkat Penulis
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tuliskan biografi singkat Anda..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Menyimpan...' : 'Simpan Foto & Profil'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
