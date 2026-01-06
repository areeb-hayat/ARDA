// app/components/ProjectManagement/depthead/SprintCard.tsx
'use client';

import React from 'react';
import { Zap, ChevronRight, Users, Calendar, Activity, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface SprintCardProps {
  sprint: any;
  onClick: () => void;
}

export default function SprintCard({ sprint, onClick }: SprintCardProps) {
  const { colors, cardCharacters } = useTheme();

  // Get health-based character - FIXED: at-risk should use urgent/warning colors, not informative (blue)
  const getHealthCharacter = () => {
    switch (sprint.health) {
      case 'healthy':
        return cardCharacters.completed;
      case 'at-risk':
        return cardCharacters.urgent; // Changed from informative to urgent
      case 'delayed':
        return cardCharacters.urgent;
      case 'critical':
        return cardCharacters.urgent;
      default:
        return cardCharacters.interactive;
    }
  };

  const charColors = getHealthCharacter();
  
  const activeMembers = sprint.members?.filter((m: any) => !m.leftAt) || [];
  const totalActions = sprint.actions?.length || 0;
  const pendingActions = sprint.actions?.filter((a: any) => a.status !== 'done').length || 0;
  const overdueActions = sprint.actions?.filter((a: any) => {
    if (a.status === 'done' || !a.dueDate) return false;
    return new Date(a.dueDate) < new Date();
  }).length || 0;

  // Calculate days remaining
  const now = new Date();
  const endDate = new Date(sprint.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
            <Zap className={`w-7 h-7 transition-transform duration-500 group-hover:rotate-12 ${charColors.iconColor}`} />
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 group-hover:translate-x-1 bg-gradient-to-r ${charColors.bg}`}>
            <span className={`text-xs font-bold ${charColors.accent}`}>
              Manage
            </span>
            <ChevronRight 
              className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${charColors.iconColor}`}
            />
          </div>
        </div>

        {/* Content - Title First, Number Second */}
        <div className="space-y-1">
          <h3 className={`text-xl font-black ${charColors.text} line-clamp-1 group-hover:${charColors.accent} transition-colors duration-300`}>
            {sprint.title}
          </h3>
          <p className={`text-xs font-bold ${colors.textMuted}`}>
            {sprint.sprintNumber}
          </p>
        </div>
        
        <p className={`text-sm ${colors.textSecondary} line-clamp-2 min-h-[2.5rem] leading-relaxed`}>
          {sprint.description || 'No description provided'}
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
            <Activity className={`w-3.5 h-3.5 ${colors.textMuted}`} />
            <span className={`text-xs font-semibold ${colors.textSecondary}`}>
              {totalActions} actions
            </span>
          </div>

          {overdueActions > 0 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${cardCharacters.urgent.bg}`}>
              <AlertTriangle className={`w-3.5 h-3.5 ${cardCharacters.urgent.iconColor}`} />
              <span className={`text-xs font-bold ${cardCharacters.urgent.text}`}>
                {overdueActions} overdue
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
              {sprint.status.toUpperCase()}
            </div>
            
            <div 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors duration-300 ${
                sprint.health === 'healthy' ? `bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text}` :
                sprint.health === 'at-risk' ? `bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}` :
                sprint.health === 'delayed' ? `bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}` :
                `bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}`
              }`}
            >
              {sprint.health.toUpperCase().replace('-', ' ')}
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
            daysRemaining < 0 ? `bg-gradient-to-r ${cardCharacters.urgent.bg}` : `${colors.inputBg} border ${colors.inputBorder}`
          }`}>
            <Calendar className={`w-3.5 h-3.5 ${daysRemaining < 0 ? cardCharacters.urgent.iconColor : colors.textMuted}`} />
            <span className={`text-xs font-semibold ${daysRemaining < 0 ? cardCharacters.urgent.text : colors.textSecondary}`}>
              {daysRemaining < 0 ? 'Overdue' : `${daysRemaining}d left`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}