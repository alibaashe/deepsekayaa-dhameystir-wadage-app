import React from 'react';

// 1. Official Wadaage Share Circular Emblem Badge (As shown in all 6 screens)
export const WadaageShareEmblem: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}> = ({ size = 'md', className = '', showText = false }) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 select-none ${className}`}>
      <div className={`relative ${sizeMap[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_16px_rgba(0,102,255,0.35)] overflow-visible"
        >
          <defs>
            <radialGradient id="badgeRadialBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0B3060" />
              <stop offset="65%" stopColor="#051B38" />
              <stop offset="100%" stopColor="#031024" />
            </radialGradient>
            <linearGradient id="badgeBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00E575" />
              <stop offset="40%" stopColor="#00A3FF" />
              <stop offset="100%" stopColor="#0052CC" />
            </linearGradient>
            <linearGradient id="limePinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#76FF03" />
              <stop offset="100%" stopColor="#00E575" />
            </linearGradient>
          </defs>

          {/* Circular Navy Canvas */}
          <circle cx="100" cy="100" r="92" fill="url(#badgeRadialBg)" />

          {/* Outer Border Glowing Ring */}
          <circle cx="100" cy="100" r="88" stroke="url(#badgeBorderGrad)" strokeWidth="4.5" />
          <circle cx="100" cy="100" r="80" stroke="#00E575" strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* Top Pin Over Car */}
          <g transform="translate(100, 28)">
            <path
              d="M 0 0 C -7 0 -13 6 -13 13 C -13 22 0 35 0 35 C 0 35 13 22 13 13 C 13 6 7 0 0 0 Z"
              fill="url(#limePinGrad)"
            />
            <circle cx="0" cy="12" r="4.5" fill="#051B38" />
          </g>

          {/* Car Graphic with 3 Passengers */}
          <g transform="translate(100, 72)" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Car body chassis */}
            <path
              d="M -35 10 C -30 -3 -20 -10 -8 -11 L 8 -11 C 20 -10 30 -3 35 10 C 39 12 44 16 44 21 C 44 25 40 28 37 29 L 37 36 L 25 36 L 25 34 C 12 35 -12 35 -25 34 L -25 36 L -37 36 L -37 29 C -40 28 -44 25 -44 21 C -44 16 -39 12 -35 10 Z"
              fill="#062248"
            />
            {/* Windshield divide */}
            <path d="M -32 9 L 32 9" strokeWidth="2" />

            {/* 3 Passenger Silhouette Circles */}
            <circle cx="-16" cy="3" r="4.8" fill="#FFFFFF" />
            <circle cx="0" cy="0" r="5.8" fill="#FFFFFF" />
            <circle cx="16" cy="3" r="4.8" fill="#FFFFFF" />

            {/* Headlights & bumper accents */}
            <path d="M -37 22 C -33 23 -30 25 -28 28" stroke="#00E575" strokeWidth="2.5" />
            <path d="M 37 22 C 33 23 30 25 28 28" stroke="#00E575" strokeWidth="2.5" />
            <path d="M -12 28 L 12 28" stroke="#FFFFFF" strokeWidth="1.8" />
          </g>

          {/* Typography inside badge: "Wadaage" */}
          <text
            x="100"
            y="136"
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="21"
            fill="#FFFFFF"
            letterSpacing="0.5"
          >
            Wadaage
          </text>

          {/* Subtitle inside badge: "— Share —" */}
          <g transform="translate(100, 154)">
            <line x1="-38" y1="-2" x2="-22" y2="-2" stroke="#00E575" strokeWidth="2" strokeLinecap="round" />
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="12"
              fill="#00E575"
              letterSpacing="1.5"
            >
              Share
            </text>
            <line x1="22" y1="-2" x2="38" y2="-2" stroke="#00E575" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="mt-1 flex items-center space-x-1 font-black tracking-tight select-none">
          <span className="text-[#0066FF] text-xl">Wadaage</span>
          <span className="text-[#00C853] text-xl">Share</span>
        </div>
      )}
    </div>
  );
};

