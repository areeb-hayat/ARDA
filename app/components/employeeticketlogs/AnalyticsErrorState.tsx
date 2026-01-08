// app/components/employeeticketlogs/AnalyticsErrorState.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AnalyticsErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function AnalyticsErrorState({ message, onRetry }: AnalyticsErrorStateProps) {
  const { colors, cardCharacters } = useTheme();
  const urgentChar = cardCharacters.urgent;

  return (
    <div className={`relative text-center py-16 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${urgentChar.bg} ${urgentChar.border}`}>
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div className="relative">
        <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center border-2 ${urgentChar.border}`}>
          <AlertCircle className={`h-10 w-10 ${urgentChar.iconColor}`} />
        </div>
        <h3 className={`text-xl font-black ${colors.textPrimary} mb-2`}>
          Failed to Load Analytics
        </h3>
        <p className={`${colors.textSecondary} text-sm mb-6 max-w-md mx-auto`}>
          {message}
        </p>
        <button
          onClick={onRetry}
          className={`group relative px-6 py-3 rounded-xl font-bold transition-all overflow-hidden flex items-center gap-2 mx-auto border-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} ${colors.shadowCard} hover:${colors.shadowHover}`}
        >
          {/* Paper Texture Layer */}
          <div className={`absolute inset-0 opacity-[0.02] ${colors.paperTexture}`}></div>
          
          {/* Internal Glow Layer */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
          />
          
          <RefreshCw className="h-5 w-5 relative z-10 group-hover:rotate-180 transition-all duration-500" />
          <span className="relative z-10">Retry</span>
        </button>
      </div>
    </div>
  );
}