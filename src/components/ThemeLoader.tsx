import React from 'react';

const ThemeLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[120px]">
    <div className="relative flex items-center justify-center mb-2">
      {/* Spinning sun */}
      <svg className="animate-spin-slow absolute -top-8 left-1/2 -translate-x-1/2" width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="#FFD600" strokeWidth="4" fill="none" />
        <circle cx="24" cy="24" r="10" fill="#FFD600" fillOpacity="0.5" />
      </svg>
      {/* Sprouting plant */}
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <ellipse cx="32" cy="56" rx="18" ry="6" fill="#A3E635" fillOpacity="0.3" />
        <rect x="29" y="32" width="6" height="18" rx="3" fill="#7C3F00" />
        <path d="M32 32 Q28 24, 20 24 Q28 28, 32 32" fill="#22C55E" />
        <path d="M32 32 Q36 24, 44 24 Q36 28, 32 32" fill="#22C55E" />
        <circle cx="32" cy="32" r="4" fill="#22C55E" />
      </svg>
    </div>
    <span className="text-green-700 font-medium mt-2">Loading...</span>
  </div>
);

export default ThemeLoader; 