// 2. Header Brand Logo: Emblem + "Wadaage Share" Text (Used in Step 1, 2, 3 header)
export const WadaageShareHeaderLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center space-x-2 select-none ${className}`}>
      <WadaageShareEmblem size="sm" />
      <div className="flex items-center font-black tracking-tight leading-none text-base sm:text-lg">
        <span className="text-[#0066FF]">Wadaage</span>
        <span className="text-[#00C853] ml-1">Share</span>
      </div>
    </div>
  );
};

// 3. Stylized Blue Hargeisa Skyline Silhouette (Screen 2 & Screen 5)
export const HargeisaSkylineSilhouette: React.FC<{ className?: string }> = ({ className = 'w-full h-20' }) => {
  return (
    <div className={`relative flex items-end justify-center overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 500 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          <linearGradient id="skylineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0099FF" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#0066FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0052CC" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="skylineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0088FF" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#0066FF" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#0088FF" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Skyline Silhouette Paths */}
        <path
          d="M 10 120 L 10 95 L 25 95 L 25 80 L 40 80 L 40 100 L 55 100 L 55 70 L 65 65 L 75 70 L 75 105 L 90 105 L 90 60 L 110 60 L 110 100 L 125 100 L 125 50 L 132 45 L 140 50 L 140 100 L 155 100 L 155 40 L 165 40 L 165 25 L 170 15 L 175 25 L 175 40 L 185 40 L 185 105 L 200 105 L 200 65 L 215 65 L 215 100 L 230 100 L 230 45 L 245 45 L 245 30 L 250 15 L 255 30 L 255 45 L 270 45 L 270 105 L 285 105 L 285 55 L 300 55 L 300 80 L 315 80 L 315 35 L 325 30 L 335 35 L 335 100 L 350 100 L 350 60 L 370 60 L 370 100 L 385 100 L 385 50 L 400 50 L 400 75 L 415 75 L 415 85 L 430 85 L 430 70 L 445 70 L 445 100 L 460 100 L 460 85 L 475 85 L 475 110 L 490 110 L 490 120 Z"
          fill="url(#skylineGrad)"
          stroke="url(#skylineStroke)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Windows and Details */}
        <g fill="#0066FF" fillOpacity="0.4">
          <rect x="95" y="68" width="4" height="4" rx="1" />
          <rect x="103" y="68" width="4" height="4" rx="1" />
          <rect x="95" y="78" width="4" height="4" rx="1" />
          <rect x="103" y="78" width="4" height="4" rx="1" />
          <rect x="160" y="48" width="4" height="4" rx="1" />
          <rect x="168" y="48" width="4" height="4" rx="1" />
          <rect x="160" y="58" width="4" height="4" rx="1" />
          <rect x="168" y="58" width="4" height="4" rx="1" />
          <rect x="238" y="52" width="4" height="4" rx="1" />
          <rect x="246" y="52" width="4" height="4" rx="1" />
          <rect x="238" y="62" width="4" height="4" rx="1" />
          <rect x="246" y="62" width="4" height="4" rx="1" />
        </g>
      </svg>
    </div>
  );
};

