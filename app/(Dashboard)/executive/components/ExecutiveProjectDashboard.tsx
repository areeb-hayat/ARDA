// app/(Dashboard)/executive/components/ExecutiveProjectDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  FolderKanban,
  Zap,
  Plus,
  Building2
} from 'lucide-react';
import ProjectsView from '@/app/components/ProjectManagement/depthead/ProjectsView';
import SprintsView from '@/app/components/ProjectManagement/depthead/SprintsView';
import CreateProjectModal from '@/app/components/ProjectManagement/depthead/CreateProjectModal';
import CreateSprintModal from '@/app/components/ProjectManagement/depthead/CreateSprintModal';

interface ExecutiveProjectDashboardProps {
  onBack?: () => void;
}

type ContentType = 'projects' | 'sprints';

export default function ExecutiveProjectDashboard({ onBack }: ExecutiveProjectDashboardProps) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;

  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [executiveDepartments, setExecutiveDepartments] = useState<string[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<string>('');
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  const [contentType, setContentType] = useState<ContentType>('projects');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Modals
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateSprint, setShowCreateSprint] = useState(false);

  // Get user data and fetch executive departments
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const id = user._id || user.id || user.userId || user.username;
      const name = user.displayName || user.username || 'User';
      setUserId(id);
      setUserName(name);
    }
  }, []);

  // Fetch executive departments
  useEffect(() => {
    if (userId) {
      fetchExecutiveDepartments();
    }
  }, [userId]);

  const fetchExecutiveDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await fetch(`/api/admin/executive-departments?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const depts = data.departments || [];
        setExecutiveDepartments(depts);
        
        // Set first department as active
        if (depts.length > 0 && !activeDepartment) {
          setActiveDepartment(depts[0]);
        }
      } else {
        console.error('Failed to fetch executive departments');
      }
    } catch (error) {
      console.error('Error fetching executive departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateClick = () => {
    if (contentType === 'projects') {
      setShowCreateProject(true);
    } else {
      setShowCreateSprint(true);
    }
  };

  if (loadingDepartments) {
    return (
      <div className="space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <h2 className={`text-xl font-black ${charColors.text} mb-2`}>Project Management</h2>
            <p className={`text-sm ${colors.textMuted}`}>Loading your departments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (executiveDepartments.length === 0) {
    return (
      <div className="space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative text-center">
            <Building2 className={`h-16 w-16 ${colors.textMuted} mx-auto mb-4 opacity-40`} />
            <h2 className={`text-xl font-black ${charColors.text} mb-2`}>No Departments Assigned</h2>
            <p className={`text-sm ${colors.textMuted}`}>
              No departments have been assigned to your executive account. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Paper Texture Background */}
      <div className={`fixed inset-0 ${colors.paperTexture} opacity-[0.02] pointer-events-none`}></div>
      
      <div className="relative space-y-5">
        {/* Header */}
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${charColors.bg}`}>
                  {contentType === 'projects' ? (
                    <FolderKanban className={`w-6 h-6 ${charColors.iconColor}`} />
                  ) : (
                    <Zap className={`w-6 h-6 ${charColors.iconColor}`} />
                  )}
                </div>
                <div>
                  <h2 className={`text-2xl font-black ${charColors.text}`}>
                    Project Management
                  </h2>
                  <p className={`text-sm ${colors.textMuted}`}>
                    Manage projects & sprints across departments
                  </p>
                </div>
              </div>

              <button
                onClick={handleCreateClick}
                disabled={!activeDepartment}
                className={`group relative px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                ></div>
                <Plus className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-90" />
                <span className="relative z-10">Create {contentType === 'projects' ? 'Project' : 'Sprint'}</span>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setContentType('projects')}
                className={`group relative px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden border-2 ${
                  contentType === 'projects'
                    ? `bg-gradient-to-br ${charColors.bg} ${charColors.border} ${charColors.text}`
                    : `bg-gradient-to-br ${colors.cardBg} ${colors.borderSubtle} ${colors.textSecondary}`
                }`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    boxShadow: contentType === 'projects'
                      ? `inset 0 0 20px ${colors.glowPrimary}` 
                      : `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` 
                  }}
                ></div>
                <FolderKanban className={`w-4 h-4 relative z-10 transition-all duration-300 group-hover:rotate-12 group-hover:translate-x-1 ${contentType === 'projects' ? charColors.iconColor : ''}`} />
                <span className="relative z-10">Projects</span>
              </button>
              
              <button
                onClick={() => setContentType('sprints')}
                className={`group relative px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden border-2 ${
                  contentType === 'sprints'
                    ? `bg-gradient-to-br ${charColors.bg} ${charColors.border} ${charColors.text}`
                    : `bg-gradient-to-br ${colors.cardBg} ${colors.borderSubtle} ${colors.textSecondary}`
                }`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    boxShadow: contentType === 'sprints'
                      ? `inset 0 0 20px ${colors.glowPrimary}` 
                      : `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` 
                  }}
                ></div>
                <Zap className={`w-4 h-4 relative z-10 transition-all duration-300 group-hover:rotate-12 group-hover:translate-x-1 ${contentType === 'sprints' ? charColors.iconColor : ''}`} />
                <span className="relative z-10">Sprints</span>
              </button>
            </div>
          </div>
        </div>

        {/* Department Tabs */}
        <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.shadowCard}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className={`h-5 w-5 ${charColors.iconColor} transition-all duration-300`} />
              <span className={`text-sm font-bold ${colors.textSecondary} uppercase tracking-wider`}>
                Your Departments
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {executiveDepartments.map((dept) => {
                const isActive = activeDepartment === dept;
                
                return (
                  <button
                    key={dept}
                    onClick={() => setActiveDepartment(dept)}
                    className={`group relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${
                      isActive
                        ? `bg-gradient-to-r ${charColors.bg} ${charColors.border} ${charColors.text}`
                        : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
                    }`}
                  >
                    {/* Paper Texture */}
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    
                    {/* Internal Glow - appears on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ 
                        boxShadow: isActive 
                          ? `inset 0 0 20px ${colors.glowPrimary}` 
                          : `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` 
                      }}
                    ></div>
                    
                    <span className="relative z-10">{dept}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {activeDepartment && (
          <>
            {contentType === 'projects' ? (
              <ProjectsView
                key={`projects-${activeDepartment}-${refreshTrigger}`}
                department={activeDepartment}
                userId={userId}
                userName={userName}
                onRefresh={handleRefresh}
              />
            ) : (
              <SprintsView
                key={`sprints-${activeDepartment}-${refreshTrigger}`}
                department={activeDepartment}
                userId={userId}
                userName={userName}
                onRefresh={handleRefresh}
              />
            )}
          </>
        )}

        {/* Create Modals */}
        {showCreateProject && activeDepartment && (
          <CreateProjectModal
            department={activeDepartment}
            userId={userId}
            userName={userName}
            onClose={() => setShowCreateProject(false)}
            onSuccess={() => {
              setShowCreateProject(false);
              handleRefresh();
            }}
          />
        )}

        {showCreateSprint && activeDepartment && (
          <CreateSprintModal
            department={activeDepartment}
            userId={userId}
            userName={userName}
            onClose={() => setShowCreateSprint(false)}
            onSuccess={() => {
              setShowCreateSprint(false);
              handleRefresh();
            }}
          />
        )}
      </div>
    </>
  );
}