import React from 'react';

interface MobileAppContainerProps {
  children: React.ReactNode;
  appName?: string;
  appType?: 'rider' | 'driver' | 'admin' | 'auth';
  onBackToWebsite?: () => void;
  onNavigate?: (view: 'website' | 'rider' | 'driver' | 'admin') => void;
}

export const MobileAppContainer: React.FC<MobileAppContainerProps> = ({
  children,
  appName = 'Wadaage Mobility',
  appType = 'rider',
  onBackToWebsite,
  onNavigate,
}) => {
  return (
    <div className="w-full min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-center items-center relative overflow-x-hidden selection:bg-emerald-600 selection:text-white font-sans">
      {/* Main Viewport Container */}
      <main className="w-full h-[100dvh] sm:h-auto sm:py-2 flex items-center justify-center overflow-hidden">
        {/* Smartphone Device Frame on Desktop / 100% Full View on Mobile */}
        <div className="w-full sm:max-w-[430px] h-[100dvh] sm:h-[900px] sm:max-h-[calc(100vh-20px)] bg-slate-950 sm:rounded-[44px] sm:border-[6px] sm:border-slate-800/90 sm:shadow-2xl sm:shadow-black/90 flex flex-col relative overflow-hidden transition-all duration-300 ring-1 ring-slate-700/50">
          {/* Real Native Application Screen Content */}
          <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative bg-slate-900">
            {children}
          </div>

          {/* Bottom Native Gesture Navigation Bar (Home Indicator) */}
          <div className="w-full py-1 bg-slate-950/80 flex justify-center items-center shrink-0 border-t border-slate-900/60 z-20">
            <span className="w-32 h-1 bg-slate-600/60 rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
};