// 4. Architectural Line Illustration of Hargeisa Somaliland Landmark Buildings (Screen 3)
export const HargeisaLandmarksLineArt: React.FC<{ className?: string }> = ({ className = 'w-full h-24' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 340 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
      >
        <defs>
          <linearGradient id="landmarkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="50%" stopColor="#0099FF" />
            <stop offset="100%" stopColor="#0052CC" />
          </linearGradient>
        </defs>

        {/* Left Classic Building Facade */}
        <g stroke="url(#landmarkGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Roof Pediment */}
          <path d="M 15 35 L 50 15 L 85 35 Z" fill="#EBF4FF" />
          <line x1="12" y1="35" x2="88" y2="35" strokeWidth="2.5" />
          {/* Pillars */}
          <line x1="22" y1="35" x2="22" y2="85" />
          <line x1="38" y1="35" x2="38" y2="85" />
          <line x1="62" y1="35" x2="62" y2="85" />
          <line x1="78" y1="35" x2="78" y2="85" />
          {/* Base */}
          <line x1="10" y1="85" x2="90" y2="85" strokeWidth="3" />

          {/* Windows / Grids */}
          <rect x="27" y="44" width="8" height="12" rx="1" fill="#D6E8FF" />
          <rect x="65" y="44" width="8" height="12" rx="1" fill="#D6E8FF" />
          <rect x="27" y="64" width="8" height="12" rx="1" fill="#D6E8FF" />
          <rect x="65" y="64" width="8" height="12" rx="1" fill="#D6E8FF" />
        </g>

        {/* Center Label with Location Pin */}
        <g transform="translate(170, 48)">
          <text
            x="0"
            y="-4"
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="14"
            fill="#0052CC"
          >
            Hargeysa
          </text>
          <text
            x="0"
            y="14"
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
            fontWeight="700"
            fontSize="12"
            fill="#0066FF"
          >
            Somaliland
          </text>

          {/* Blue Location Pin Icon */}
          <g transform="translate(-8, 22)">
            <path
              d="M 8 0 C 4 0 1 3 1 7 C 1 12 8 20 8 20 C 8 20 15 12 15 7 C 15 3 12 0 8 0 Z"
              fill="#0066FF"
            />
            <circle cx="8" cy="7" r="2.5" fill="#FFFFFF" />
          </g>
        </g>

        {/* Right Landmark Tower / Modern Building */}
        <g stroke="url(#landmarkGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Roof Arch & Tower */}
          <path d="M 255 35 L 290 12 L 325 35 Z" fill="#EBF4FF" />
          <line x1="252" y1="35" x2="328" y2="35" strokeWidth="2.5" />
          {/* Columns */}
          <line x1="262" y1="35" x2="262" y2="85" />
          <line x1="282" y1="35" x2="282" y2="85" />
          <line x1="298" y1="35" x2="298" y2="85" />
          <line x1="318" y1="35" x2="318" y2="85" />
          {/* Base */}
          <line x1="250" y1="85" x2="330" y2="85" strokeWidth="3" />

          {/* Windows */}
          <rect x="268" y="44" width="8" height="12" rx="1" fill="#D6E8FF" />
          <rect x="304" y="44" width="8" height="12" rx="1" fill="#D6E8FF" />
          <rect x="268" y="64" width="8" height="12" rx="1" fill="#D6E8FF" />
          <rect x="304" y="64" width="8" height="12" rx="1" fill="#D6E8FF" />
        </g>
      </svg>
    </div>
  );
};

// 5. WhatsApp & SMS OTP Speech Bubbles (Screen 4 Header)
export const WhatsAppOtpIconGraphic: React.FC<{ className?: string }> = ({ className = 'w-24 h-20' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain overflow-visible"
      >
        <defs>
          <filter id="bubbleDrop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0066FF" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* 1. Green WhatsApp Bubble */}
        <g filter="url(#bubbleDrop)">
          <path
            d="M 30 20 C 30 11 37 4 46 4 L 94 4 C 103 4 110 11 110 20 L 110 56 C 110 65 103 72 94 72 L 52 72 L 36 84 L 40 72 L 46 72 C 37 72 30 65 30 56 Z"
            fill="#25D366"
          />
          {/* WhatsApp Phone Logo inside */}
          <g transform="translate(62, 24)" fill="#FFFFFF">
            <path d="M 12 1 C 5.9 1 1 5.9 1 12 C 1 14.1 1.6 16.1 2.6 17.8 L 1.2 23 L 6.5 21.6 C 8.1 22.5 10 23 12 23 C 18.1 23 23 18.1 23 12 C 23 5.9 18.1 1 12 1 Z M 17.5 16.2 C 17.3 16.8 16.3 17.3 15.8 17.4 C 15.3 17.5 14.7 17.5 13.9 17.2 C 11.2 16.1 9.4 13.4 9.3 13.2 C 9.2 13 8.3 11.8 8.3 10.6 C 8.3 9.4 8.9 8.8 9.1 8.6 C 9.3 8.4 9.6 8.3 9.8 8.3 C 10 8.3 10.2 8.3 10.4 8.3 C 10.6 8.3 10.8 8.2 11 8.8 C 11.2 9.4 11.8 10.7 11.9 10.8 C 12 11 12 11.2 11.9 11.4 C 11.8 11.6 11.7 11.7 11.5 11.9 C 11.4 12.1 11.2 12.3 11.1 12.4 C 10.9 12.6 10.8 12.8 11 13.1 C 11.2 13.4 11.9 14.5 12.9 15.4 C 14.2 16.6 15.2 17 15.6 17.2 C 15.9 17.3 16.2 17.3 16.4 17 C 16.6 16.7 17.2 16 17.4 15.6 C 17.6 15.2 17.8 15.3 18 15.4 C 18.2 15.5 19.5 16.1 19.8 16.3 C 20 16.4 20.2 16.5 20.3 16.7 C 20.3 16.9 20.3 17.6 17.5 16.2 Z" />
          </g>
          {/* Subtle question mark badge */}
          <circle cx="88" cy="18" r="6" fill="#128C7E" />
          <text x="88" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="bold">?</text>
        </g>

        {/* 2. Blue SMS OTP Badge Bubble overlapping */}
        <g filter="url(#bubbleDrop)" transform="translate(68, 44)">
          <rect x="0" y="0" width="72" height="42" rx="14" fill="#0066FF" />
          <polygon points="16,42 24,42 12,50" fill="#0066FF" />
          {/* 3 OTP Stars / Dots */}
          <circle cx="22" cy="21" r="4.5" fill="#FFFFFF" />
          <circle cx="36" cy="21" r="4.5" fill="#FFFFFF" />
          <circle cx="50" cy="21" r="4.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
};

