import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  ArrowLeft, 
  Copy, 
  Check, 
  ShieldCheck, 
  MailOpen 
} from 'lucide-react';
import { 
  generateSecureResetRequest, 
  verifyOtpAndResetPassword, 
  verifyTokenAndResetPassword 
} from '../services/firestoreService';
import { SecureResetRequest } from '../types';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Secure OTP Flow States
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [activeRequest, setActiveRequest] = useState<SecureResetRequest | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    // Reset all states
    setEmail('');
    setIsLoading(false);
    setErrorMessage('');
    setSuccessMessage('');
    setStep('request');
    setActiveRequest(null);
    setOtpInput('');
    setNewPassword('');
    setConfirmPassword('');
    setCopied(false);
    onClose();
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
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
      const req = await generateSecureResetRequest(cleanEmail);
      setActiveRequest(req);
      setStep('verify');
    } catch (error: any) {
      console.error('Request secure reset failed:', error);
      setErrorMessage(
        error.message || 'Gagal membuat verifikasi keamanan. Pastikan alamat email terdaftar.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanOtp = otpInput.trim();
    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanOtp) {
      setErrorMessage('Harap masukkan kode OTP 6-digit.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Harap masukkan kata sandi baru Anda.');
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMessage('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtpAndResetPassword(email, cleanOtp, cleanPass);
      setSuccessMessage(
        'Kata sandi Anda berhasil diperbarui dengan aman! Anda sekarang dapat masuk kembali ke Portal Redaksi SGA menggunakan kata sandi baru.'
      );
      setStep('success');
    } catch (error: any) {
      console.error('OTP verification failed:', error);
      setErrorMessage(
        error.message || 'Gagal menyetel ulang kata sandi. Pastikan kode OTP benar dan belum kedaluwarsa.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantLinkReset = async () => {
    if (!activeRequest) return;
    setErrorMessage('');
    setSuccessMessage('');

    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass) {
      setErrorMessage('Harap masukkan kata sandi baru terlebih dahulu sebelum memverifikasi tautan.');
      return;
    }

    if (cleanPass.length < 6) {
      setErrorMessage('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyTokenAndResetPassword(email, activeRequest.token, cleanPass);
      setSuccessMessage(
        'Kata sandi Anda berhasil diperbarui secara instan via Tautan Verifikasi Aman! Silakan masuk kembali ke Portal Redaksi.'
      );
      setStep('success');
    } catch (error: any) {
      console.error('Token verification failed:', error);
      setErrorMessage(
        error.message || 'Verifikasi tautan keamanan gagal atau telah kedaluwarsa.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyOtp = () => {
    if (!activeRequest) return;
    navigator.clipboard.writeText(activeRequest.otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="forgot-password-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div id="forgot-password-modal-container" className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col p-6 space-y-4 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight uppercase">
              Verifikasi Keamanan Akun
            </h3>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Display */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-400 text-xs rounded-xl font-medium flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: REQUEST OTP / VERIFICATION */}
        {step === 'request' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="p-3 bg-blue-950/20 border border-blue-900/40 rounded-xl space-y-1">
              <h4 className="text-xs font-bold text-blue-400">🛡️ Proteksi Anti-Pembajakan Aktif</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Untuk mencegah penyalahgunaan akun, kami menonaktifkan reset instan berbasis nama. Penyetelan ulang kata sandi sekarang memerlukan verifikasi Kode OTP dinamis yang dikirimkan ke email terdaftar Anda.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Alamat Email Terdaftar
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
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
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
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    <span>Kirim Kode Keamanan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY CODE & NEW PASSWORD */}
        {step === 'verify' && activeRequest && (
          <div className="space-y-4">
            
            {/* SGA SECURITY EMAIL SANDBOX */}
            <div className="border border-amber-900/40 bg-slate-950 rounded-xl overflow-hidden shadow-lg animate-fade-in">
              {/* Sandbox Top Rail */}
              <div className="px-3.5 py-2 bg-amber-950/30 border-b border-amber-900/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">
                    SGA Security Mail Sandbox
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                  Mode Simulasi Pengujian
                </span>
              </div>

              {/* Email Content */}
              <div className="p-4 space-y-3">
                <div className="space-y-1 text-[11px] border-b border-slate-800/60 pb-2">
                  <div className="flex text-slate-400">
                    <span className="w-14 shrink-0 font-medium">Pengirim:</span>
                    <span className="text-slate-300 font-bold">Keamanan SGA <code className="text-blue-400">&lt;security@sganews.co.id&gt;</code></span>
                  </div>
                  <div className="flex text-slate-400">
                    <span className="w-14 shrink-0 font-medium">Penerima:</span>
                    <span className="text-amber-400 font-bold">{activeRequest.email}</span>
                  </div>
                  <div className="flex text-slate-400">
                    <span className="w-14 shrink-0 font-medium">Subjek:</span>
                    <span className="text-white font-bold">🔐 KODE KEAMANAN: Reset Kata Sandi SGA News Portal</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Halo Rekan Redaksi,<br />
                    Sistem mendeteksi permintaan pengaturan ulang kata sandi untuk akun Anda. Gunakan kode OTP 6-digit berikut untuk memverifikasi identitas Anda secara aman:
                  </p>

                  {/* Interactive OTP Card */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Kode OTP Rahasia</span>
                      <span className="text-xl font-mono font-black tracking-widest text-amber-400">{activeRequest.otp}</span>
                    </div>
                    <button
                      onClick={handleCopyOtp}
                      type="button"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] rounded-md transition flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin OTP</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Secure Link Option */}
                  <div className="pt-1.5 text-center">
                    <span className="text-[10px] text-slate-500 block mb-1.5">— ATAU GUNAKAN TAUTAN VERIFIKASI INSTAN —</span>
                    <button
                      onClick={handleInstantLinkReset}
                      type="button"
                      className="w-full py-2.5 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-extrabold text-[11px] rounded-lg transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <MailOpen className="w-3.5 h-3.5 text-blue-200" />
                      <span>🔑 Verifikasi Otomatis via Tautan Email</span>
                    </button>
                    <p className="text-[9px] text-slate-500 mt-1 leading-relaxed italic">
                      *Klik tombol verifikasi otomatis di atas jika Anda ingin menyimulasikan "mengklik tautan reset aman" yang dikirimkan di dalam inbox email Anda.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800/40 pt-2 text-[9px] text-slate-500 leading-normal">
                  💡 <strong>Mengapa panel ini muncul?</strong> Di lingkungan produksi nyata, email verifikasi ini dikirimkan otomatis ke inbox email pribadi Anda melalui Firebase Auth. Di dalam AI Studio sandbox, kami menampilkan kotak masuk simulasi ini agar Anda dapat menyalin OTP & menguji fungsionalitas sistem keamanan secara penuh tanpa batasan pengiriman email eksternal.
                </div>
              </div>
            </div>

            {/* OTP VERIFICATION & NEW PASSWORD FORM */}
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-3 pt-1">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Konfigurasi Sandi Baru
                </h4>
                
                {/* OTP Input */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Masukkan 6-Digit Kode OTP
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    disabled={isLoading}
                    placeholder="Contoh: 123456"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-400 font-mono font-extrabold text-center tracking-widest placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Kata Sandi Baru (Min. 6 Karakter)
                  </label>
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    placeholder="Sandi baru Anda"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ulangi Kata Sandi Baru
                  </label>
                  <input
                    type="password"
                    required
                    disabled={isLoading}
                    placeholder="Ulangi sandi baru"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Simpan Sandi via OTP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'success' && (
          <div className="space-y-4 py-2 text-center">
            <div className="w-14 h-14 bg-emerald-950/40 border border-emerald-900 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Reset Sandi Berhasil!
              </h4>
              <p className="text-xs text-slate-400 px-4 leading-relaxed">
                {successMessage}
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition shadow-lg"
            >
              Kembali ke Halaman Masuk
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
