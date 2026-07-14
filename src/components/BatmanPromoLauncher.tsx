import React, { useState, useEffect } from 'react';
import { BatmanPromoModal } from './BatmanPromoModal';
import { ShieldCheck, Flame } from 'lucide-react';

export function BatmanPromoLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldShowLauncher, setShouldShowLauncher] = useState(false);

  useEffect(() => {
    // 1. Check if the user has already seen the modal in this session to avoid annoying them
    const hasSeenPromo = sessionStorage.getItem('kancah4d_promo_shown');
    
    // Show launcher after a brief delay
    const launcherTimer = setTimeout(() => {
      setShouldShowLauncher(true);
    }, 1000);

    // Auto open modal on first session visit after 2.5 seconds
    if (!hasSeenPromo) {
      const modalTimer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem('kancah4d_promo_shown', 'true');
      }, 2500);

      return () => {
        clearTimeout(launcherTimer);
        clearTimeout(modalTimer);
      };
    }

    return () => clearTimeout(launcherTimer);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!shouldShowLauncher) return null;

  return (
    <>
      {/* Glowing Floating Action Launcher Button */}
      <div className="fixed bottom-24 left-6 z-[9999] flex flex-col items-center">
        {/* Floating Pulsing Chrome Circle resembling Pola SLOT */}
        <button
          onClick={handleOpen}
          className="relative group w-[58px] h-[58px] rounded-full bg-gradient-to-tr from-slate-500 via-white to-slate-400 p-[3px] shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_0_25px_rgba(234,88,12,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer animate-bounce"
          style={{ animationDuration: '4s' }}
          title="Buka Pola SLOT KANCAH4D"
        >
          {/* Inner Circle displaying the customized logo image */}
          <div className="w-full h-full rounded-full bg-slate-950/80 backdrop-blur-sm relative flex items-center justify-center overflow-hidden">
            <img 
              src="https://ik.imagekit.io/dxokd3m9y/favbolakancah.png" 
              alt="Kancah4D Logo" 
              className="w-10 h-10 object-contain select-none group-hover:scale-110 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Pulse Outer Rings */}
          <span className="absolute -inset-1 rounded-full border border-yellow-500/20 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
        </button>
      </div>

      {/* Render the promo modal */}
      <BatmanPromoModal isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