// 6. Celebration Green Checkmark Badge with Confetti Sparkles (Screen 5)
export const SuccessCelebrationBadge: React.FC<{ className?: string }> = ({ className = 'w-28 h-28' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain overflow-visible"
      >
        <defs>
          <radialGradient id="checkGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E575" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00E575" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="checkCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E575" />
            <stop offset="100%" stopColor="#00C853" />
          </linearGradient>
          <filter id="checkShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#00E575" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Ambient Glow */}
        <circle cx="80" cy="80" r="70" fill="url(#checkGlow)" />

        {/* Confetti / Celebration Particles */}
        <g fill="#0066FF">
          <circle cx="32" cy="38" r="3" />
          <circle cx="128" cy="46" r="3.5" />
          <rect x="42" y="118" width="4" height="4" rx="1" transform="rotate(25 44 120)" />
          <rect x="120" y="112" width="5" height="5" rx="1" transform="rotate(-35 122 114)" />
        </g>
        <g fill="#00E575">
          <circle cx="48" cy="24" r="3.5" />
          <circle cx="112" cy="26" r="3" />
          <rect x="22" y="82" width="6" height="3" rx="1" transform="rotate(45 25 83)" />
          <rect x="136" y="80" width="6" height="3" rx="1" transform="rotate(-20 139 81)" />
        </g>
        <g fill="#00A3FF">
          <circle cx="28" cy="62" r="2.5" />
          <circle cx="132" cy="60" r="3" />
          <circle cx="78" cy="14" r="3" />
          <rect x="88" y="138" width="5" height="3" rx="1" transform="rotate(15 90 139)" />
        </g>

        {/* Main Circular Green Badge */}
        <circle cx="80" cy="80" r="42" fill="url(#checkCircleGrad)" filter="url(#checkShadow)" />

        {/* Bold White Checkmark */}
        <path
          d="M 62 80 L 74 92 L 98 68"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// 7. Sleek Ocean Waves Gradient (Used at bottom of screens)
export const BottomWaveGradient: React.FC<{ className?: string; height?: number }> = ({
  className = 'w-full',
  height = 90,
}) => {
  return (
    <div className={`relative w-full overflow-hidden select-none pointer-events-none ${className}`} style={{ height }}>
      <svg
        viewBox="0 0 400 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-fill"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradDeep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0052CC" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#0066FF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0080FF" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="waveGradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#00E575" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#00C853" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Background Wave */}
        <path
          d="M 0 50 C 90 10, 220 80, 400 25 L 400 120 L 0 120 Z"
          fill="url(#waveGradCyan)"
        />

        {/* Foreground Smooth Wave */}
        <path
          d="M 0 70 C 120 30, 260 95, 400 45 L 400 120 L 0 120 Z"
          fill="url(#waveGradDeep)"
        />
      </svg>
    </div>
  );
};

// 8. Hero Scene Graphic for Screen 1 & Screen 6:
// Features Hargeisa city mountains, waving Somaliland flag, and white branded Wadaage Share car!
export const HeroHargeisaCarScene: React.FC<{ className?: string }> = ({ className = 'w-full h-48' }) => {
  return (
    <div className={`relative overflow-hidden rounded-3xl select-none ${className}`}>
      {/* Background panoramic landscape with mountains and sunny sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#60A5FA] via-[#93C5FD] to-[#E2E8F0]">
        {/* Sky with clouds */}
        <div className="absolute top-2 left-6 w-16 h-5 bg-white/70 rounded-full blur-[1px]" />
        <div className="absolute top-4 right-16 w-20 h-6 bg-white/80 rounded-full blur-[1px]" />

        {/* Mountain ridge backdrop (Naasa Hablood hills of Hargeisa) */}
        <svg
          viewBox="0 0 400 120"
          className="absolute bottom-10 left-0 w-full h-24 object-cover opacity-80"
          preserveAspectRatio="none"
        >
          <path
            d="M 0 120 L 0 60 C 40 45, 90 30, 140 50 C 190 70, 230 40, 280 45 C 330 50, 370 35, 400 55 L 400 120 Z"
            fill="#86A789"
          />
          <path
            d="M 0 120 L 0 75 C 60 60, 120 70, 180 65 C 240 60, 310 75, 400 65 L 400 120 Z"
            fill="#4E6E58"
          />
        </svg>

        {/* Lush Green Trees and City Skyline */}
        <div className="absolute bottom-9 left-0 right-0 h-6 flex items-end justify-between px-2 overflow-hidden opacity-90">
          <div className="w-8 h-8 rounded-full bg-emerald-700 -mb-2" />
          <div className="w-10 h-10 rounded-full bg-emerald-800 -mb-3" />
          <div className="w-6 h-6 rounded-full bg-emerald-600 -mb-1" />
          <div className="w-9 h-9 rounded-full bg-emerald-700 -mb-2" />
          <div className="w-12 h-12 rounded-full bg-emerald-800 -mb-4" />
          <div className="w-7 h-7 rounded-full bg-emerald-600 -mb-1" />
        </div>

        {/* Somaliland Flag on Flagpole waving on the right */}
        <div className="absolute top-3 right-5 z-20 flex flex-col items-start drop-shadow-md">
          {/* Flagpole */}
          <div className="w-1 h-20 bg-slate-400 rounded-t-full relative">
            {/* Gold finial ball on top */}
            <div className="w-2 h-2 rounded-full bg-amber-400 absolute -top-1 -left-0.5" />
            {/* Somaliland Waving Flag */}
            <div className="absolute top-1 left-1 w-14 h-9 shadow-md rounded-xs overflow-hidden border border-black/10 flex flex-col">
              {/* Green stripe */}
              <div className="h-3 bg-[#008751] flex items-center justify-center text-[5px] text-white font-bold tracking-tight">
                لا إله إلا الله
              </div>
              {/* White stripe with black 5-pointed star */}
              <div className="h-3 bg-white flex items-center justify-center text-[8px] text-black font-black leading-none">
                ★
              </div>
              {/* Red stripe */}
              <div className="h-3 bg-[#D21034]" />
            </div>
          </div>
        </div>

        {/* Road surface */}
        <div className="absolute bottom-0 left-0 right-0 h-11 bg-gradient-to-b from-slate-700 to-slate-900 border-t-2 border-slate-600">
          {/* Center Road Dash Markings */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 border-b-2 border-dashed border-amber-400/80 -translate-y-1/2" />
        </div>
      </div>

      {/* Modern White Branded Toyota Car on Road */}
      <div className="absolute bottom-1 left-2 sm:left-4 z-30 w-52 sm:w-60 h-28 flex items-end">
        {/* High quality white car image or realistic SVG with door logo */}
        <img
          src="/images/car_wadaage_share.jpg"
          alt="Wadaage Share Car"
          className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
          onError={(e) => {
            // Fallback to stylized SVG if local image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};
