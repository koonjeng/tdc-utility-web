'use client';

import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 300);
    }, 600);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-300 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* MINIMAL ELEGANT SPINNER ONLY */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        {/* Outer Ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-sky-400 border-r-sky-400/40 animate-spin"
          style={{ animationDuration: '0.8s' }}
        />
        {/* Inner Counter Ring */}
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-emerald-400 border-l-emerald-400/40 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '0.6s' }}
        />
      </div>
    </div>
  );
};
