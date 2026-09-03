import React from 'react';

interface AquagendaIconProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

/**
 * Aquagenda Icon Emblem (Splatter + 4-Color Calendar Puzzle + Wave Cutout)
 */
export const AquagendaIcon: React.FC<AquagendaIconProps> = ({
  className = 'w-8 h-8',
  size,
  alt = 'Aquagenda Ícone',
}) => {
  return (
    <img
      src="/icon.svg"
      alt={alt}
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      className={`shrink-0 object-contain ${className}`}
      onError={(e) => {
        // Fallback to PNG if SVG fails
        (e.currentTarget as HTMLImageElement).src = '/favicon-32x32.png';
      }}
    />
  );
};

interface AquagendaLogoProps {
  className?: string;
  height?: number | string;
  showTagline?: boolean;
  alt?: string;
}

/**
 * Full Aquagenda Horizontal Logo (Emblem + "AQUAGENDA" typography + wave)
 */
export const AquagendaLogo: React.FC<AquagendaLogoProps> = ({
  className = 'h-8',
  height,
  alt = 'Aquagenda',
}) => {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src="/logo.svg"
        alt={alt}
        height={height}
        referrerPolicy="no-referrer"
        className="h-full w-auto object-contain max-h-12"
        onError={(e) => {
          // Fallback to PNG if SVG fails
          (e.currentTarget as HTMLImageElement).src = '/logo.png';
        }}
      />
    </div>
  );
};
