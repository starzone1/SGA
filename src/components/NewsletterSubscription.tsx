import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const NewsletterSubscription: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [subscribedEmail, setSubscribedEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmed = email.trim();
    if (!trimmed) {
      setStatus('error');
      setErrorMessage('Silakan masukkan alamat email Anda.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setStatus('error');
      setErrorMessage('Format alamat email tidak valid.');
      return;
    }

    setStatus('loading');

    // Simulate async subscription registration
    setTimeout(() => {
      setSubscribedEmail(trimmed);
      setStatus('success');
      setEmail('');
    }, 800);
  };

  const handleReset = () => {
    setStatus('idle');
    setSubscribedEmail('');
    setEmail('');
    setErrorMessage('');
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md text-white font-sans space-y-3.5 relative overflow-hidden">
      {/* Decorative accent light */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-600/30 border border-blue-500/40 rounded-xl shrink-0 flex items-center justify-center">
          <img
            src="https://ik.imagekit.io/dxokd3m9y/sgaicon.png"
            alt="SGA NEWS"
            className="w-6 h-6 object-contain"
          />
        </div>
        <div>
          <h3 className="text-sm font-extrabold tracking-tight text-white uppercase">
            SGA NEWS
          </h3>
          <p className="text-[11px] text-slate-300 font-medium">
            Dapatkan warta berita pilihan setiap pagi
          </p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3.5 space-y-2 text-emerald-200 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-emerald-300">Berhasil Berlangganan!</p>
              <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                Terima kasih! Ringkasan berita terkini akan dikirimkan secara berkala ke <span className="font-semibold underline text-white">{subscribedEmail}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline pt-1 block"
          >
            Gunakan email lain
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubscribe} className="space-y-2.5">
          <p className="text-xs text-slate-300 leading-relaxed">
            Berlangganan gratis untuk mendapatkan kilasan warta terpopuler, analisis mendalam, dan berita hangat langsung di kotak masuk Anda.
          </p>

          <div className="space-y-1.5">
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="Masukkan email Anda..."
                disabled={status === 'loading'}
                className={`w-full pl-3.5 pr-20 py-2.5 bg-slate-800/80 border text-xs text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  status === 'error' ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                }`}
              />

              <button
                type="submit"
                disabled={status === 'loading'}
                className="absolute right-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Kirim</span>
                  </>
                ) : (
                  <>
                    <span>Daftar</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>

            {status === 'error' && errorMessage && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-400 pt-0.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            🔒 Tanpa spam. Anda dapat berhenti berlangganan kapan saja.
          </p>
        </form>
      )}
    </div>
  );
};
