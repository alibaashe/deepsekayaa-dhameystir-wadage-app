import React from 'react';

export interface WadaageLogoProps {
  variant?: 'badge' | 'icon' | 'wordmark' | 'full' | 'header';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  theme?: 'dark' | 'light' | 'transparent';
  colorMode?: 'white' | 'dark' | 'auto';
  showTagline?: boolean;
  appType?: 'rider' | 'driver' | 'admin';
  useImage?: boolean;
}

export const WadaageLogo: React.FC<WadaageLogoProps> = ({
  variant = 'wordmark',
  size = 'md',
  className = '',
  theme = 'transparent',
  colorMode = 'auto',
  showTagline = false,
  appType = 'rider',
  useImage = false,
}) => {
  const isDriver = appType === 'driver';

  // Determine stroke color based on colorMode and theme
  let effectiveStrokeColor = '#FFFFFF';
  if (colorMode === 'dark' || (colorMode === 'auto' && theme === 'light')) {
    effectiveStrokeColor = '#0F172A';
  } else if (colorMode === 'white' || (colorMode === 'auto' && (theme === 'dark' || theme === 'transparent'))) {
    effectiveStrokeColor = '#FFFFFF';
  }

  // Size definitions
  const sizeConfig: Record<string, { badge: string; wordmarkH: number; icon: string }> = {
    xs: { badge: 'w-8 h-8', wordmarkH: 26, icon: 'w-7 h-7' },
    sm: { badge: 'w-11 h-11', wordmarkH: 34, icon: 'w-9 h-9' },
    md: { badge: 'w-16 h-16', wordmarkH: 42, icon: 'w-12 h-12' },
    lg: { badge: 'w-24 h-24', wordmarkH: 54, icon: 'w-16 h-16' },
    xl: { badge: 'w-36 h-36', wordmarkH: 70, icon: 'w-24 h-24' },
    '2xl': { badge: 'w-52 h-52', wordmarkH: 90, icon: 'w-36 h-36' },
    custom: { badge: 'w-full h-full', wordmarkH: 42, icon: 'w-full h-full' },
  };

  const dim = sizeConfig[size] || sizeConfig.md;

  // 1. Clean Wordmark Typography (Preserving Authentic Wadaage Brand Identity)
  const renderWordmark = () => {
    return (
      <div className="flex items-center space-x-1.5 select-none leading-none">
        <span
          className={`font-black tracking-tight font-sans ${
            effectiveStrokeColor === '#0F172A' ? 'text-slate-900' : 'text-white'
          }`}
          style={{ fontSize: Math.max(14, dim.wordmarkH * 0.52) }}
        >
          Wadaage
        </span>
        <span
          className={`px-1.5 py-0.5 rounded font-black uppercase tracking-wider text-[9px] ${
            isDriver
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {isDriver ? 'Driver' : 'Share'}
        </span>
      </div>
    );
  };

  // 2. Circular Emblem Badge (Authentic High-Definition Logo Asset - No Editing, Exact Design & Handwriting)
  const renderBadgeSVG = () => {
    const imgSrc = isDriver ? '/darwelllogo.png' : '/riderlogo.png';
    const fallbackSrc = isDriver ? '/darwelllogo.jpg' : '/riderlogo.jpg';
    return (
      <div className={`relative ${dim.badge} flex items-center justify-center shrink-0`}>
        <img
          src={imgSrc}
          alt={isDriver ? 'Wadaage Driver' : 'Wadaage Share'}
          className="w-full h-full object-contain rounded-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)] select-none pointer-events-none"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (target.src !== fallbackSrc && !target.src.endsWith(fallbackSrc)) {
              target.src = fallbackSrc;
            }
          }}
        />
      </div>
    );
  };

  // 3. Icon Mode (Circular Icon Badge)
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${dim.icon} ${className}`}>
        {renderBadgeSVG()}
      </div>
    );
  }

  // 4. Badge / Full Mode
  if (variant === 'badge' || variant === 'full') {
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        {renderBadgeSVG()}
        {showTagline && (
          <span className="mt-2 text-xs font-black tracking-wider text-emerald-500 uppercase">
            {isDriver ? 'Darawell Fleet Somaliland' : 'Share the ride. Save more.'}
          </span>
        )}
      </div>
    );
  }

  // 5. Header / Wordmark Mode
  if (variant === 'header') {
    return (
      <div
        className={`inline-flex items-center space-x-2.5 select-none ${
          theme === 'dark'
            ? 'bg-[#08162b] px-3 py-1.5 rounded-2xl border border-slate-800 shadow-md'
            : theme === 'light'
            ? 'bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm'
            : ''
        } ${className}`}
      >
        {renderBadgeSVG()}
        {renderWordmark()}
      </div>
    );
  }

  // Wordmark Mode
  return (
    <div
      className={`inline-flex items-center space-x-2 select-none ${
        theme === 'dark'
          ? 'bg-[#08162b] px-3 py-1.5 rounded-2xl border border-slate-800 shadow-md'
          : theme === 'light'
          ? 'bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm'
          : ''
      } ${className}`}
    >
      {renderWordmark()}
    </div>
  );
};
