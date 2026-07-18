import React from 'react';

// Elegant Traditional Mandala Vector for headers and visual anchors
export const BatikMandala: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 120 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`${className} text-batik-brown fill-current animate-spin`}
      style={{ animationDuration: '40s' }}
    >
      <g transform="translate(50,50)">
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          return (
            <g key={i} transform={`rotate(${angle})`}>
              <path
                d="M 0,-5 C 15,-30 15,-45 0,-45 C -15,-45 -15,-30 0,-5 Z"
                className="opacity-25"
              />
              <path
                d="M 0,-15 C 8,-25 8,-35 0,-35 C -8,-35 -8,-25 0,-15 Z"
                className="opacity-70 text-gold-gentle"
              />
              <circle cx="0" cy="-45" r="2.5" className="text-gold-gentle" />
            </g>
          );
        })}
        <circle cx="0" cy="0" r="10" className="text-gold-gentle opacity-40" />
        <circle cx="0" cy="0" r="4" fill="#ffffff" />
      </g>
    </svg>
  );
};

// Elegant Wedding Divider ornament
export const BatikDivider: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center gap-4 my-6 ${className}`}>
      <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-gold-gentle to-batik-brown"></div>
      <svg width="32" height="32" viewBox="0 0 32 32" className="text-gold-gentle fill-current">
        <path d="M16 0L20 12L32 16L20 20L16 32L12 20L0 16L12 12Z" />
      </svg>
      <div className="h-[1px] w-20 bg-gradient-to-l from-transparent via-gold-gentle to-batik-brown"></div>
    </div>
  );
};

// Classic Javanese Gunungan (Shadow Puppet Landmark Icon) representing transition & sacred status
export const JavaneseGunungan: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 180 }) => {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 120 180"
      className={`${className} fill-current`}
    >
      <g>
        {/* Outermost border crown */}
        <path
          d="M 60 10 
             C 85 45, 110 80, 110 130 
             C 110 160, 95 170, 60 170 
             C 25 170, 10 160, 10 130 
             C 10 80, 35 45, 60 10 Z"
          className="text-batik-brown opacity-10"
        />
        {/* Secondary inner contour representing tree of life */}
        <path
          d="M 60 20 
             C 80 50, 100 85, 100 130 
             C 100 155, 85 162, 60 162 
             C 35 162, 20 155, 20 130 
             C 20 85, 40 50, 60 20 Z"
          className="text-gold-gentle opacity-30"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="none"
        />
        {/* Tree of Life branch works inside Gunungan */}
        <line x1="60" y1="50" x2="60" y2="160" stroke="currentColor" strokeWidth="2.5" className="text-gold-gentle" />
        
        {/* Stylized branches and leaves */}
        <path d="M 60 80 C 75 75, 85 85, 90 95 M 60 80 C 45 75, 35 85, 30 95" stroke="currentColor" strokeWidth="1.5" className="text-batik-brown" fill="none" />
        <path d="M 60 105 C 80 100, 90 115, 95 125 M 60 105 C 40 100, 30 115, 25 125" stroke="currentColor" strokeWidth="1.5" className="text-batik-brown" fill="none" />
        <path d="M 60 130 C 85 125, 92 140, 96 150 M 60 130 C 35 125, 28 140, 24 150" stroke="currentColor" strokeWidth="1.5" className="text-batik-brown" fill="none" />
        
        {/* Symmetric Door at the base */}
        <rect x="50" y="142" width="20" height="18" rx="2" className="text-batik-brown" />
        <path d="M 60 142 L 60 160" stroke="#fbf9f4" strokeWidth="1" />
      </g>
    </svg>
  );
};

// Corner Golden Wedding Ornament Frame
export const CornerOrnament: React.FC<{ className?: string; flippedX?: boolean; flippedY?: boolean }> = ({
  className = '',
  flippedX = false,
  flippedY = false
}) => {
  const rotation = `${flippedY ? 'scale-y-[-1]' : ''} ${flippedX ? 'scale-x-[-1]' : ''}`;
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      className={`${className} ${rotation} text-gold-gentle fill-current`}
    >
      <path d="M4 4H30V6H6V30H4V4ZM4 4L16 16M4 20L20 4M4 12L12 4M30 30 C20 30, 10 20, 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="30" cy="6" r="2" />
      <circle cx="6" cy="30" r="2" />
    </svg>
  );
};
