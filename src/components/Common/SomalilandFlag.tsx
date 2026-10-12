import React from 'react';

interface SomalilandFlagProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Authentic Republic of Somaliland National Flag
 * - Top: Green with Arabic Shahada in white ("لَا إِلٰهَ إِلَّا الله مُحَمَّدٌ رَسُولُ الله")
 * - Middle: White with centered 5-pointed black star
 * - Bottom: Red
 */
export const SomalilandFlag: React.FC<SomalilandFlagProps> = ({
  className = 'w-5 h-3.5 inline-block rounded-xs shadow-xs object-contain',
  width,
  height,
}) => {
  return (
    <svg
      viewBox="0 0 600 400"
      className={className}
      style={{
        width: width ?? undefined,
        height: height ?? undefined,
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Calanka Somaliland / Somaliland Flag"
    >
      <title>Calanka Somaliland / Somaliland Flag</title>
      <defs>
        {/* 5-pointed star path */}
        <polygon
          id="som-star"
          points="0,-38 11.2,-11.7 39.9,-11.7 16.7,5.2 25.5,32.3 0,15.5 -25.5,32.3 -16.7,5.2 -39.9,-11.7 -11.2,-11.7"
          fill="#000000"
        />
      </defs>

      {/* Top Stripe: Green */}
      <rect x="0" y="0" width="600" height="133.33" fill="#128043" />

      {/* Arabic Shahada Calligraphy on Top Green Stripe */}
      <g fill="#FFFFFF" textAnchor="middle">
        <text
          x="300"
          y="84"
          fontFamily="'Scheherazade New', 'Amiri', 'Traditional Arabic', 'Noto Naskh Arabic', 'Geeza Pro', sans-serif"
          fontSize="46"
          fontWeight="700"
          letterSpacing="1px"
        >
          لَا إِلٰهَ إِلَّا الله مُحَمَّدٌ رَسُولُ الله
        </text>
      </g>

      {/* Middle Stripe: White */}
      <rect x="0" y="133.33" width="600" height="133.33" fill="#FFFFFF" />

      {/* Black 5-pointed Star in Center */}
      <g transform="translate(300, 200)">
        <use href="#som-star" />
      </g>

      {/* Bottom Stripe: Red */}
      <rect x="0" y="266.66" width="600" height="133.34" fill="#D21034" />
    </svg>
  );
};

export default SomalilandFlag;
