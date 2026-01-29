// app/(Dashboard)/dept-head/components/TeamContent/EmptyState.tsx
'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface EmptyStateProps {
  searchTerm: string;
}

export function EmptyState({ searchTerm }: EmptyStateProps) {
  const { colors, cardCharacters } = useTheme();
  const neutralChar = cardCharacters.neutral;
  
  return (
    <div className={`relative rounded-xl p-12 border-2 text-center overflow-hidden backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} ${colors.border}`}>
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div className="relative">
        <Users className={`h-14 w-14 ${colors.textMuted} mx-auto mb-4 opacity-50`} />
        <p className={`text-base font-semibold mb-1.5 ${colors.textPrimary}`}>
          {searchTerm ? 'No team members found' : 'No team members yet'}
        </p>
        <p className={`text-sm ${colors.textMuted}`}>
          {searchTerm ? 'Try adjusting your search terms' : 'Team members will appear here once added'}
        </p>
      </div>
    </div>
  );
}