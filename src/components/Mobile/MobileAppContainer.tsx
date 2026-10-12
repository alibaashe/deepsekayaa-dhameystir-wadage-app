import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Shield, Car, User, Sparkles, Navigation } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { UserRole } from '../../types';

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
  const { role } = useRide();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-center items-center relative overflow-x-hidden selection:bg-blue-600 selection:text-white font-sans">
      {/* Main Viewport Container */}
      <main className="w-full h-[100dvh] sm:h-auto sm:py-2 flex items-center justify-center overflow-hidden">
        {/* Smartphone Device Frame on Desktop / 100% Full View on Mobile */}
        <div className="w-full sm:max-w-[420px] h-[100dvh] sm:h-[870px] sm:max-h-[calc(100vh-60px)] bg-slate-950 sm:rounded-[48px] sm:border-[8px] sm:border-slate-800/90 sm:shadow-2xl sm:shadow-black/90 flex flex-col relative overflow-hidden transition-all duration-300 ring-1 ring-slate-700/50">

          {/* Real Native Application Screen Content */}
          <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative bg-slate-900">
            {children}
          </div>

          {/* Bottom Native Gesture Navigation Bar (Home Indicator) */}
          <div className="w-full py-1 bg-slate-950 flex justify-center items-center shrink-0 border-t border-slate-900">
            <span className="w-32 h-1 bg-slate-600 rounded-full hover:bg-slate-400 transition cursor-pointer" />
          </div>
        </div>
      </main>
    </div>
  );
};
