// app/components/employeeticketlogs/DonutChart.tsx
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface TicketStatusCount {
  status: string;
  count: number;
  percentage: number;
  color?: string;
}

interface DonutChartProps {
  data: TicketStatusCount[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
}

export default function DonutChart({ 
  data, 
  size = 180, 
  strokeWidth = 30,
  centerLabel = 'Total'
}: DonutChartProps) {
  const { colors, theme } = useTheme();

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
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
  
  let cumulativePercentage = 0;

  return (
    <div className="flex-shrink-0 relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={theme === 'dark' ? 'rgba(100, 181, 246, 0.1)' : 'rgba(33, 150, 243, 0.1)'}
          strokeWidth={strokeWidth}
        />
        
        {/* Status arcs */}
        {data.map((item, index) => {
          const startAngle = (cumulativePercentage / 100) * circumference;
          const arcLength = (item.percentage / 100) * circumference;
          cumulativePercentage += item.percentage;
          
          // Get color - try item.color first, then fallback to status-based color
          const statusColor = item.color || getStatusColor(item.status);
          
          return (
            <circle
              key={`${item.status}-${index}`}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={statusColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={-startAngle}
              className="transition-all duration-500"
              style={{
                filter: `drop-shadow(0 0 6px ${statusColor}40)`,
              }}
            />
          );
        })}
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className={`text-3xl font-black ${colors.textAccent}`}>{total}</div>
        <div className={`text-xs font-bold ${colors.textMuted} mt-1`}>{centerLabel}</div>
      </div>
    </div>
  );
}