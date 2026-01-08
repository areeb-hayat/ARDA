// app/(Dashboard)/hr-head/components/TeamContent/Styles.tsx =====
'use client';

import React from 'react';

export default function Styles() {
  return (
    <style jsx global>{`
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(0, 0, 128, 0.1);
        border-radius: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #0000FF, #6495ED);
        border-radius: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, #6495ED, #0000FF);
      }
    `}</style>
  );
}