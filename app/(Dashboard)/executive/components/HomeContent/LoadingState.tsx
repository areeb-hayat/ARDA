// app/(Dashboard)/dept-head/components/HomeContent/LoadingState.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Loader2 } from 'lucide-react';

export default function LoadingState() {
  const { colors } = useTheme();
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className={`w-14 h-14 ${colors.textAccent} animate-spin mx-auto`} />
        <p className={`${colors.textPrimary} text-base font-bold`}>Loading dashboard...</p>
      </div>
    </div>
  );
}