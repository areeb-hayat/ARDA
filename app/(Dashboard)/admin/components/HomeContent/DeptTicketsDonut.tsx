// app/(Dashboard)/dept-head/components/HomeContent/DeptTicketsDonut.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';

interface StatusData {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

interface DeptTicketsDonutProps {
  department: string;
  onClick: () => void;
}

export default function DeptTicketsDonut({ department, onClick }: DeptTicketsDonutProps) {
  const { colors, theme } = useTheme();
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeptTickets();
  }, [department]);

  const fetchDeptTickets = async () => {
    try {
      const response = await fetch(`/api/dept-tickets?department=${encodeURIComponent(department)}`);
      if (response.ok) {
        const data = await response.json();
        
        const statusColors: Record<string, string> = {
          pending: theme === 'dark' ? '#FFB74D' : '#FFA500',
          'in-progress': theme === 'dark' ? '#64B5F6' : '#2196F3',
          blocked: theme === 'dark' ? '#EF5350' : '#F44336',
          resolved: theme === 'dark' ? '#81C784' : '#4CAF50',
          closed: theme === 'dark' ? '#9E9E9E' : '#757575'
        };

        const statusLabels: Record<string, string> = {
          pending: 'Pending',
          'in-progress': 'In Progress',
          blocked: 'Blocked',
          resolved: 'Resolved',
          closed: 'Closed'
        };

        const totalTickets = data.statusBreakdown?.reduce((sum: number, item: any) => sum + item.count, 0) || 0;
        
        const formattedData = (data.statusBreakdown || []).map((item: any) => ({
          status: statusLabels[item.status] || item.status,
          count: item.count,
          color: statusColors[item.status] || (theme === 'dark' ? '#9E9E9E' : '#757575'),
          percentage: item.percentage
        }));

        setStatusData(formattedData);
        setTotal(totalTickets);
      }
    } catch (error) {
      console.error('Error fetching dept tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const size = 180;
  const strokeWidth = 30;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercentage = 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`w-8 h-8 border-2 ${colors.textAccent} border-t-transparent rounded-full animate-spin`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={`w-1.5 h-6 bg-gradient-to-b ${colors.buttonPrimary} rounded-full`}></div>
        <h3 className={`text-xl font-black ${colors.textPrimary}`}>
          Department Tickets
        </h3>
      </div>

      <div 
        onClick={onClick}
        className={`group relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 ${colors.borderHover}`}
      >
        {/* Paper Texture */}
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

        {/* Internal glow on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
          style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
        ></div>

        <div className="relative z-10 p-4">
          {/* Donut Chart and Legend - Side by Side */}
          <div className="flex items-center gap-6">
            {/* Donut Chart */}
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
                {statusData.map((item) => {
                  const startAngle = (cumulativePercentage / 100) * circumference;
                  const arcLength = (item.percentage / 100) * circumference;
                  cumulativePercentage += item.percentage;

                  return (
                    <circle
                      key={item.status}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${arcLength} ${circumference}`}
                      strokeDashoffset={-startAngle}
                      className="transition-all duration-500"
                      style={{
                        filter: `drop-shadow(0 0 6px ${item.color}40)`,
                      }}
                    />
                  );
                })}
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-3xl font-black ${colors.textAccent}`}>{total}</div>
                <div className={`text-xs font-bold ${colors.textMuted} mt-1`}>Total</div>
              </div>
            </div>

            {/* Legend - Right Side */}
            <div className="flex-1 space-y-2">
              {statusData.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}