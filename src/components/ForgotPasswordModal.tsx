import React, { useState } from 'react';
import { X, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sendPasswordReset } from '../services/firestoreService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Harap masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(cleanEmail);
      setSuccessMessage(
        'Email pemulihan kata sandi telah dikirim! Silakan periksa kotak masuk (inbox) atau folder spam email Anda untuk menyetel ulang kata sandi.'
      );
      setEmail('');
    } catch (error: any) {
      console.error('Password reset failed:', error);
      setErrorMessage(
        error.message || 'Gagal mengirim email reset kata sandi. Pastikan email terdaftar dan coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="forgot-password-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div id="forgot-password-modal-container" className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            <h3 className="font-extrabold text-white text-base tracking-tight">
              LUPA KATA SANDI
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-slate-400 leading-relaxed">
          Masukkan alamat email pendaftaran Anda. Kami akan mengirimkan tautan (link) resmi melalui Firebase Auth untuk mereset kata sandi Anda dengan aman.
        </p>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs rounded-xl font-bold flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-900 text-red-400 text-xs rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Alamat Email Akun
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    disabled={isLoading}
                    placeholder="sopsofiah15@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-600" />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Kirim Link Reset</span>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
