// app/components/ProjectManagement/employee/EmployeeProjectsDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  FolderKanban,
  Zap,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Package,
  Activity,
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';
import ProjectCard from './ProjectCard';
import SprintCard from './SprintCard';
import ChatSection from '../shared/ChatSection';
import EmployeeTaskCard from './EmployeeTaskCard';

interface EmployeeProjectsDashboardProps {
  userId: string;
  userName: string;
}

type ViewMode = 'list' | 'detail';
type ContentType = 'projects' | 'sprints';
type FilterType = 'all' | 'active' | 'pending' | 'my-lead';

export default function EmployeeProjectsDashboard({ userId, userName }: EmployeeProjectsDashboardProps) {
  const { colors, cardCharacters, showToast } = useTheme();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [contentType, setContentType] = useState<ContentType>('projects');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const [projects, setProjects] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, sprintsRes] = await Promise.all([
        fetch(`/api/ProjectManagement/employee/projects?userId=${userId}`),
        fetch(`/api/ProjectManagement/employee/sprints?userId=${userId}`)
      ]);

      const projectsData = await projectsRes.json();
      const sprintsData = await sprintsRes.json();

      if (projectsData.success) setProjects(projectsData.projects);
      if (sprintsData.success) setSprints(sprintsData.sprints);
    } catch (error) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItem(null);
    fetchData(); // Refresh data
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedItem) return;

    try {
      const endpoint = contentType === 'projects' 
        ? '/api/ProjectManagement/employee/projects/chat'
        : '/api/ProjectManagement/employee/sprints/chat';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [contentType === 'projects' ? 'projectId' : 'sprintId']: selectedItem._id,
          userId,
          userName,
          message
        })
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const updatedData = await response.json();
      if (updatedData.success) {
        setSelectedItem(contentType === 'projects' ? updatedData.project : updatedData.sprint);
        showToast('Message sent', 'success');
      }
    } catch (error) {
      showToast('Failed to send message', 'error');
    }
  };

  // Calculate stats
  const activeProjects = projects.filter(p => p.status === 'active');
  const activeSprints = sprints.filter(s => s.status === 'active');
  
  const totalPendingDeliverables = projects.reduce((sum, p) => sum + (p.myPendingDeliverables || 0), 0);
  const totalPendingActions = sprints.reduce((sum, s) => sum + (s.myPendingActions || 0), 0);
  
  const leadProjects = projects.filter(p => p.isLead);
  const leadSprints = sprints.filter(s => s.isLead);

  // Filter data
  const getFilteredData = () => {
    const data = contentType === 'projects' ? projects : sprints;
    
    switch (filter) {
      case 'active':
        return data.filter(item => item.status === 'active');
      case 'pending':
        if (contentType === 'projects') {
          return data.filter(p => p.myPendingDeliverables > 0);
        } else {
          return data.filter(s => s.myPendingActions > 0);
        }
      case 'my-lead':
        return data.filter(item => item.isLead);
      default:
        return data;
    }
  };

  const filteredData = getFilteredData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className={`w-12 h-12 animate-spin mx-auto ${cardCharacters.informative.iconColor}`} />
          <p className={`${colors.textPrimary} font-bold`}>Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      {viewMode === 'detail' && (
        <button
          onClick={handleBackToList}
          className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${colors.border} ${colors.shadowCard} hover:${colors.shadowHover}`}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
          ></div>
          <ArrowLeft className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:-translate-x-1 ${cardCharacters.informative.iconColor}`} />
          <span className={`text-sm font-bold relative z-10 ${colors.textPrimary}`}>
            Back to {contentType === 'projects' ? 'Projects' : 'Sprints'}
          </span>
        </button>
      )}

      {/* Stats Cards - Only in list view */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* My Projects */}
          <button
            onClick={() => {
              setContentType('projects');
              setFilter('all');
            }}
            className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.authoritative.bg} ${cardCharacters.authoritative.border} ${colors.shadowCard} hover:${colors.shadowHover} p-6 transition-all hover:scale-105 text-left`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
            ></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <FolderKanban className={`w-6 h-6 ${cardCharacters.authoritative.iconColor}`} />
                <div className={`text-3xl font-black ${cardCharacters.authoritative.text}`}>
                  {activeProjects.length}
                </div>
              </div>
              <p className={`text-sm font-bold ${colors.textPrimary}`}>My Projects</p>
            </div>
          </button>

          {/* My Sprints */}
          <button
            onClick={() => {
              setContentType('sprints');
              setFilter('all');
            }}
            className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.interactive.bg} ${cardCharacters.interactive.border} ${colors.shadowCard} hover:${colors.shadowHover} p-6 transition-all hover:scale-105 text-left`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
            ></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Zap className={`w-6 h-6 ${cardCharacters.interactive.iconColor}`} />
                <div className={`text-3xl font-black ${cardCharacters.interactive.text}`}>
                  {activeSprints.length}
                </div>
              </div>
              <p className={`text-sm font-bold ${colors.textPrimary}`}>My Sprints</p>
            </div>
          </button>

          {/* Pending Tasks */}
          <button
            onClick={() => {
              setFilter('pending');
            }}
            className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${colors.shadowCard} hover:${colors.shadowHover} p-6 transition-all hover:scale-105 text-left`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
            ></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Clock className={`w-6 h-6 ${cardCharacters.informative.iconColor}`} />
                <div className={`text-3xl font-black ${cardCharacters.informative.text}`}>
                  {totalPendingDeliverables + totalPendingActions}
                </div>
              </div>
              <p className={`text-sm font-bold ${colors.textPrimary}`}>Pending Tasks</p>
            </div>
          </button>

          {/* I'm Leading */}
          <button
            onClick={() => {
              setFilter('my-lead');
            }}
            className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border} ${colors.shadowCard} hover:${colors.shadowHover} p-6 transition-all hover:scale-105 text-left`}
          >
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
            ></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className={`w-6 h-6 ${cardCharacters.completed.iconColor}`} />
                <div className={`text-3xl font-black ${cardCharacters.completed.text}`}>
                  {leadProjects.length + leadSprints.length}
                </div>
              </div>
              <p className={`text-sm font-bold ${colors.textPrimary}`}>I'm Leading</p>
            </div>
          </button>
        </div>
      )}

      {/* Navigation - Only in list view */}
      {viewMode === 'list' && (
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${colors.shadowCard}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${cardCharacters.informative.bg}`}>
                  {contentType === 'projects' ? (
                    <FolderKanban className={`w-5 h-5 ${cardCharacters.informative.iconColor}`} />
                  ) : (
                    <Zap className={`w-5 h-5 ${cardCharacters.informative.iconColor}`} />
                  )}
                </div>
                <div>
                  <h2 className={`text-xl font-black ${cardCharacters.informative.text}`}>
                    My Work
                  </h2>
                  <p className={`text-xs ${colors.textMuted}`}>
                    {filteredData.length} {contentType} {filter !== 'all' && `(${filter.replace('-', ' ')})`}
                  </p>
                </div>
              </div>

              <button
                onClick={fetchData}
                className={`group relative p-2 rounded-lg transition-all overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <RefreshCw className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-180`} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setContentType('projects');
                  setFilter('all');
                }}
                className={`group relative flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 overflow-hidden ${
                  contentType === 'projects'
                    ? `bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`
                    : `${colors.inputBg} ${colors.textSecondary} hover:bg-opacity-60`
                }`}
              >
                {contentType === 'projects' && (
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                  ></div>
                )}
                <FolderKanban className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Projects</span>
              </button>
              
              <button
                onClick={() => {
                  setContentType('sprints');
                  setFilter('all');
                }}
                className={`group relative flex-1 px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 overflow-hidden ${
                  contentType === 'sprints'
                    ? `bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`
                    : `${colors.inputBg} ${colors.textSecondary} hover:bg-opacity-60`
                }`}
              >
                {contentType === 'sprints' && (
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                  ></div>
                )}
                <Zap className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Sprints</span>
              </button>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'pending', 'my-lead'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === f
                      ? `bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text}`
                      : `${colors.inputBg} ${colors.textMuted} hover:${colors.textPrimary}`
                  }`}
                >
                  {f.toUpperCase().replace('-', ' ')}
                </button>
              ))}
              
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text} flex items-center gap-1`}
                >
                  <X className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {viewMode === 'list' ? (
        // List View
        filteredData.length === 0 ? (
          <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.borderSubtle} p-16 text-center`}>
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            <div className="relative">
              {contentType === 'projects' ? (
                <FolderKanban className={`h-20 w-20 ${colors.textMuted} mx-auto mb-6 opacity-50`} />
              ) : (
                <Zap className={`h-20 w-20 ${colors.textMuted} mx-auto mb-6 opacity-50`} />
              )}
              <p className={`${colors.textPrimary} text-xl font-semibold mb-2`}>
                No {contentType} found
              </p>
              <p className={`${colors.textSecondary} text-sm`}>
                {filter !== 'all' ? 'Try changing your filter' : `You haven't been assigned to any ${contentType} yet`}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.map((item) =>
              contentType === 'projects' ? (
                <ProjectCard key={item._id} project={item} onClick={() => handleSelectItem(item)} />
              ) : (
                <SprintCard key={item._id} sprint={item} onClick={() => handleSelectItem(item)} />
              )
            )}
          </div>
        )
      ) : (
        // Detail View
        selectedItem && (
          <div className="space-y-6">
            {/* Item Header */}
            <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${colors.shadowCard} p-6`}>
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              <div className="relative space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className={`text-2xl font-black ${cardCharacters.informative.text} mb-1`}>
                      {selectedItem.title}
                    </h2>
                    <p className={`text-sm font-bold ${colors.textMuted}`}>
                      {contentType === 'projects' ? selectedItem.projectNumber : selectedItem.sprintNumber}
                    </p>
                  </div>
                  
                  {selectedItem.isLead && (
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r ${cardCharacters.completed.bg} ${cardCharacters.completed.text}`}>
                      GROUP LEAD
                    </div>
                  )}
                </div>
                
                <p className={`text-sm ${colors.textSecondary}`}>
                  {selectedItem.description}
                </p>
              </div>
            </div>

            {/* My Tasks */}
            <div>
              <h3 className={`text-lg font-black ${colors.textPrimary} mb-4`}>
                My {contentType === 'projects' ? 'Deliverables' : 'Actions'}
              </h3>
              <div className="space-y-3">
                {contentType === 'projects' ? (
                  selectedItem.deliverables?.filter((d: any) => 
                    d.assignedTo.some((id: string) => id === userId || id === selectedItem.myUserId)
                  ).map((deliverable: any) => (
                    <EmployeeTaskCard
                      key={deliverable._id}
                      task={deliverable}
                      parentId={selectedItem._id}
                      userId={userId}
                      userName={userName}
                      isLead={selectedItem.isLead}
                      type="deliverable"
                      onUpdate={() => fetchData().then(() => {
                        const updated = projects.find(p => p._id === selectedItem._id);
                        if (updated) setSelectedItem(updated);
                      })}
                    />
                  ))
                ) : (
                  selectedItem.actions?.filter((a: any) => 
                    a.assignedTo.some((id: string) => id === userId || id === selectedItem.myUserId)
                  ).map((action: any) => (
                    <EmployeeTaskCard
                      key={action._id}
                      task={action}
                      parentId={selectedItem._id}
                      userId={userId}
                      userName={userName}
                      isLead={selectedItem.isLead}
                      type="action"
                      onUpdate={() => fetchData().then(() => {
                        const updated = sprints.find(s => s._id === selectedItem._id);
                        if (updated) setSelectedItem(updated);
                      })}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Chat Section */}
            <ChatSection
              chat={selectedItem.chat || []}
              onSendMessage={handleSendMessage}
              currentUserId={userId}
              currentUserName={userName}
              type={contentType === 'projects' ? 'project' : 'sprint'}
            />
          </div>
        )
      )}
    </div>
  );
}