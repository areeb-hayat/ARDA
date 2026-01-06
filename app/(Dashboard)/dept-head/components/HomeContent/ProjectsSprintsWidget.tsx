// app/(Dashboard)/dept-head/components/HomeContent/ProjectsSprintsWidget.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme, useCardCharacter } from '@/app/context/ThemeContext';
import { FolderKanban, Zap, Calendar, Users, ArrowRight, Loader2 } from 'lucide-react';

interface Project {
  _id: string;
  projectNumber: string;
  title: string;
  description?: string;
  status: string;
  health: 'healthy' | 'at-risk' | 'delayed' | 'critical';
  startDate?: string;
  targetEndDate?: string;
  members?: any[];
  deliverables?: any[];
}

interface Sprint {
  _id: string;
  sprintNumber: string;
  title: string;
  description?: string;
  status: string;
  health: 'healthy' | 'at-risk' | 'delayed' | 'critical';
  startDate?: string;
  endDate?: string;
  members?: any[];
  actions?: any[];
}

interface HealthData {
  health: string;
  count: number;
  color: string;
  percentage: number;
}

interface ProjectsSprintsWidgetProps {
  department: string;
  onNavigate?: (section: string) => void;
}

export default function ProjectsSprintsWidget({ department, onNavigate }: ProjectsSprintsWidgetProps) {
  const { colors, theme } = useTheme();
  const informativeChar = useCardCharacter('informative');
  const [view, setView] = useState<'projects' | 'sprints'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allSprints, setAllSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [department, view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view === 'projects') {
        console.log('📊 Fetching projects for department:', department);
        const url = `/api/ProjectManagement/depthead/projects?department=${encodeURIComponent(department)}`;
        console.log('📊 Projects URL:', url);
        
        const response = await fetch(url);
        console.log('📊 Projects response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Projects response:', data);
          
          if (data.success) {
            const projectsArray = data.projects || [];
            
            // Store all projects for donut
            setAllProjects(projectsArray);
            
            // Filter for active projects only for cards
            const activeProjects = projectsArray.filter((p: Project) => 
              p.status === 'active'
            );
            
            // Sort by health priority (worst first) then by oldest
            const healthPriority: Record<string, number> = {
              'critical': 0,
              'delayed': 1,
              'at-risk': 2,
              'healthy': 3
            };
            
            const sortedProjects = activeProjects.sort((a, b) => {
              const healthDiff = healthPriority[a.health] - healthPriority[b.health];
              if (healthDiff !== 0) return healthDiff;
              
              // If same health, sort by oldest (earliest start date)
              const dateA = a.startDate ? new Date(a.startDate).getTime() : Date.now();
              const dateB = b.startDate ? new Date(b.startDate).getTime() : Date.now();
              return dateA - dateB;
            });
            
            console.log('📊 Active projects:', activeProjects.length);
            setProjects(sortedProjects.slice(0, 2)); // Show only 2 projects that need most attention
          } else {
            setProjects([]);
            setAllProjects([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('📊 Projects API error:', errorData);
          setProjects([]);
          setAllProjects([]);
        }
      } else {
        console.log('⚡ Fetching sprints for department:', department);
        const url = `/api/ProjectManagement/depthead/sprints?department=${encodeURIComponent(department)}`;
        console.log('⚡ Sprints URL:', url);
        
        const response = await fetch(url);
        console.log('⚡ Sprints response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('⚡ Sprints response:', data);
          
          if (data.success) {
            const sprintsArray = data.sprints || [];
            
            // Store all sprints for donut
            setAllSprints(sprintsArray);
            
            // Filter for active sprints only for cards
            const activeSprints = sprintsArray.filter((s: Sprint) => 
              s.status === 'active'
            );
            
            // Sort by health priority (worst first) then by oldest
            const healthPriority: Record<string, number> = {
              'critical': 0,
              'delayed': 1,
              'at-risk': 2,
              'healthy': 3
            };
            
            const sortedSprints = activeSprints.sort((a, b) => {
              const healthDiff = healthPriority[a.health] - healthPriority[b.health];
              if (healthDiff !== 0) return healthDiff;
              
              // If same health, sort by oldest (earliest start date)
              const dateA = a.startDate ? new Date(a.startDate).getTime() : Date.now();
              const dateB = b.startDate ? new Date(b.startDate).getTime() : Date.now();
              return dateA - dateB;
            });
            
            console.log('⚡ Active sprints:', activeSprints.length);
            setSprints(sortedSprints.slice(0, 2)); // Show only 2 sprints that need most attention
          } else {
            setSprints([]);
            setAllSprints([]);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('⚡ Sprints API error:', errorData);
          setSprints([]);
          setAllSprints([]);
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching ${view}:`, error);
      if (view === 'projects') {
        setProjects([]);
        setAllProjects([]);
      } else {
        setSprints([]);
        setAllSprints([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    // Using consistent pastel colors for both projects and sprints
    if (theme === 'dark') {
      const darkColors: Record<string, string> = {
        'healthy': '#81C784',      // Sage green - completed character
        'at-risk': '#FFB74D',      // Golden - interactive character
        'delayed': '#FFB74D',      // Same golden as at-risk for consistency
        'critical': '#EF9A9A'      // Soft red - urgent character
      };
      return darkColors[health] || '#9E9E9E';
    } else {
      const lightColors: Record<string, string> = {
        'healthy': '#4CAF50',      // Green - completed character
        'at-risk': '#FF9800',      // Orange - interactive character
        'delayed': '#FF9800',      // Same orange as at-risk for consistency
        'critical': '#F44336'      // Red - urgent character
      };
      return lightColors[health] || '#757575';
    }
  };

  const handleItemClick = () => {
    // Navigate to projects section which will show the project management view
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate health breakdown for donut
  const calculateHealthData = (): HealthData[] => {
    const items = view === 'projects' ? allProjects : allSprints;
    const healthCounts: Record<string, number> = {};
    
    items.forEach(item => {
      const health = item.health || 'healthy';
      healthCounts[health] = (healthCounts[health] || 0) + 1;
    });

    const total = items.length;
    const healthLabels: Record<string, string> = {
      'healthy': 'Healthy',
      'at-risk': 'At Risk',
      'delayed': 'Delayed',
      'critical': 'Critical'
    };

    return Object.entries(healthCounts).map(([health, count]) => ({
      health: healthLabels[health] || health,
      count,
      color: getHealthColor(health),
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  };

  const healthData = calculateHealthData();
  const total = view === 'projects' ? allProjects.length : allSprints.length;

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
            {view === 'projects' ? 'Projects' : 'Sprints'}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Buttons */}
          <div className={`flex gap-2 p-1 rounded-lg bg-gradient-to-br ${colors.cardBg} border ${colors.border}`}>
            <button
              onClick={() => setView('projects')}
              className={`relative overflow-hidden px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                view === 'projects'
                  ? `${colors.buttonPrimary} ${colors.buttonPrimaryText} shadow-md`
                  : `${colors.textMuted} hover:${colors.textPrimary}`
              }`}
            >
              {view === 'projects' && <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>}
              <FolderKanban className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">Projects</span>
            </button>
            <button
              onClick={() => setView('sprints')}
              className={`relative overflow-hidden px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                view === 'sprints'
                  ? `${colors.buttonPrimary} ${colors.buttonPrimaryText} shadow-md`
                  : `${colors.textMuted} hover:${colors.textPrimary}`
              }`}
            >
              {view === 'sprints' && <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>}
              <Zap className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">Sprints</span>
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
              Loading {view}...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          {/* Left Side - Project/Sprint Cards */}
          <div className="col-span-12 lg:col-span-7 space-y-3">
            {view === 'projects' ? (
              projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project._id}
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
                      {/* Health indicator */}
                      <div
                        className="w-1.5 h-full rounded-full flex-shrink-0"
                        style={{ backgroundColor: getHealthColor(project.health), minHeight: '60px' }}
                      ></div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title Row */}
                        <div className="flex items-center gap-2">
                          <FolderKanban className={`h-4 w-4 ${iconColor} flex-shrink-0`} />
                          <h4 className={`font-bold text-sm ${colors.textPrimary} truncate`}>
                            {project.title}
                          </h4>
                        </div>
                        
                        {/* Project Number */}
                        <p className={`text-xs font-bold ${colors.textMuted}`}>
                          {project.projectNumber}
                        </p>

                        {/* Description */}
                        {project.description && (
                          <p className={`text-xs ${colors.textMuted} line-clamp-1`}>
                            {project.description}
                          </p>
                        )}

                        {/* Health Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className="px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"
                            style={{
                              backgroundColor: `${getHealthColor(project.health)}${theme === 'dark' ? '25' : '15'}`,
                              color: getHealthColor(project.health)
                            }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: getHealthColor(project.health) }}
                            ></div>
                            {project.health.toUpperCase().replace('-', ' ')}
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-3">
                          {project.targetEndDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className={`h-3 w-3 ${iconColor}`} />
                              <span className={`text-xs font-semibold ${colors.textMuted}`}>
                                {formatDate(project.targetEndDate)}
                              </span>
                            </div>
                          )}

                          {project.members && project.members.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className={`h-3 w-3 ${iconColor}`} />
                              <span className={`text-xs font-semibold ${colors.textMuted}`}>
                                {project.members.filter((m: any) => !m.leftAt).length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`flex items-center justify-center py-12 rounded-xl border-2 border-dashed ${colors.border}`}>
                  <div className="text-center space-y-2">
                    <FolderKanban className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
                    <p className={`${colors.textSecondary} text-sm font-semibold`}>
                      No active projects
                    </p>
                  </div>
                </div>
              )
            ) : (
              sprints.length > 0 ? (
                sprints.map((sprint) => (
                  <div
                    key={sprint._id}
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
                      {/* Icon with health color */}
                      <div 
                        className={`relative overflow-hidden p-2 rounded-lg flex-shrink-0 border-2`}
                        style={{ 
                          backgroundColor: `${getHealthColor(sprint.health)}${theme === 'dark' ? '25' : '15'}`,
                          borderColor: getHealthColor(sprint.health)
                        }}
                      >
                        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                        <Zap className={`relative z-10 h-4 w-4`} style={{ color: getHealthColor(sprint.health) }} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Title */}
                        <h4 className={`font-bold text-sm ${colors.textPrimary} truncate`}>
                          {sprint.title}
                        </h4>
                        
                        {/* Sprint Number */}
                        <p className={`text-xs font-bold ${colors.textMuted}`}>
                          {sprint.sprintNumber}
                        </p>

                        {/* Description */}
                        {sprint.description && (
                          <p className={`text-xs ${colors.textMuted} line-clamp-1`}>
                            {sprint.description}
                          </p>
                        )}

                        {/* Health Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className="px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1"
                            style={{
                              backgroundColor: `${getHealthColor(sprint.health)}${theme === 'dark' ? '25' : '15'}`,
                              color: getHealthColor(sprint.health)
                            }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: getHealthColor(sprint.health) }}
                            ></div>
                            {sprint.health.toUpperCase().replace('-', ' ')}
                          </div>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-3">
                          {sprint.endDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className={`h-3 w-3 ${iconColor}`} />
                              <span className={`text-xs font-semibold ${colors.textMuted}`}>
                                {formatDate(sprint.endDate)}
                              </span>
                            </div>
                          )}

                          {sprint.members && sprint.members.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className={`h-3 w-3 ${iconColor}`} />
                              <span className={`text-xs font-semibold ${colors.textMuted}`}>
                                {sprint.members.filter((m: any) => !m.leftAt).length}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`flex items-center justify-center py-12 rounded-xl border-2 border-dashed ${colors.border}`}>
                  <div className="text-center space-y-2">
                    <Zap className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
                    <p className={`${colors.textSecondary} text-sm font-semibold`}>
                      No active sprints
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Right Side - Health Donut */}
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
                        stroke={theme === 'dark' ? 'rgba(129, 199, 132, 0.1)' : 'rgba(76, 175, 80, 0.1)'}
                        strokeWidth={strokeWidth}
                      />

                      {/* Health arcs */}
                      {(() => {
                        let cumulativePercentage = 0;
                        return healthData.map((item) => {
                          const startAngle = (cumulativePercentage / 100) * circumference;
                          const arcLength = (item.percentage / 100) * circumference;
                          cumulativePercentage += item.percentage;

                          return (
                            <circle
                              key={item.health}
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
                      <div className={`text-xs font-bold ${colors.textMuted} mt-1`}>Total</div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="w-full space-y-2">
                    {healthData.map((item) => (
                      <div key={item.health} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className={`text-xs font-semibold ${colors.textPrimary}`}>
                            {item.health}
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
                  <FolderKanban className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
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