// app/components/employeeticketlogs/EmployeeSprintsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Zap, Target, TrendingUp, Clock, Calendar, Info } from 'lucide-react';
import DonutChart from './DonutChart';
import StatusLegend from './StatusLegend';
import AnalyticsLoadingState from './AnalyticsLoadingState';
import AnalyticsErrorState from './AnalyticsErrorState';

interface Sprint {
  _id: string;
  sprintNumber: string;
  name: string;
  status: string;
  health: 'healthy' | 'at-risk' | 'critical';
  myRole: string;
  isLead: boolean;
  myActions: number;
  myPendingActions: number;
  daysRemaining: number;
  endDate: string;
  actions: Action[];
}

interface Action {
  _id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'in-review' | 'done';
  health: 'healthy' | 'at-risk' | 'overdue';
  dueDate: string;
  assignedTo: string[];
}

interface SprintsData {
  success: boolean;
  sprints: Sprint[];
}

interface EmployeeSprintsTabProps {
  employeeId: string;
  employeeName: string;
}

export default function EmployeeSprintsTab({ employeeId, employeeName }: EmployeeSprintsTabProps) {
  const { colors, cardCharacters, theme } = useTheme();
  const [data, setData] = useState<SprintsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ProjectManagement/employee/sprints?userId=${encodeURIComponent(employeeId)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sprints');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching sprints:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AnalyticsLoadingState />;
  }

  if (error) {
    return <AnalyticsErrorState message={error} onRetry={fetchData} />;
  }

  if (!data || data.sprints.length === 0) {
    return (
      <div className={`relative p-8 rounded-xl border-2 overflow-hidden text-center ${colors.cardBg} ${colors.borderSubtle}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        <Zap className={`h-12 w-12 ${colors.textMuted} mx-auto mb-3 opacity-50`} />
        <p className={`text-sm font-semibold ${colors.textSecondary}`}>
          {employeeName} is not assigned to any sprints yet.
        </p>
      </div>
    );
  }

  // Calculate statistics
  const allActions = data.sprints.flatMap(s => 
    s.actions?.filter(a => a.assignedTo.includes(employeeId)) || []
  );
  
  const actionStats = {
    pending: allActions.filter(a => a.status === 'pending').length,
    inProgress: allActions.filter(a => a.status === 'in-progress').length,
    inReview: allActions.filter(a => a.status === 'in-review').length,
    done: allActions.filter(a => a.status === 'done').length,
  };

  const sprintHealthStats = {
    healthy: data.sprints.filter(s => s.health === 'healthy').length,
    atRisk: data.sprints.filter(s => s.health === 'at-risk').length,
    critical: data.sprints.filter(s => s.health === 'critical').length,
  };

  const totalActions = allActions.length;

  // Prepare donut chart data
  const sprintHealthChartData = [
    { status: 'Healthy', count: sprintHealthStats.healthy, percentage: (sprintHealthStats.healthy / data.sprints.length) * 100, color: theme === 'dark' ? '#81C784' : '#4CAF50' },
    { status: 'At Risk', count: sprintHealthStats.atRisk, percentage: (sprintHealthStats.atRisk / data.sprints.length) * 100, color: theme === 'dark' ? '#FFB74D' : '#FFA500' },
    { status: 'Critical', count: sprintHealthStats.critical, percentage: (sprintHealthStats.critical / data.sprints.length) * 100, color: theme === 'dark' ? '#EF5350' : '#F44336' },
  ].filter(item => item.count > 0);

  const actionStatusChartData = [
    { status: 'Pending', count: actionStats.pending, percentage: (actionStats.pending / totalActions) * 100, color: theme === 'dark' ? '#FFB74D' : '#FFA500' },
    { status: 'In Progress', count: actionStats.inProgress, percentage: (actionStats.inProgress / totalActions) * 100, color: theme === 'dark' ? '#64B5F6' : '#2196F3' },
    { status: 'In Review', count: actionStats.inReview, percentage: (actionStats.inReview / totalActions) * 100, color: theme === 'dark' ? '#9E9E9E' : '#757575' },
    { status: 'Done', count: actionStats.done, percentage: (actionStats.done / totalActions) * 100, color: theme === 'dark' ? '#81C784' : '#4CAF50' },
  ].filter(item => item.count > 0);

  const infoChar = cardCharacters.informative;
  const completedChar = cardCharacters.completed;
  const urgentChar = cardCharacters.urgent;
  const authChar = cardCharacters.authoritative;

  const healthColors = {
    healthy: `${completedChar.bg} ${completedChar.border} ${completedChar.accent}`,
    'at-risk': `${infoChar.bg} ${infoChar.border} ${infoChar.accent}`,
    critical: `${urgentChar.bg} ${urgentChar.border} ${urgentChar.accent}`,
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats - Horizontal Layout (matching Tickets tab) */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Sprints */}
        <div className={`relative p-5 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${authChar.bg} ${authChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${colors.textMuted} mb-1`}>Total Sprints</p>
              <p className={`text-5xl font-black ${authChar.accent}`}>{data.sprints.length}</p>
            </div>
            <Zap className={`h-16 w-16 ${authChar.iconColor} opacity-30`} />
          </div>
        </div>

        {/* Total Actions */}
        <div className={`relative p-5 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${completedChar.bg} ${completedChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${colors.textMuted} mb-1`}>Actions</p>
              <p className={`text-5xl font-black ${completedChar.accent}`}>{totalActions}</p>
            </div>
            <Target className={`h-16 w-16 ${completedChar.iconColor} opacity-30`} />
          </div>
        </div>

        {/* Pending/In Progress */}
        <div className={`relative p-5 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${infoChar.bg} ${infoChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${colors.textMuted} mb-1`}>Pending</p>
              <p className={`text-5xl font-black ${infoChar.accent}`}>{actionStats.pending + actionStats.inProgress}</p>
            </div>
            <Clock className={`h-16 w-16 ${infoChar.iconColor} opacity-30`} />
          </div>
        </div>
      </div>

      {/* Sprint Health and Action Status - Side by Side (matching Tickets tab) */}
      <div className="grid grid-cols-2 gap-6">
        {/* Sprint Health Section */}
        <div className={`relative rounded-xl border-2 overflow-hidden bg-gradient-to-br ${completedChar.bg} ${completedChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border-2 ${completedChar.border}`}>
                <TrendingUp className={`h-6 w-6 ${completedChar.iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-black ${colors.textPrimary} flex items-center gap-2`}>
                  Sprint Health
                  <span className={`px-2.5 py-1 rounded-lg text-sm font-black border-2 ${completedChar.border} ${completedChar.accent}`}>
                    {data.sprints.length}
                  </span>
                </h3>
                <p className={`text-xs font-semibold ${colors.textMuted}`}>Overall sprint status</p>
              </div>
            </div>

            {/* Donut Chart and Legend - Side by Side */}
            <div className={`relative p-4 rounded-xl border-2 overflow-hidden ${colors.cardBg} ${colors.borderSubtle}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative flex items-center gap-6">
                {/* Donut Chart */}
                <DonutChart data={sprintHealthChartData} size={180} strokeWidth={30} centerLabel="Sprints" />
                
                {/* Status Legend */}
                <StatusLegend data={sprintHealthChartData} />
              </div>
            </div>

            {/* Recent Sprints (limited to 2) */}
            <div className="space-y-3">
              <h4 className={`text-sm font-bold ${colors.textPrimary} flex items-center gap-2`}>
                <Zap className={`h-4 w-4 ${colors.textAccent}`} />
                Recent Sprints
              </h4>
              <div className="space-y-2">
                {data.sprints.slice(0, 2).map((sprint) => {
                  const daysRemainingColor = 
                    sprint.daysRemaining < 0 ? urgentChar.accent :
                    sprint.daysRemaining <= 3 ? infoChar.accent :
                    completedChar.accent;

                  return (
                    <div
                      key={sprint._id}
                      className={`group relative p-3 rounded-xl border-2 transition-all duration-200 overflow-hidden ${colors.cardBg} ${colors.borderSubtle} hover:${colors.borderHover} hover:${colors.shadowCard}`}
                    >
                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                      />
                      
                      <div className="relative">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`font-black ${colors.textAccent} text-xs`}>
                                {sprint.sprintNumber}
                              </span>
                              {sprint.isLead && (
                                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${completedChar.bg} ${completedChar.accent}`}>
                                  LEAD
                                </span>
                              )}
                            </div>
                            <p className={`font-bold ${colors.textPrimary} text-sm`}>
                              {sprint.name}
                            </p>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between mt-3 pt-3 border-t-2 ${colors.borderSubtle}`}>
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Target className={`h-3 w-3 ${colors.textMuted}`} />
                              <span className={`font-semibold ${colors.textSecondary}`}>
                                {sprint.myActions} actions
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className={`h-3 w-3 ${colors.textMuted}`} />
                              <span className={`font-semibold ${daysRemainingColor}`}>
                                {sprint.daysRemaining < 0 
                                  ? `${Math.abs(sprint.daysRemaining)}d overdue`
                                  : `${sprint.daysRemaining}d left`
                                }
                              </span>
                            </div>
                          </div>
                          
                          <div className={`px-2 py-1 rounded-lg border font-bold text-xs ${healthColors[sprint.health]}`}>
                            {sprint.health.replace('-', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Status Section */}
        <div className={`relative rounded-xl border-2 overflow-hidden bg-gradient-to-br ${infoChar.bg} ${infoChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border-2 ${infoChar.border}`}>
                <Target className={`h-6 w-6 ${infoChar.iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-black ${colors.textPrimary} flex items-center gap-2`}>
                  Action Status
                  <span className={`px-2.5 py-1 rounded-lg text-sm font-black border-2 ${infoChar.border} ${infoChar.accent}`}>
                    {totalActions}
                  </span>
                </h3>
                <p className={`text-xs font-semibold ${colors.textMuted}`}>Work item breakdown</p>
              </div>
            </div>

            {/* Donut Chart and Legend - Side by Side */}
            <div className={`relative p-4 rounded-xl border-2 overflow-hidden ${colors.cardBg} ${colors.borderSubtle}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative flex items-center gap-6">
                {/* Donut Chart */}
                <DonutChart data={actionStatusChartData} size={180} strokeWidth={30} centerLabel="Actions" />
                
                {/* Status Legend */}
                <StatusLegend data={actionStatusChartData} />
              </div>
            </div>

            {/* Info Box */}
            <div className={`relative p-3 rounded-xl border-2 overflow-hidden flex items-start gap-2 ${colors.cardBg} ${infoChar.border}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <Info className={`h-4 w-4 ${infoChar.iconColor} flex-shrink-0 mt-0.5 relative z-10`} />
              <div className={`text-xs ${colors.textSecondary} relative z-10`}>
                <p className="font-semibold mb-1">Health Indicators:</p>
                <p className="leading-relaxed"><span className="text-green-500 font-semibold">Healthy:</span> On track</p>
                <p className="leading-relaxed"><span className="text-amber-500 font-semibold">At Risk:</span> Minor blockers</p>
                <p className="leading-relaxed"><span className="text-red-500 font-semibold">Critical:</span> Critical blockers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}