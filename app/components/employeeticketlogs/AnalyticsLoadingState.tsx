// app/components/employeeticketlogs/AnalyticsLoadingState.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Loader2 } from 'lucide-react';

export default function AnalyticsLoadingState() {
  const { colors, cardCharacters } = useTheme();
  const infoChar = cardCharacters.informative;

  return (
    <div className="space-y-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className={`relative p-5 rounded-xl border-2 overflow-hidden ${colors.cardBg} ${colors.borderSubtle}`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <div className="relative flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className={`h-3 rounded w-20 animate-pulse ${colors.inputBg}`} />
                <div className={`h-8 rounded w-16 animate-pulse ${colors.inputBg}`} />
              </div>
              <div className={`w-16 h-16 rounded-2xl animate-pulse ${colors.inputBg}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="grid grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div 
            key={i}
            className={`relative p-6 rounded-xl border-2 overflow-hidden ${colors.cardBg} ${colors.borderSubtle}`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <div className="relative space-y-4">
              {/* Header skeleton */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl animate-pulse ${colors.inputBg}`} />
                <div className="flex-1 space-y-2">
                  <div className={`h-4 rounded w-32 animate-pulse ${colors.inputBg}`} />
                  <div className={`h-3 rounded w-24 animate-pulse ${colors.inputBg}`} />
                </div>
              </div>

              {/* Chart skeleton */}
              <div className={`relative flex items-center justify-center p-6 rounded-xl border-2 ${colors.cardBg} ${colors.borderSubtle}`}>
                <Loader2 className={`h-32 w-32 ${infoChar.iconColor} animate-spin`} />
              </div>

              {/* Legend skeleton */}
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div 
                    key={j}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${colors.cardBg} ${colors.borderSubtle}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-4 h-4 rounded-full animate-pulse ${colors.inputBg}`} />
                      <div className={`h-3 rounded w-20 animate-pulse ${colors.inputBg}`} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`h-4 rounded w-8 animate-pulse ${colors.inputBg}`} />
                      <div className={`h-4 rounded w-12 animate-pulse ${colors.inputBg}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}