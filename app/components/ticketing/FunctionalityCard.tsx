// ============================================
// app/components/ticketing/FunctionalityCard.tsx
// Card component for displaying functionalities (including super workflows)
// ============================================

import React from 'react';
import { FileText, Calendar, Zap } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Functionality {
  _id: string;
  name: string;
  description: string;
  department: string;
  formSchema?: {
    fields: any[];
    useDefaultFields: boolean;
  };
  createdAt: string;
}

interface Props {
  functionality: Functionality;
  onClick: () => void;
  isSuper?: boolean;
}

export default function FunctionalityCard({ functionality, onClick, isSuper = false }: Props) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left transition-all duration-300 hover:scale-[1.02] overflow-hidden rounded-2xl border-2 backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} hover:${colors.shadowHover}`}
    >
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
      ></div>

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={`flex-shrink-0 p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
            {isSuper ? (
              <Zap className={`w-6 h-6 ${charColors.iconColor}`} />
            ) : (
              <FileText className={`w-6 h-6 ${charColors.iconColor}`} />
            )}
          </div>
        </div>
        
        {/* Title and Description */}
        <div>
          <h3 className={`text-xl font-black ${charColors.text} mb-1 line-clamp-2`}>
            {functionality.name}
          </h3>
          {functionality.description && (
            <p className={`${colors.textSecondary} text-sm line-clamp-2`}>
              {functionality.description}
            </p>
          )}
        </div>

        {/* Department Badge */}
        <div className="flex flex-wrap gap-2">
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${colors.inputBg} ${colors.textSecondary} border ${colors.inputBorder}`}>
            {isSuper && <Zap className="w-3 h-3" />}
            {isSuper ? 'Super Workflow' : functionality.department}
          </div>
        </div>

        {/* Footer */}
        <div className={`pt-3 border-t border-current/10 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${colors.textMuted}`} />
            <span className={`text-xs font-medium ${colors.textMuted}`}>
              {formatDate(functionality.createdAt)}
            </span>
          </div>
          
          <div className={`text-xs font-bold ${charColors.text} group-hover:translate-x-1 transition-transform`}>
            Create Ticket →
          </div>
        </div>
      </div>
    </button>
  );
}