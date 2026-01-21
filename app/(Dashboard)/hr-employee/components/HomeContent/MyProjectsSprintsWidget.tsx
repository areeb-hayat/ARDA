// app/(Dashboard)/employee/components/HomeContent/MyProjectsSprintsWidget.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme, useCardCharacter } from '@/app/context/ThemeContext';
import { Package, Zap, Calendar, ArrowRight, Loader2, ListChecks, AlertCircle } from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'in-review' | 'done';
  dueDate?: string;
  assignedTo: string[];
  type: 'deliverable' | 'action';
  parentId: string;
  parentTitle: string;
  parentNumber: string;
  blockers?: Array<{
    isResolved: boolean;
  }>;
}

interface StatusData {
  status: string;
  count: number;
  color: string;
  percentage: number;
}

interface MyTasksWidgetProps {
  onNavigate?: (section: string) => void;
}

export default function MyTasksWidget({ onNavigate }: MyTasksWidgetProps) {
  const { colors, theme } = useTheme();
  const informativeChar = useCardCharacter('informative');
  const [view, setView] = useState<'deliverables' | 'actions'>('deliverables');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [userDepartment, setUserDepartment] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserDepartment(user.department || '');
      setUserId(user.username);
    }
  }, []);

  useEffect(() => {
    if (userDepartment && userId) {
      fetchData();
    }
  }, [userDepartment, userId, view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view === 'deliverables') {
        console.log('📦 Fetching projects for deliverables:', userId);
        const url = `/api/ProjectManagement/employee/projects?userId=${userId}`;
        console.log('📦 Projects URL:', url);
        
        const response = await fetch(url);
        console.log('📦 Projects response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Projects response:', data);
          
          if (data.success && data.projects) {
            // Extract all deliverables assigned to user
            const allDeliverables: Task[] = [];
            
            data.projects.forEach((project: any) => {
              if (project.deliverables) {
                project.deliverables.forEach((deliverable: any) => {
                  // Check if user is assigned
                  const isAssigned = deliverable.assignedTo.some((id: string) => 
                    id === userId || id === project.myUserId
                  );
                  
                  if (isAssigned) {
                    allDeliverables.push({
                      _id: deliverable._id,
                      title: deliverable.title,
                      description: deliverable.description,
                      status: deliverable.status,
                      dueDate: deliverable.dueDate,
                      assignedTo: deliverable.assignedTo,
                      type: 'deliverable',
                      parentId: project._id,
                      parentTitle: project.title,
                      parentNumber: project.projectNumber,
                      blockers: deliverable.blockers
                    });
                  }
                });
              }
            });
            
            console.log('📦 All deliverables:', allDeliverables.length);
            
            // Store all for donut
            setAllTasks(allDeliverables);
            
            // Get top 2 priority tasks (pending/in-progress, sorted by due date)
            const priorityTasks = allDeliverables
              .filter(d => d.status === 'pending' || d.status === 'in-progress')
              .sort((a, b) => {
                // Sort by due date (oldest first)
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              })
              .slice(0, 2);
            
            console.log('📦 Priority deliverables:', priorityTasks.length);
            setTasks(priorityTasks);
          } else {
            setTasks([]);
            setAllTasks([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('📦 Projects API error:', errorData);
          setTasks([]);
          setAllTasks([]);
        }
      } else {
        console.log('⚡ Fetching sprints for actions:', userId);
        const url = `/api/ProjectManagement/employee/sprints?userId=${userId}`;
        console.log('⚡ Sprints URL:', url);
        
        const response = await fetch(url);
        console.log('⚡ Sprints response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('⚡ Sprints response:', data);
          
          if (data.success && data.sprints) {
            // Extract all actions assigned to user
            const allActions: Task[] = [];
            
            data.sprints.forEach((sprint: any) => {
              if (sprint.actions) {
                sprint.actions.forEach((action: any) => {
                  // Check if user is assigned
                  const isAssigned = action.assignedTo.some((id: string) => 
                    id === userId || id === sprint.myUserId
                  );
                  
                  if (isAssigned) {
                    allActions.push({
                      _id: action._id,
                      title: action.title,
                      description: action.description,
                      status: action.status,
                      dueDate: action.dueDate,
                      assignedTo: action.assignedTo,
                      type: 'action',
                      parentId: sprint._id,
                      parentTitle: sprint.title,
                      parentNumber: sprint.sprintNumber,
                      blockers: action.blockers
                    });
                  }
                });
              }
            });
            
            console.log('⚡ All actions:', allActions.length);
            
            // Store all for donut
            setAllTasks(allActions);
            
            // Get top 2 priority tasks (pending/in-progress, sorted by due date)
            const priorityTasks = allActions
              .filter(a => a.status === 'pending' || a.status === 'in-progress')
              .sort((a, b) => {
                // Sort by due date (oldest first)
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              })
              .slice(0, 2);
            
            console.log('⚡ Priority actions:', priorityTasks.length);
            setTasks(priorityTasks);
          } else {
            setTasks([]);
            setAllTasks([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('⚡ Sprints API error:', errorData);
          setTasks([]);
          setAllTasks([]);
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching ${view}:`, error);
      setTasks([]);
      setAllTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (theme === 'dark') {
      const darkColors: Record<string, string> = {
        'pending': '#FFB74D',
        'in-progress': '#64B5F6',
        'in-review': '#90CAF9',
        'done': '#81C784'
      };
      return darkColors[status] || '#9E9E9E';
    } else {
      const lightColors: Record<string, string> = {
        'pending': '#FF9800',
        'in-progress': '#2196F3',
        'in-review': '#42A5F5',
        'done': '#4CAF50'
      };
      return lightColors[status] || '#757575';
    }
  };

  const handleItemClick = () => {
    // Navigate to projects section which will show the employee project view
    if (onNavigate) {
      onNavigate('projects');
    }
  };

  const handleViewAll = () => {
    if (onNavigate) {
      onNavigate('projects');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)}d overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays}d left`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const now = new Date();
    return date.getTime() < now.getTime();
  };

  // Calculate status breakdown for donut
  const calculateStatusData = (): StatusData[] => {
    const statusCounts: Record<string, number> = {};
    
    allTasks.forEach(task => {
      const status = task.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const total = allTasks.length;
    const statusLabels: Record<string, string> = {
      'pending': 'Pending',
      'in-progress': 'In Progress',
      'in-review': 'In Review',
      'done': 'Done'
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: statusLabels[status] || status,
      count,
      color: getStatusColor(status),
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  };

  const statusData = calculateStatusData();
  const total = allTasks.length;

  // Donut chart parameters
  const size = 180;
  const strokeWidth = 28;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const iconColor = colors.textAccent;

  return (
    <div className="space-y-4">
      {/* Header with Toggle and View All */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-6 bg-gradient-to-b ${colors.buttonPrimary} rounded-full`}></div>
          <h3 className={`text-xl font-black ${colors.textPrimary}`}>
            My Tasks
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Buttons */}
          <div className={`flex gap-2 p-1 rounded-lg bg-gradient-to-br ${colors.cardBg} border ${colors.border}`}>
            <button
              onClick={() => setView('deliverables')}
              className={`relative overflow-hidden px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                view === 'deliverables'
                  ? `${colors.buttonPrimary} ${colors.buttonPrimaryText} shadow-md`
                  : `${colors.textMuted} hover:${colors.textPrimary}`
              }`}
            >
              {view === 'deliverables' && <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>}
              <Package className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">Deliverables</span>
            </button>
            <button
              onClick={() => setView('actions')}
              className={`relative overflow-hidden px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                view === 'actions'
                  ? `${colors.buttonPrimary} ${colors.buttonPrimaryText} shadow-md`
                  : `${colors.textMuted} hover:${colors.textPrimary}`
              }`}
            >
              {view === 'actions' && <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>}
              <Zap className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">Actions</span>
            </button>
          </div>

          {/* View All Button */}
          <button
            onClick={handleViewAll}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${informativeChar.border} ${colors.borderHover} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
          >
            {/* Paper Texture */}
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            
            {/* Internal glow */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
            ></div>
            
            <span className={`text-xs font-bold relative z-10 ${informativeChar.accent}`}>View All</span>
            <ArrowRight className={`h-3.5 w-3.5 relative z-10 transition-transform duration-300 group-hover:translate-x-1 icon-rotate ${informativeChar.iconColor}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className={`w-8 h-8 ${colors.textAccent} animate-spin mx-auto`} />
            <p className={`${colors.textSecondary} text-sm font-semibold`}>
              Loading tasks...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          {/* Left Side - Task Cards */}
          <div className="col-span-12 lg:col-span-7 space-y-3">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task._id}
                  onClick={handleItemClick}
                  className={`group relative overflow-hidden rounded-xl p-4 border-2 cursor-pointer transition-all duration-300 ${colors.shadowCard} hover:${colors.shadowHover} hover:scale-[1.01] bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.borderHover} backdrop-blur-sm`}
                >
                  {/* Paper Texture */}
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

                  {/* Hover glow effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
                    style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
                  ></div>

                  <div className="relative z-10 flex items-start gap-3">
                    {/* Icon */}
                    <div className={`relative overflow-hidden p-2 rounded-lg flex-shrink-0 bg-gradient-to-br ${colors.glassBg} border-2 ${colors.borderStrong}`}>
                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                      {task.type === 'deliverable' ? (
                        <Package className={`relative z-10 h-4 w-4 ${iconColor}`} />
                      ) : (
                        <Zap className={`relative z-10 h-4 w-4 ${iconColor}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Title */}
                      <h4 className={`font-bold text-sm ${colors.textPrimary} truncate`}>
                        {task.title}
                      </h4>
                      
                      {/* Parent Project/Sprint */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${colors.textMuted}`}>
                          {task.parentNumber}
                        </span>
                        <span className={`text-xs ${colors.textMuted}`}>•</span>
                        <span className={`text-xs ${colors.textMuted} truncate`}>
                          {task.parentTitle}
                        </span>
                      </div>
                      
                      {/* Description */}
                      {task.description && (
                        <p className={`text-xs ${colors.textMuted} line-clamp-1`}>
                          {task.description}
                        </p>
                      )}

                      {/* Status Badge & Blockers */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className="px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"
                          style={{
                            backgroundColor: `${getStatusColor(task.status)}${theme === 'dark' ? '25' : '15'}`,
                            color: getStatusColor(task.status)
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: getStatusColor(task.status) }}
                          ></div>
                          {task.status.replace('-', ' ').toUpperCase()}
                        </div>
                        
                        {task.blockers && task.blockers.filter(b => !b.isResolved).length > 0 && (
                          <div className="px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 bg-red-500/20 text-red-500">
                            <AlertCircle className="w-3 h-3" />
                            {task.blockers.filter(b => !b.isResolved).length} Blocker{task.blockers.filter(b => !b.isResolved).length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {/* Due Date */}
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className={`h-3 w-3 ${isOverdue(task.dueDate) ? 'text-red-500' : iconColor}`} />
                          <span className={`text-xs font-semibold ${isOverdue(task.dueDate) ? 'text-red-500' : colors.textMuted}`}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`flex items-center justify-center py-12 rounded-xl border-2 border-dashed ${colors.border}`}>
                <div className="text-center space-y-2">
                  {view === 'deliverables' ? (
                    <Package className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
                  ) : (
                    <Zap className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
                  )}
                  <p className={`${colors.textSecondary} text-sm font-semibold`}>
                    No active {view}
                  </p>
                  <p className={`${colors.textMuted} text-xs`}>
                    All caught up! 🎉
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Status Donut */}
          <div className="col-span-12 lg:col-span-5">
            {total > 0 ? (
              <div 
                onClick={handleViewAll}
                className={`group relative cursor-pointer overflow-hidden rounded-xl p-5 border-2 transition-all duration-300 h-full ${colors.shadowCard} hover:${colors.shadowHover} bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.borderHover} backdrop-blur-sm`}
              >
                {/* Paper Texture */}
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

                {/* Hover glow effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
                  style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
                ></div>

                <div className="relative z-10 h-full flex flex-col items-center justify-center space-y-4">
                  {/* Donut Chart */}
                  <div className="relative" style={{ width: size, height: size }}>
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
                      {(() => {
                        let cumulativePercentage = 0;
                        return statusData.map((item) => {
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
                        });
                      })()}
                    </svg>

                    {/* Center text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className={`text-3xl font-black ${colors.textAccent}`}>{total}</div>
                      <div className={`text-xs font-bold ${colors.textMuted} mt-1`}>
                        Total {view === 'deliverables' ? 'Deliverables' : 'Actions'}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="w-full space-y-2">
                    {statusData.map((item) => (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className={`text-xs font-semibold ${colors.textPrimary}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${colors.textPrimary}`}>
                            {item.count}
                          </span>
                          <span className={`text-xs font-semibold ${colors.textMuted}`}>
                            ({item.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`flex items-center justify-center h-full rounded-xl border-2 border-dashed ${colors.border}`}>
                <div className="text-center space-y-2">
                  {view === 'deliverables' ? (
                    <Package className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
                  ) : (
                    <Zap className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
                  )}
                  <p className={`${colors.textSecondary} text-sm font-semibold`}>
                    No {view} data
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}