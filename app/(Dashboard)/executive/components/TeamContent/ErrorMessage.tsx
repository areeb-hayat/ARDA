// app/(Dashboard)/dept-head/components/TeamContent/ErrorMessage.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const { colors, cardCharacters } = useTheme();
  const urgentChar = cardCharacters.urgent;
  
  return (
    <div className={`relative rounded-xl p-4 border-2 overflow-hidden backdrop-blur-xl bg-gradient-to-br ${urgentChar.bg} ${urgentChar.border}`}>
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div className="relative flex items-center gap-3">
        <AlertCircle className={`h-5 w-5 ${urgentChar.iconColor} flex-shrink-0`} />
        <p className={`font-semibold text-sm ${urgentChar.text}`}>
          {message}
        </p>
      </div>
    </div>
  );
}