// app/(Dashboard)/dept-head/components/TeamContent/TeamHeader.tsx
'use client';

import React from 'react';
import { Users, Search } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface TeamHeaderProps {
  department: string;
  employeeCount: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function TeamHeader({ 
  department, 
  employeeCount, 
  searchTerm, 
  onSearchChange 
}: TeamHeaderProps) {
  const { colors, cardCharacters } = useTheme();
  const infoChar = cardCharacters.informative;
  
  return (
    <div className={`relative rounded-xl p-6 border-2 overflow-hidden backdrop-blur-xl bg-gradient-to-br ${infoChar.bg} ${infoChar.border} ${colors.shadowCard}`}>
      {/* Paper Texture */}
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${infoChar.border}`}>
            <Users className={`h-7 w-7 ${infoChar.iconColor}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${colors.textPrimary}`}>My Team</h2>
            <p className={`text-sm font-semibold ${infoChar.accent}`}>
              {department} Department • {employeeCount} Member{employeeCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${colors.textMuted}`} />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`pl-10 pr-3 py-2 border-2 rounded-xl transition-all duration-300 w-64 text-sm ${colors.inputBg} ${colors.inputBorder} ${colors.inputText} ${colors.inputFocusBg} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            style={{ caretColor: 'currentColor' }}
          />
        </div>
      </div>
    </div>
  );
}