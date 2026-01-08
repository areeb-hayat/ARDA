// app/components/employeeticketlogs/PrimarySecondarySection.tsx
'use client';

import React from 'react';
import { Award, Users } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { TicketCollection } from './types';
import DonutChart from './DonutChart';
import StatusLegend from './StatusLegend';
import RecentTicketsList from './RecentTicketsList';

interface PrimarySecondarySectionProps {
  type: 'primary' | 'secondary';
  data: TicketCollection;
}

export default function PrimarySecondarySection({ type, data }: PrimarySecondarySectionProps) {
  const { colors, cardCharacters, theme } = useTheme();

  const isPrimary = type === 'primary';
  const sectionChar = isPrimary ? cardCharacters.completed : cardCharacters.informative;
  const IconComponent = isPrimary ? Award : Users;
  
  const title = isPrimary ? 'Primary Tickets' : 'Secondary Tickets';
  const subtitle = isPrimary 
    ? 'First assignments - Dept workload'
    : 'Follow-up work - Teamwork';

  // Define status colors explicitly - matching DeptTicketsDonut
  const getStatusColor = (status: string): string => {
    const isDark = theme === 'dark';
    
    // Normalize status for comparison
    const normalizedStatus = status.toLowerCase().trim();
    
    if (normalizedStatus.includes('pending')) {
      return isDark ? '#FFB74D' : '#FFA500'; // Orange
    }
    if (normalizedStatus.includes('progress')) {
      return isDark ? '#64B5F6' : '#2196F3'; // Blue
    }
    if (normalizedStatus.includes('blocked')) {
      return isDark ? '#EF5350' : '#F44336'; // Red
    }
    if (normalizedStatus.includes('resolved')) {
      return isDark ? '#81C784' : '#4CAF50'; // Green
    }
    if (normalizedStatus.includes('closed')) {
      return isDark ? '#9E9E9E' : '#757575'; // Gray
    }
    
    // Default gray
    return isDark ? '#9E9E9E' : '#757575';
  };

  // Enhance data with colors for the donut chart
  const enhancedData = data.statusBreakdown.map(item => ({
    status: item.status,
    count: item.count,
    percentage: item.percentage,
    color: getStatusColor(item.status)
  }));

  // Limit recent tickets to 2
  const limitedRecentTickets = data.recentTickets.slice(0, 2);

  if (data.total === 0) {
    return (
      <div className={`relative p-6 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${sectionChar.bg} ${sectionChar.border}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl border-2 ${sectionChar.border}`}>
            <IconComponent className={`h-6 w-6 ${sectionChar.iconColor}`} />
          </div>
          <div>
            <h3 className={`text-lg font-black ${colors.textPrimary}`}>{title}</h3>
            <p className={`text-xs font-semibold ${colors.textMuted}`}>{subtitle}</p>
          </div>
        </div>
        
        <p className={`text-sm ${colors.textMuted} text-center py-8`}>
          No {type} tickets found
        </p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl border-2 overflow-hidden bg-gradient-to-br ${sectionChar.bg} ${sectionChar.border}`}>
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border-2 ${sectionChar.border}`}>
            <IconComponent className={`h-6 w-6 ${sectionChar.iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-black ${colors.textPrimary} flex items-center gap-2`}>
              {title}
              <span className={`px-2.5 py-1 rounded-lg text-sm font-black border-2 ${sectionChar.border} ${sectionChar.accent}`}>
                {data.total}
              </span>
            </h3>
            <p className={`text-xs font-semibold ${colors.textMuted}`}>{subtitle}</p>
          </div>
        </div>

        {/* Donut Chart and Legend - Side by Side Layout like DeptTicketsDonut */}
        <div className={`relative p-4 rounded-xl border-2 overflow-hidden ${colors.cardBg} ${colors.borderSubtle}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative flex items-center gap-6">
            {/* Donut Chart */}
            <DonutChart data={enhancedData} size={180} strokeWidth={30} />
            
            {/* Status Legend */}
            <StatusLegend data={enhancedData} />
          </div>
        </div>

        {/* Recent Tickets - LIMITED TO 2 */}
        <RecentTicketsList tickets={limitedRecentTickets} />
      </div>
    </div>
  );
}