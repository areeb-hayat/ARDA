// app/components/ProjectManagement/depthead/ProjectsView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  FolderKanban,
  Search,
  X,
  Filter,
  Eye,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import ProjectDetailsModal from './ProjectDetailsModal';

interface Project {
  _id: string;
  projectNumber: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  health: 'healthy' | 'at-risk' | 'delayed' | 'critical';
  members: Array<{ userId: string; name: string; role: string; leftAt?: Date }>;
  groupLead: string;
  startDate: string;
  targetEndDate?: string;
  deliverables: any[];
  createdAt: string;
}

interface ProjectsViewProps {
  department: string;
  userId: string;
  userName: string;
  onRefresh: () => void;
}

export default function ProjectsView({ 
  department, 
  userId, 
  userName,
  onRefresh 
}: ProjectsViewProps) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [department]);

  useEffect(() => {
    applyFilters();
  }, [projects, statusFilter, healthFilter, searchQuery]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/ProjectManagement/depthead/projects?department=${department}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (healthFilter !== 'all') {
      filtered = filtered.filter(p => p.health === healthFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.projectNumber.toLowerCase().includes(query) ||
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setHealthFilter('all');
    setSearchQuery('');
  };

  const activeFiltersCount = [
    statusFilter !== 'all' ? statusFilter : '',
    healthFilter !== 'all' ? healthFilter : '',
    searchQuery
  ].filter(Boolean).length;

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'at-risk':
        return <Clock className="w-4 h-4" />;
      case 'delayed':
        return <TrendingUp className="w-4 h-4" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FolderKanban className="w-4 h-4" />;
    }
  };

  const getHealthColors = (health: string) => {
    switch (health) {
      case 'healthy':
        return cardCharacters.completed;
      case 'at-risk':
        return cardCharacters.interactive;
      case 'delayed':
        return cardCharacters.urgent;
      case 'critical':
        return cardCharacters.urgent;
      default:
        return cardCharacters.neutral;
    }
  };

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'active':
        return cardCharacters.informative;
      case 'completed':
        return cardCharacters.completed;
      case 'archived':
        return cardCharacters.neutral;
      default:
        return cardCharacters.neutral;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse"
              style={{ backgroundColor: charColors.iconColor.replace('text-', '') }}
            />
            <Loader2 className={`relative w-12 h-12 animate-spin ${charColors.iconColor}`} />
          </div>
          <p className={`${colors.textSecondary} text-sm font-semibold`}>
            Loading projects...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} p-10 text-center`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        <div className="relative">
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${cardCharacters.urgent.iconColor}`} />
          <h3 className={`text-xl font-black ${cardCharacters.urgent.text} mb-3`}>
            Unable to Load Projects
          </h3>
          <p className={`${colors.textSecondary} text-sm mb-6`}>{error}</p>
          <button
            onClick={fetchProjects}
            className={`group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 inline-flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
          >
            <span className="relative z-10">Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.border} p-4`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative space-y-3">
          <div className="flex items-center space-x-2 mb-2">
            <Filter className={`h-4 w-4 ${colors.textMuted}`} />
            <span className={`text-xs font-bold ${colors.textSecondary}`}>Filters</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className={`w-full pl-10 pr-10 py-2 rounded-lg text-sm transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${colors.textMuted} hover:${cardCharacters.urgent.iconColor} transition-colors`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            {/* Health Filter */}
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
            >
              <option value="all">All Health</option>
              <option value="healthy">Healthy</option>
              <option value="at-risk">At Risk</option>
              <option value="delayed">Delayed</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className={`group relative px-4 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 overflow-hidden border ${cardCharacters.urgent.border} ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}`}
              >
                Clear Filters ({activeFiltersCount})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} p-16 text-center`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <FolderKanban className={`w-16 h-16 ${colors.textMuted} mx-auto mb-4 opacity-40`} />
            <p className={`${colors.textPrimary} text-lg font-bold mb-2`}>
              {searchQuery || activeFiltersCount > 0
                ? "No projects match your filters"
                : "No projects yet"}
            </p>
            <p className={`${colors.textSecondary} text-sm`}>
              {searchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : 'Create your first project to get started'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProjects.map((project) => {
            const healthColors = getHealthColors(project.health);
            const statusColors = getStatusColors(project.status);
            const activeMembers = project.members.filter(m => !m.leftAt);
            const pendingDeliverables = project.deliverables?.filter(d => d.status !== 'done').length || 0;

            return (
              <div
                key={project._id}
                onClick={() => setSelectedProject(project)}
                className={`group relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.neutral.bg} ${cardCharacters.neutral.border} p-5 ${colors.shadowCard} hover:${colors.shadowHover} transition-all duration-300 cursor-pointer hover:scale-[1.01]`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
                ></div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div 
                        className={`p-2 rounded-lg transition-transform duration-300 group-hover:scale-110 bg-gradient-to-r ${healthColors.bg}`}
                      >
                        {getHealthIcon(project.health)}
                      </div>
                      
                      <h4 className={`text-lg font-black ${colors.textPrimary}`}>
                        {project.projectNumber}
                      </h4>
                      
                      <div
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r ${statusColors.bg} ${statusColors.text}`}
                      >
                        {project.status.toUpperCase()}
                      </div>
                      
                      <div
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r ${healthColors.bg} ${healthColors.text}`}
                      >
                        {project.health.toUpperCase()}
                      </div>
                    </div>
                    
                    <p className={`text-base font-bold ${colors.textPrimary}`}>
                      {project.title}
                    </p>
                    
                    <p className={`text-sm ${colors.textSecondary} line-clamp-2`}>
                      {project.description}
                    </p>
                    
                    <div className={`flex items-center gap-4 text-xs font-medium ${colors.textMuted}`}>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>{activeMembers.length} Members</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{pendingDeliverables} Pending</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(project.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className={`group/btn relative p-3 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 overflow-hidden border-2 ml-4 bg-gradient-to-r ${charColors.bg} ${charColors.border}`}
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                      style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                    ></div>
                    <Eye className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover/btn:scale-110 ${charColors.iconColor}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          userId={userId}
          userName={userName}
          department={department}
          onClose={() => setSelectedProject(null)}
          onUpdate={() => {
            setSelectedProject(null);
            fetchProjects();
            onRefresh();
          }}
        />
      )}
    </div>
  );
}