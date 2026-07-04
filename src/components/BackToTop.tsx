'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 md:hidden w-11 h-11 rounded-full bg-white shadow-lg border border-brand-border-light flex items-center justify-center text-brand-gray hover:text-brand-ink hover:shadow-xl transition-all duration-200 active:scale-95"
      aria-label="回到顶部"
      style={{
        animation: 'fadeIn 200ms ease-out',
      }}
    >
      <ArrowUp className="w-5 h-5" />
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </button>
  );
}
