// app/(Dashboard)/dept-head/components/TeamContent/TeamLoadingState.tsx
'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface TeamLoadingStateProps {
  department: string;
}

export function TeamLoadingState({ department }: TeamLoadingStateProps) {
  const { colors, cardCharacters } = useTheme();
  const infoChar = cardCharacters.informative;
  
  return (
    <div className="space-y-5">
      <div className={`relative rounded-xl p-6 border-2 overflow-hidden backdrop-blur-xl bg-gradient-to-br ${infoChar.bg} ${infoChar.border} ${colors.shadowCard}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        <div className="relative flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${infoChar.border}`}>
            <Users className={`h-7 w-7 ${infoChar.iconColor}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>My Team</h2>
            <p className={`text-sm font-semibold ${infoChar.accent}`}>
              {department} Department
            </p>
          </div>
        </div>
      </div>

      <div className="text-center py-12">
        <div 
          className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ 
            borderColor: `${colors.glowPrimary} transparent transparent transparent` 
          }}
        />
        <p className={`${colors.textPrimary} text-base font-bold mt-4`}>
          Loading team members...
        </p>
      </div>
    </div>
  );
}