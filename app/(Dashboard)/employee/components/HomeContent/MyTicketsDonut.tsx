// app/(Dashboard)/employee/components/HomeContent/MyTicketsDonut.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Ticket } from 'lucide-react';

interface StatusData {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

interface MyTicketsDonutProps {
  onClick: () => void;
}

export default function MyTicketsDonut({ onClick }: MyTicketsDonutProps) {
  const { colors, theme } = useTheme();
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const identifier = user.username || user._id || user.id || user.userId;
      
      if (!identifier) {
        console.error('No user identifier found');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/users/get-user-id?identifier=${encodeURIComponent(identifier)}`);
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
          user._id = data.userId;
          localStorage.setItem('user', JSON.stringify(user));
          setUserId(data.userId);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
        setLoading(false);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMyTickets();
    }
  }, [userId]);

  const fetchMyTickets = async () => {
    try {
      console.log('📊 Fetching my tickets for user:', userId);
      const response = await fetch(`/api/tickets/assigned?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const tickets = data.tickets || [];
        
        const statusColors: Record<string, string> = {
          pending: theme === 'dark' ? '#FFB74D' : '#FF9800',
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

        // Count tickets by status
        const statusCounts: Record<string, number> = {};
        tickets.forEach((ticket: any) => {
          const status = ticket.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const totalTickets = tickets.length;
        
        const formattedData = Object.entries(statusCounts).map(([status, count]) => ({
          status: statusLabels[status] || status,
          count,
          color: statusColors[status] || (theme === 'dark' ? '#9E9E9E' : '#757575'),
          percentage: totalTickets > 0 ? (count / totalTickets) * 100 : 0
        }));

        setStatusData(formattedData);
        setTotal(totalTickets);
        console.log('✅ My tickets status breakdown:', formattedData);
      }
    } catch (error) {
      console.error('Error fetching my tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const size = 200;
  const strokeWidth = 35;
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
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-1.5 h-6 bg-gradient-to-b ${colors.buttonPrimary} rounded-full`}></div>
        <h3 className={`text-xl font-black ${colors.textPrimary}`}>
          My Tickets
        </h3>
      </div>

      {total === 0 ? (
        <div 
          onClick={onClick}
          className={`flex-1 group relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 ${colors.borderHover} flex items-center justify-center`}
        >
          {/* Paper Texture */}
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

          {/* Internal glow on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
            style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
          ></div>
          
          <div className="relative z-10 text-center space-y-3 p-6">
            <Ticket className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
            <p className={`${colors.textPrimary} text-base font-bold`}>
              No tickets assigned
            </p>
            <p className={`${colors.textSecondary} text-xs`}>
              You have no pending tickets
            </p>
          </div>
        </div>
      ) : (
        <div 
          onClick={onClick}
          className={`flex-1 group relative cursor-pointer overflow-hidden rounded-lg transition-all duration-300 ${colors.borderHover}`}
        >
          {/* Paper Texture */}
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

          {/* Internal glow on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
            style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
          ></div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center p-4">
            {/* Donut Chart - Centered */}
            <div className="flex-shrink-0 relative mb-4" style={{ width: size, height: size }}>
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
                <div className={`text-4xl font-black ${colors.textAccent}`}>{total}</div>
                <div className={`text-xs font-bold ${colors.textMuted} mt-1`}>Total</div>
              </div>
            </div>

            {/* Legend - Below Chart */}
            <div className="w-full grid grid-cols-2 gap-2">
              {statusData.map((item) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${colors.textPrimary} truncate`}>
                      {item.status}
                    </div>
                    <div className={`text-xs font-semibold ${colors.textMuted}`}>
                      {item.count} <span className="text-[10px]">({item.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}