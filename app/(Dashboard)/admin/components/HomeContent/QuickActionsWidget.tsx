// app/(Dashboard)/hr-head/components/HomeContent/QuickActionsWidget.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  TicketIcon,
  FileText,
  Users,
  Calendar,
  Building2,
  GitBranch,
  Clock,
  Settings,
  CalendarCheck
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
  isExternal?: boolean;
  externalUrl?: string;
}

interface QuickActionsWidgetProps {
  onNavigate?: (section: string) => void;
}

export default function QuickActionsWidget({ onNavigate }: QuickActionsWidgetProps) {
  const { colors, theme } = useTheme();

  // Combination of HR Employee and Dept Head - most essential actions
  const quickActions: QuickAction[] = [
    {
      id: 'create-ticket',
      label: 'Create Ticket',
      icon: <TicketIcon className="h-4 w-4" />,
      section: 'tickets'
    },
    {
      id: 'assigned-tickets',
      label: 'Assigned Tickets',
      icon: <FileText className="h-4 w-4" />,
      section: 'assigned-tickets'
    },
    {
      id: 'team',
      label: 'My Team',
      icon: <Users className="h-4 w-4" />,
      section: 'team'
    },
    {
      id: 'manage-users',
      label: 'Manage Users',
      icon: <Users className="h-4 w-4" />,
      section: 'manage-users'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <Calendar className="h-4 w-4" />,
      section: 'calendar'
    },
    {
      id: 'appointments',
      label: 'Appointments',
      icon: <CalendarCheck className="h-4 w-4" />,
      section: 'appointments'
    },
    {
      id: 'org-info',
      label: 'Org Info',
      icon: <Building2 className="h-4 w-4" />,
      section: 'org-info'
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: <GitBranch className="h-4 w-4" />,
      section: 'workflows'
    },
    {
      id: 'timetrax',
      label: 'TimeTrax',
      icon: <Clock className="h-4 w-4" />,
      isExternal: true,
      externalUrl: 'http://192.168.9.20:90/Login.aspx'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      section: 'settings'
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    console.log('Quick Action clicked:', action.id, action.section);
    
    if (action.isExternal && action.externalUrl) {
      window.open(action.externalUrl, '_blank');
    } else if (action.section) {
      console.log('Calling onNavigate with:', action.section);
      if (onNavigate) {
        onNavigate(action.section);
      } else {
        console.error('onNavigate is not defined!');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-6 bg-gradient-to-b ${colors.buttonPrimary} rounded-full`}></div>
        <h3 className={`text-xl font-black ${colors.textPrimary}`}>
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={`group relative overflow-hidden bg-gradient-to-br ${colors.cardBg} rounded-lg p-3 border-2 ${colors.border} ${colors.borderHover} transition-all duration-300 ${colors.shadowCard} hover:${colors.shadowHover} hover:scale-105`}
          >
            {/* Paper Texture */}
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

            {/* Internal glow on hover */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
            ></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
              <div className={`relative overflow-hidden p-2 rounded-lg bg-gradient-to-br ${colors.buttonPrimary} border-2 ${colors.borderStrong} transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 ${colors.shadowCard}`}>
                {/* Icon Paper Texture */}
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                
                <div className={`relative z-10 ${colors.textOnDark}`}>
                  {action.icon}
                </div>
              </div>
              <span className={`text-xs font-bold ${colors.textPrimary}`}>
                {action.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}