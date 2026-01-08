// ============================================
// app/components/super/workflows/SuperFunctionalityCard.tsx
// Card component for displaying super functionalities
// ============================================

import React from 'react';
import { Edit, Trash2, Users, Building2, Globe } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface SuperFunctionality {
  _id: string;
  name: string;
  description: string;
  workflow: {
    nodes: any[];
    edges: any[];
  };
  accessControl: {
    type: 'organization' | 'departments' | 'specific_users';
    departments?: string[];
    users?: string[];
  };
  createdBy: {
    userId: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Props {
  functionality: SuperFunctionality;
  onEdit: (func: SuperFunctionality) => void;
  onDelete: () => void;
}

export default function SuperFunctionalityCard({ functionality, onEdit, onDelete }: Props) {
  const { colors, cardCharacters, theme } = useTheme();
  const charColors = cardCharacters.informative;

  const nodeCount = functionality.workflow.nodes.filter(n => n.type === 'employee').length;

  const getAccessIcon = () => {
    switch (functionality.accessControl.type) {
      case 'organization':
        return <Globe className="w-4 h-4" />;
      case 'departments':
        return <Building2 className="w-4 h-4" />;
      case 'specific_users':
        return <Users className="w-4 h-4" />;
    }
  };

  const getAccessText = () => {
    switch (functionality.accessControl.type) {
      case 'organization':
        return 'Organization-wide';
      case 'departments':
        return `${functionality.accessControl.departments?.length || 0} Department${(functionality.accessControl.departments?.length || 0) !== 1 ? 's' : ''}`;
      case 'specific_users':
        return `${functionality.accessControl.users?.length || 0} User${(functionality.accessControl.users?.length || 0) !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div
      className={`relative group bg-gradient-to-br ${colors.cardBg} backdrop-blur-xl border-2 ${colors.border} rounded-2xl p-6 transition-all duration-300 hover:scale-105 ${colors.cardBgHover} ${colors.borderHover} hover:shadow-2xl`}
      style={{ boxShadow: `0 0 30px ${colors.brandBlue}20` }}
    >
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`text-lg font-black ${colors.textPrimary} mb-1 line-clamp-2`}>
              {functionality.name}
            </h3>
            {functionality.description && (
              <p className={`${colors.textSecondary} text-xs line-clamp-2`}>
                {functionality.description}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          {/* Node Count */}
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-lg"
              style={{
                background: theme === 'dark' ? 'rgba(100, 181, 246, 0.15)' : 'rgba(33, 150, 243, 0.1)'
              }}
            >
              <Users className={`w-4 h-4 ${charColors.iconColor}`} />
            </div>
            <div className="flex-1">
              <p className={`text-xs ${colors.textSecondary}`}>Workflow Nodes</p>
              <p className={`text-sm font-bold ${colors.textPrimary}`}>{nodeCount}</p>
            </div>
          </div>

          {/* Access Control */}
          <div className="flex items-center gap-2">
            <div
              className="p-2 rounded-lg"
              style={{
                background: theme === 'dark' ? 'rgba(100, 181, 246, 0.15)' : 'rgba(33, 150, 243, 0.1)'
              }}
            >
              {getAccessIcon()}
            </div>
            <div className="flex-1">
              <p className={`text-xs ${colors.textSecondary}`}>Access</p>
              <p className={`text-sm font-bold ${colors.textPrimary}`}>{getAccessText()}</p>
            </div>
          </div>
        </div>

        {/* Created By */}
        <div className={`pt-3 border-t ${colors.border}`}>
          <p className={`text-xs ${colors.textSecondary}`}>
            Created by <span className={`font-bold ${colors.textPrimary}`}>{functionality.createdBy.name}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onEdit(functionality)}
            className={`flex-1 relative overflow-hidden rounded-lg px-4 py-2.5 font-bold text-xs transition-all duration-300 bg-gradient-to-r ${cardCharacters.creative.bg} border-2 ${cardCharacters.creative.border} ${cardCharacters.creative.text} flex items-center justify-center gap-2 group`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: 'inset 0 0 20px rgba(161, 136, 127, 0.2)' }}
            ></div>
            <Edit className={`w-4 h-4 relative z-10 ${cardCharacters.creative.iconColor}`} />
            <span className="relative z-10">Edit</span>
          </button>

          <button
            onClick={onDelete}
            className={`flex-1 relative overflow-hidden rounded-lg px-4 py-2.5 font-bold text-xs transition-all duration-300 bg-gradient-to-r ${cardCharacters.urgent.bg} border-2 ${cardCharacters.urgent.border} ${cardCharacters.urgent.text} flex items-center justify-center gap-2 group`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: 'inset 0 0 20px rgba(244, 67, 54, 0.2)' }}
            ></div>
            <Trash2 className={`w-4 h-4 relative z-10 ${cardCharacters.urgent.iconColor}`} />
            <span className="relative z-10">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}