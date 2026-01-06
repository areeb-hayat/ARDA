// app/components/ProjectViewment/depthead/ProjectCard.tsx
'use client';

import React from 'react';
import { FolderKanban, ChevronRight, Users, Calendar, Package, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface ProjectCardProps {
  project: any;
  onClick: () => void;
}

export default function EmployeeProjectCard({ project, onClick }: ProjectCardProps) {
  const { colors, cardCharacters } = useTheme();

  // Get health-based character - FIXED: at-risk should use urgent/warning colors, not informative (blue)
  const getHealthCharacter = () => {
    switch (project.health) {
      case 'healthy':
        return cardCharacters.completed;
      case 'at-risk':
        return cardCharacters.urgent; // Changed from informative to urgent
      case 'delayed':
        return cardCharacters.urgent;
      case 'critical':
        return cardCharacters.urgent;
      default:
        return cardCharacters.neutral;
    }
  };

  const charColors = getHealthCharacter();
  
  const activeMembers = project.members?.filter((m: any) => !m.leftAt) || [];
  const totalDeliverables = project.deliverables?.length || 0;
  const pendingDeliverables = project.deliverables?.filter((d: any) => d.status !== 'done').length || 0;
  const overdueDeliverables = project.deliverables?.filter((d: any) => {
    if (d.status === 'done' || !d.dueDate) return false;
    return new Date(d.dueDate) < new Date();
  }).length || 0;

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} hover:${colors.shadowHover} transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
    >
      {/* Paper Texture */}
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      {/* Internal Glow on Hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
      ></div>

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div 
            className={`p-3 rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-r ${charColors.bg}`}
          >
            <FolderKanban className={`w-7 h-7 transition-transform duration-500 group-hover:rotate-12 ${charColors.iconColor}`} />
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 group-hover:translate-x-1 bg-gradient-to-r ${charColors.bg}`}>
            <span className={`text-xs font-bold ${charColors.accent}`}>
              View
            </span>
            <ChevronRight 
              className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${charColors.iconColor}`}
            />
          </div>
        </div>

        {/* Content - Title First, Number Second */}
        <div className="space-y-1">
          <h3 className={`text-xl font-black ${charColors.text} line-clamp-1 group-hover:${charColors.accent} transition-colors duration-300`}>
            {project.title}
          </h3>
          <p className={`text-xs font-bold ${colors.textMuted}`}>
            {project.projectNumber}
          </p>
        </div>
        
        <p className={`text-sm ${colors.textSecondary} line-clamp-2 min-h-[2.5rem] leading-relaxed`}>
          {project.description || 'No description provided'}
        </p>

        {/* Stats Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colors.inputBg} border ${colors.inputBorder}`}>
            <Users className={`w-3.5 h-3.5 ${colors.textMuted}`} />
            <span className={`text-xs font-semibold ${colors.textSecondary}`}>
              {activeMembers.length}
            </span>
          </div>
          
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colors.inputBg} border ${colors.inputBorder}`}>
            <Package className={`w-3.5 h-3.5 ${colors.textMuted}`} />
            <span className={`text-xs font-semibold ${colors.textSecondary}`}>
              {totalDeliverables} tasks
            </span>
          </div>

          {overdueDeliverables > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${cardCharacters.urgent.bg}`}>
              <AlertTriangle className={`w-3.5 h-3.5 ${cardCharacters.urgent.iconColor}`} />
              <span className={`text-xs font-bold ${cardCharacters.urgent.text}`}>
                {overdueDeliverables} overdue
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between pt-4 border-t ${charColors.border} transition-colors duration-300`}>
          <div className="flex items-center gap-2">
            <div 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-300 bg-gradient-to-r ${charColors.bg} ${charColors.text}`}
            >
              {project.status.toUpperCase()}
            </div>
            
            <div 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-300 ${
                project.health === 'healthy' ? `bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text}` :
                project.health === 'at-risk' ? `bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}` :
                project.health === 'delayed' ? `bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}` :
                `bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}`
              }`}
            >
              {project.health.toUpperCase().replace('-', ' ')}
            </div>
          </div>
          
          {project.targetEndDate && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.inputBg} border ${colors.inputBorder}`}>
              <Calendar className={`w-3.5 h-3.5 ${colors.textMuted}`} />
              <span className={`text-xs font-semibold ${colors.textSecondary}`}>
                {new Date(project.targetEndDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}