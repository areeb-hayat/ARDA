// app/(Dashboard)/dept-head/components/TeamContent/EmployeeCard.tsx
'use client';

import React from 'react';
import { User, Briefcase, Mail, Phone } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { Employee } from './types';

interface EmployeeCardProps {
  employee: Employee;
  isHovered: boolean;
  isUpdating: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onUpdatePoints: (change: number) => void;
  onClick?: () => void;
}

export default function EmployeeCard({
  employee,
  isHovered,
  isUpdating,
  onMouseEnter,
  onMouseLeave,
  onUpdatePoints,
  onClick
}: EmployeeCardProps) {
  const { colors, cardCharacters } = useTheme();
  const infoChar = cardCharacters.informative;
  
  const displayName = employee.displayName || 
    (employee.basicDetails ? 
      `${employee.basicDetails.title || ''} ${employee.basicDetails.name || ''}`.trim() : 
      employee.username) || 'N/A';

  const handleCardClick = (e: React.MouseEvent) => {
    console.log('Card clicked!', employee._id);
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <div
      className="relative group"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Employee Card */}
      <div 
        className={`
          relative rounded-xl p-6 border-2 transition-all duration-300 cursor-pointer overflow-hidden
          bg-gradient-to-br ${colors.cardBg} ${colors.shadowCard}
          ${isHovered 
            ? `${infoChar.border} hover:${colors.shadowHover} scale-105 z-10` 
            : `${colors.border} hover:${colors.cardBgHover}`
          }
        `}
        onClick={handleCardClick}
      >
        {/* Paper Texture */}
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        {/* Hover Glow */}
        <div 
          className={`absolute inset-0 opacity-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : ''}`}
          style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
        ></div>

        <div className="relative space-y-4">
          {/* Avatar/Icon and Name */}
          <div className="flex items-center gap-3">
            <div className={`
              w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
              transition-all duration-300 border-2
              ${isHovered 
                ? `bg-gradient-to-br ${infoChar.bg} ${infoChar.border} shadow-lg`
                : `${colors.cardBg} ${colors.borderSubtle}`
              }
            `}>
              <User className={`h-7 w-7 ${isHovered ? infoChar.iconColor : colors.textMuted}`} />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={`text-lg font-bold ${colors.textPrimary} truncate`}>
                {displayName}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Briefcase className={`h-3.5 w-3.5 ${infoChar.iconColor} flex-shrink-0`} />
                <p className={`text-sm font-semibold ${infoChar.accent} truncate`}>
                  {employee.title}
                </p>
              </div>
            </div>
          </div>

          {/* Employee Number */}
          <div className={`pt-3 border-t ${colors.border}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${colors.textMuted}`}>Employee ID</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold border bg-gradient-to-r ${infoChar.bg} ${infoChar.text} ${infoChar.border}`}>
                {employee.employeeNumber}
              </span>
            </div>
          </div>

          {/* Contact Info - Shown on hover */}
          <div className={`
            space-y-2 transition-all duration-300
            ${isHovered ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
          `}>
            <div className={`pt-3 border-t ${infoChar.border}`}></div>
            
            {/* Email */}
            {employee.contactInformation?.email ? (
              <div className={`group/contact relative flex items-center gap-2 p-3 rounded-lg border overflow-hidden bg-gradient-to-r ${infoChar.bg} ${infoChar.border} transition-all`}>
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                <Mail className={`h-4 w-4 ${infoChar.iconColor} flex-shrink-0 relative z-10`} />
                <span className={`text-xs font-medium ${infoChar.text} truncate relative z-10`}>
                  {employee.contactInformation.email}
                </span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${colors.cardBg} ${colors.borderSubtle}`}>
                <Mail className={`h-4 w-4 ${colors.textMuted} flex-shrink-0`} />
                <span className={`text-xs ${colors.textMuted}`}>No email provided</span>
              </div>
            )}

            {/* Phone */}
            {employee.contactInformation?.phone ? (
              <div className={`group/contact relative flex items-center gap-2 p-3 rounded-lg border overflow-hidden bg-gradient-to-r ${infoChar.bg} ${infoChar.border} transition-all`}>
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                <Phone className={`h-4 w-4 ${infoChar.iconColor} flex-shrink-0 relative z-10`} />
                <span className={`text-xs font-medium ${infoChar.text} relative z-10`}>
                  {employee.contactInformation.phone}
                </span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${colors.cardBg} ${colors.borderSubtle}`}>
                <Phone className={`h-4 w-4 ${colors.textMuted} flex-shrink-0`} />
                <span className={`text-xs ${colors.textMuted}`}>No phone provided</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}