// app/components/employeeticketlogs/EmployeeProjectsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { FolderKanban, Package, TrendingUp, Clock, Info } from 'lucide-react';
import DonutChart from './DonutChart';
import StatusLegend from './StatusLegend';
import AnalyticsLoadingState from './AnalyticsLoadingState';
import AnalyticsErrorState from './AnalyticsErrorState';

interface Project {
  _id: string;
  projectNumber: string;
  name: string;
  title: string;
  status: string;
  health: 'healthy' | 'at-risk' | 'critical';
  myRole: string;
  isLead: boolean;
  myDeliverables: number;
  myPendingDeliverables: number;
  myUserId: string;
  myUsername: string;
  deliverables: Deliverable[];
}

interface Deliverable {
  _id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'in-review' | 'done';
  health: 'healthy' | 'at-risk' | 'overdue';
  dueDate: string;
  assignedTo: string[];
}

interface ProjectsData {
  success: boolean;
  projects: Project[];
}

interface EmployeeProjectsTabProps {
  employeeId: string; // This is MongoDB _id
  employeeName: string;
}

export default function EmployeeProjectsTab({ employeeId, employeeName }: EmployeeProjectsTabProps) {
  const { colors, cardCharacters, theme } = useTheme();
  const [data, setData] = useState<ProjectsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsername();
  }, [employeeId]);

  useEffect(() => {
    if (username) {
      fetchData();
    }
  }, [username]);

  const fetchUsername = async () => {
    try {
      // Get username by MongoDB _id
      const response = await fetch(`/api/employee/by-id/${encodeURIComponent(employeeId)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch employee data');
      }
      
      const result = await response.json();
      setUsername(result.username);
      setUserId(result.userId);
    } catch (err) {
      console.error('Error fetching username:', err);
      setError('Failed to load employee data');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    if (!username) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ProjectManagement/employee/projects?userId=${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching projects:', err);
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

  if (!data || data.projects.length === 0) {
    return (
      <div className={`relative p-8 rounded-xl border-2 overflow-hidden text-center ${colors.cardBg} ${colors.borderSubtle}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        <FolderKanban className={`h-12 w-12 ${colors.textMuted} mx-auto mb-3 opacity-50`} />
        <p className={`text-sm font-semibold ${colors.textSecondary}`}>
          {employeeName} is not assigned to any projects yet.
        </p>
      </div>
    );
  }

  // Calculate statistics - use myUserId from API response (or fallback to our userId)
  const allDeliverables = data.projects.flatMap(p => {
    const userIdToCheck = p.myUserId || userId;
    return p.deliverables.filter(d => d.assignedTo.includes(userIdToCheck));
  });
  
  // Calculate deliverable HEALTH statistics (not status)
  // Note: Deliverables don't have health field in schema - calculate from status and blockers
  const deliverableHealthStats = {
    healthy: allDeliverables.filter(d => {
      // Consider healthy if done or no blockers and not overdue
      const hasBlockers = d.blockers && d.blockers.some((b: any) => !b.isResolved);
      const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'done';
      return !hasBlockers && !isOverdue;
    }).length,
    atRisk: allDeliverables.filter(d => {
      // At risk if has unresolved blockers but not overdue
      const hasBlockers = d.blockers && d.blockers.some((b: any) => !b.isResolved);
      const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'done';
      return hasBlockers && !isOverdue;
    }).length,
    delayed: allDeliverables.filter(d => {
      // Delayed if overdue
      const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'done';
      return isOverdue;
    }).length,
  };

  // Calculate project HEALTH statistics
  // Normalize health values and handle undefined/null
  // Schema allows: 'healthy' | 'at-risk' | 'delayed' | 'critical'
  const projectHealthStats = {
    healthy: data.projects.filter(p => {
      const health = p.health?.toLowerCase();
      return health === 'healthy';
    }).length,
    atRisk: data.projects.filter(p => {
      const health = p.health?.toLowerCase();
      return health === 'at-risk' || health === 'at risk';
    }).length,
    delayed: data.projects.filter(p => {
      const health = p.health?.toLowerCase();
      return health === 'delayed';
    }).length,
    critical: data.projects.filter(p => {
      const health = p.health?.toLowerCase();
      return health === 'critical';
    }).length,
  };

  const totalDeliverables = allDeliverables.length;
  const pendingDeliverables = allDeliverables.filter(d => d.status === 'pending' || d.status === 'in-progress').length;

  // Prepare donut chart data for PROJECT HEALTH
  const projectHealthChartData = data.projects.length > 0 ? [
    { 
      status: 'Healthy', 
      count: projectHealthStats.healthy, 
      percentage: (projectHealthStats.healthy / data.projects.length) * 100, 
      color: theme === 'dark' ? '#81C784' : '#4CAF50' 
    },
    { 
      status: 'At Risk', 
      count: projectHealthStats.atRisk, 
      percentage: (projectHealthStats.atRisk / data.projects.length) * 100, 
      color: theme === 'dark' ? '#FFB74D' : '#FFA500' 
    },
    { 
      status: 'Delayed', 
      count: projectHealthStats.delayed, 
      percentage: (projectHealthStats.delayed / data.projects.length) * 100, 
      color: theme === 'dark' ? '#FF9800' : '#FF6F00' 
    },
    { 
      status: 'Critical', 
      count: projectHealthStats.critical, 
      percentage: (projectHealthStats.critical / data.projects.length) * 100, 
      color: theme === 'dark' ? '#EF5350' : '#F44336' 
    },
  ].filter(item => item.count > 0) : [];

  // Prepare donut chart data for DELIVERABLE HEALTH
  const deliverableHealthChartData = [
    { 
      status: 'Healthy', 
      count: deliverableHealthStats.healthy, 
      percentage: totalDeliverables > 0 ? (deliverableHealthStats.healthy / totalDeliverables) * 100 : 0, 
      color: theme === 'dark' ? '#81C784' : '#4CAF50' 
    },
    { 
      status: 'At Risk', 
      count: deliverableHealthStats.atRisk, 
      percentage: totalDeliverables > 0 ? (deliverableHealthStats.atRisk / totalDeliverables) * 100 : 0, 
      color: theme === 'dark' ? '#FFB74D' : '#FFA500' 
    },
    { 
      status: 'Delayed', 
      count: deliverableHealthStats.delayed, 
      percentage: totalDeliverables > 0 ? (deliverableHealthStats.delayed / totalDeliverables) * 100 : 0, 
      color: theme === 'dark' ? '#EF5350' : '#F44336' 
    },
  ].filter(item => item.count > 0);

  console.log('Projects Tab Debug:', {
    totalProjects: data.projects.length,
    rawProjects: data.projects.map(p => ({ id: p._id, health: p.health, name: p.name })),
    projectHealthStats,
    projectHealthChartData,
    allDeliverables: allDeliverables.map(d => ({ health: d.health, status: d.status })),
    totalDeliverables,
    deliverableHealthStats,
    deliverableHealthChartData
  });

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
        {/* Total Projects */}
        <div className={`relative p-5 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${authChar.bg} ${authChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${colors.textMuted} mb-1`}>Total Projects</p>
              <p className={`text-5xl font-black ${authChar.accent}`}>{data.projects.length}</p>
            </div>
            <FolderKanban className={`h-16 w-16 ${authChar.iconColor} opacity-30`} />
          </div>
        </div>

        {/* Total Deliverables */}
        <div className={`relative p-5 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${completedChar.bg} ${completedChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${colors.textMuted} mb-1`}>Deliverables</p>
              <p className={`text-5xl font-black ${completedChar.accent}`}>{totalDeliverables}</p>
            </div>
            <Package className={`h-16 w-16 ${completedChar.iconColor} opacity-30`} />
          </div>
        </div>

        {/* Pending/In Progress */}
        <div className={`relative p-5 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${infoChar.bg} ${infoChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${colors.textMuted} mb-1`}>Pending</p>
              <p className={`text-5xl font-black ${infoChar.accent}`}>{pendingDeliverables}</p>
            </div>
            <Clock className={`h-16 w-16 ${infoChar.iconColor} opacity-30`} />
          </div>
        </div>
      </div>

      {/* Project Health and Deliverable Health - Side by Side */}
      <div className="grid grid-cols-2 gap-6">
        {/* Project Health Section */}
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
                  Project Health
                  <span className={`px-2.5 py-1 rounded-lg text-sm font-black border-2 ${completedChar.border} ${completedChar.accent}`}>
                    {data.projects.length}
                  </span>
                </h3>
                <p className={`text-xs font-semibold ${colors.textMuted}`}>Overall project status</p>
              </div>
            </div>

            {/* Donut Chart and Legend - Side by Side */}
            <div className={`relative p-4 rounded-xl border-2 overflow-hidden ${colors.cardBg} ${colors.borderSubtle}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative flex items-center gap-6">
                {/* Donut Chart */}
                <DonutChart data={projectHealthChartData} size={180} strokeWidth={30} centerLabel="Projects" />
                
                {/* Status Legend */}
                <StatusLegend data={projectHealthChartData} />
              </div>
            </div>

            {/* Recent Projects (limited to 2) */}
            <div className="space-y-3">
              <h4 className={`text-sm font-bold ${colors.textPrimary} flex items-center gap-2`}>
                <FolderKanban className={`h-4 w-4 ${colors.textAccent}`} />
                Recent Projects
              </h4>
              <div className="space-y-2">
                {data.projects.slice(0, 2).map((project) => (
                  <div
                    key={project._id}
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
                              {project.projectNumber}
                            </span>
                            {project.isLead && (
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${completedChar.bg} ${completedChar.accent}`}>
                                LEAD
                              </span>
                            )}
                          </div>
                          <p className={`font-bold ${colors.textPrimary} text-sm`}>
                            {project.name || project.title}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center justify-between mt-3 pt-3 border-t-2 ${colors.borderSubtle}`}>
                        <div className="flex items-center gap-2">
                          <Package className={`h-4 w-4 ${colors.textAccent}`} />
                          <span className={`text-xs font-bold ${colors.textSecondary}`}>
                            {project.myDeliverables} deliverables
                          </span>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-lg border font-bold text-xs ${healthColors[project.health]}`}>
                          {project.health.replace('-', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Deliverable Health Section */}
        <div className={`relative rounded-xl border-2 overflow-hidden bg-gradient-to-br ${infoChar.bg} ${infoChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border-2 ${infoChar.border}`}>
                <Package className={`h-6 w-6 ${infoChar.iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-black ${colors.textPrimary} flex items-center gap-2`}>
                  Deliverable Health
                  <span className={`px-2.5 py-1 rounded-lg text-sm font-black border-2 ${infoChar.border} ${infoChar.accent}`}>
                    {totalDeliverables}
                  </span>
                </h3>
                <p className={`text-xs font-semibold ${colors.textMuted}`}>Work item health breakdown</p>
              </div>
            </div>

            {/* Donut Chart and Legend - Side by Side */}
            {totalDeliverables > 0 ? (
              <div className={`relative p-4 rounded-xl border-2 overflow-hidden ${colors.cardBg} ${colors.borderSubtle}`}>
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                
                <div className="relative flex items-center gap-6">
                  {/* Donut Chart */}
                  <DonutChart data={deliverableHealthChartData} size={180} strokeWidth={30} centerLabel="Items" />
                  
                  {/* Status Legend */}
                  <StatusLegend data={deliverableHealthChartData} />
                </div>
              </div>
            ) : (
              <div className={`relative p-8 rounded-xl border-2 overflow-hidden text-center ${colors.cardBg} ${colors.borderSubtle}`}>
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                <Package className={`h-12 w-12 ${colors.textMuted} mx-auto mb-2 opacity-50`} />
                <p className={`text-xs font-semibold ${colors.textMuted}`}>No deliverables assigned yet</p>
              </div>
            )}

            {/* Info Box */}
            <div className={`relative p-3 rounded-xl border-2 overflow-hidden flex items-start gap-2 ${colors.cardBg} ${infoChar.border}`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <Info className={`h-4 w-4 ${infoChar.iconColor} flex-shrink-0 mt-0.5 relative z-10`} />
              <div className={`text-xs ${colors.textSecondary} relative z-10`}>
                <p className="font-semibold mb-1">Health Indicators:</p>
                <p className="leading-relaxed"><span className="text-green-500 font-semibold">Healthy:</span> On track</p>
                <p className="leading-relaxed"><span className="text-amber-500 font-semibold">At Risk:</span> Minor blockers</p>
                <p className="leading-relaxed"><span className="text-orange-500 font-semibold">Delayed:</span> Behind schedule</p>
                <p className="leading-relaxed"><span className="text-red-500 font-semibold">Critical:</span> Critical blockers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}