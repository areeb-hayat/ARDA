// app/components/employeeticketlogs/StatusLegend.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface TicketStatusCount {
  status: string;
  count: number;
  percentage: number;
  color?: string;
}

interface StatusLegendProps {
  data: TicketStatusCount[];
}

export default function StatusLegend({ data }: StatusLegendProps) {
  const { colors, theme } = useTheme();

  // Color mapping matching DeptTicketsDonut
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

  return (
    <div className="flex-1 space-y-2">
      {data.map((item, index) => {
        const statusColor = item.color || getStatusColor(item.status);
        
        return (
          <div key={`${item.status}-${index}`} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: statusColor }}
              ></div>
              <span className={`text-sm font-semibold ${colors.textPrimary}`}>
                {item.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${colors.textPrimary}`}>
                {item.count}
              </span>
              <span className={`text-xs font-semibold ${colors.textMuted}`}>
                ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}