// app/components/employeeticketlogs/AnalyticsEmptyState.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Inbox } from 'lucide-react';

interface AnalyticsEmptyStateProps {
  employeeName: string;
}

export default function AnalyticsEmptyState({ employeeName }: AnalyticsEmptyStateProps) {
  const { colors, cardCharacters } = useTheme();
  const neutralChar = cardCharacters.neutral;

  return (
    <div className={`relative text-center py-20 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${neutralChar.bg} ${neutralChar.border}`}>
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div className="relative">
        <div className={`w-24 h-24 mx-auto mb-4 rounded-2xl flex items-center justify-center border-2 ${neutralChar.border}`}>
          <Inbox className={`h-12 w-12 ${neutralChar.iconColor} opacity-50`} />
        </div>
        <h3 className={`text-xl font-black ${colors.textPrimary} mb-2`}>
          No Tickets Yet
        </h3>
        <p className={`${colors.textSecondary} text-sm max-w-md mx-auto`}>
          {employeeName} hasn't worked on any tickets yet. When they do, their ticket analytics will appear here.
        </p>
      </div>
    </div>
  );
}