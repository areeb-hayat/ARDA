// app/components/DeptTickets/DeptProjectsContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Loader2, 
  AlertCircle, 
  Search, 
  X,
  RefreshCw,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  ListChecks
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Project {
  _id: string;
  projectNumber: string;
  projectName: string;
  description: string;
  status: string;
  priority: string;
  department: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  members: Array<{
    userId: string;
    name: string;
    role: string;
    joinedAt: Date;
    leftAt?: Date;
  }>;
  deliverables: any[];
  myRole?: string;
  isLead?: boolean;
  myDeliverables?: number;
  myPendingDeliverables?: number;
}

interface DeptProjectsContentProps {
  department: string;
}

export default function DeptProjectsContent({ department }: DeptProjectsContentProps) {
  const { colors, cardCharacters, showToast } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    if (department) {
      fetchProjects();
    }
  }, [department]);

  useEffect(() => {
    applyFilters();
  }, [projects, statusFilter, searchQuery, priorityFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dept-projects?department=${encodeURIComponent(department)}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error: Invalid response format.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
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

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.projectNumber.toLowerCase().includes(query) ||
        p.projectName.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(p => p.priority === priorityFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredProjects(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const activeFiltersCount = [
    searchQuery,
    statusFilter !== 'all' ? statusFilter : '',
    priorityFilter !== 'all' ? priorityFilter : ''
  ].filter(Boolean).length;

  const getStatusCharacter = (status: string) => {
    switch (status) {
      case 'planning': return cardCharacters.interactive;
      case 'active': return cardCharacters.informative;
      case 'on-hold': return cardCharacters.urgent;
      case 'completed': return cardCharacters.completed;
      default: return cardCharacters.neutral;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Clock className="w-5 h-5" />;
      case 'active':
        return <Briefcase className="w-5 h-5" />;
      case 'on-hold':
        return <AlertTriangle className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Briefcase className="w-5 h-5" />;
    }
  };

  const calculateDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse`} style={{ backgroundColor: charColors.iconColor.replace('text-', '') }} />
              <Loader2 className={`relative w-12 h-12 animate-spin ${charColors.iconColor}`} />
            </div>
            <p className={`${colors.textSecondary} text-sm font-semibold`}>
              Loading projects...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} p-10 text-center`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <div className="mb-6">
              <AlertCircle className={`w-16 h-16 mx-auto ${cardCharacters.urgent.iconColor}`} />
            </div>
            <h3 className={`text-xl font-black ${cardCharacters.urgent.text} mb-3`}>Unable to Load Projects</h3>
            <p className={`${colors.textSecondary} text-sm mb-6`}>{error}</p>
            <button
              onClick={fetchProjects}
              className={`group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 inline-flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
              ></div>
              <RefreshCw className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-180" />
              <span className="relative z-10">Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-6 space-y-4">
          {/* Title and Actions Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                <Briefcase className={`h-6 w-6 ${charColors.iconColor}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-black ${charColors.text}`}>Department Projects</h2>
                <p className={`text-sm ${colors.textMuted}`}>
                  {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <button
              onClick={fetchProjects}
              disabled={loading}
              className={`group relative px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} disabled:opacity-50`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
              ></div>
              <RefreshCw className={`h-4 w-4 relative z-10 transition-transform duration-300 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span className="relative z-10">Refresh</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.textMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project number, name, or description..."
                className={`w-full pl-12 pr-12 py-3 rounded-xl text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${colors.textMuted} hover:${cardCharacters.urgent.iconColor} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className={`p-4 rounded-xl border-2 ${charColors.border} bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm`}>
              <div className="flex items-center gap-2 mb-3">
                <Filter className={`h-4 w-4 ${colors.textMuted}`} />
                <span className={`text-sm font-bold ${colors.textSecondary}`}>Filters</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText}`}
                >
                  <option value="all">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText}`}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className={`group relative px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${cardCharacters.urgent.border} bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}`}
                  >
                    Clear ({activeFiltersCount})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} p-16 text-center`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <Briefcase className={`w-16 h-16 ${colors.textMuted} mx-auto mb-4 opacity-40`} />
            <p className={`${colors.textPrimary} text-lg font-bold mb-2`}>
              {searchQuery || activeFiltersCount > 0
                ? "No projects match your filters" 
                : "No projects found"}
            </p>
            <p className={`${colors.textSecondary} text-sm mb-4`}>
              {searchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : 'You are not part of any projects yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const statusChar = getStatusCharacter(project.status);
            const stats = project.stats || {};
            const daysRemaining = stats.daysRemaining;
            const isOverdue = daysRemaining !== null && daysRemaining < 0 && project.status !== 'completed';
            
            return (
              <div
                key={project._id}
                className={`group relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${statusChar.bg} ${statusChar.border} ${colors.shadowCard} hover:${colors.shadowHover}`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
                ></div>

                <div className="relative z-10 p-6 space-y-4">
                  {/* Icon and Status */}
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 bg-gradient-to-r ${statusChar.bg} border-2 ${statusChar.border}`}>
                      {getStatusIcon(project.status)}
                    </div>
                    
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusChar.bg} ${statusChar.text} border ${statusChar.border}`}>
                      {project.status.replace('-', ' ').toUpperCase()}
                    </div>
                  </div>

                  {/* Project Number and Name */}
                  <div>
                    <h3 className={`text-xl font-black ${statusChar.text} mb-1`}>
                      {project.projectNumber}
                    </h3>
                    <p className={`text-sm font-semibold ${colors.textSecondary} line-clamp-2`}>
                      {project.title}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {isOverdue && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text} border ${cardCharacters.urgent.border}`}>
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                      </div>
                    )}
                    
                    {stats.blockedDeliverables > 0 && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text} border ${cardCharacters.urgent.border}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {stats.blockedDeliverables} Blocked
                      </div>
                    )}
                    
                    {stats.pendingDeliverables > 0 && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r ${cardCharacters.interactive.bg} ${cardCharacters.interactive.text} border ${cardCharacters.interactive.border}`}>
                        <ListChecks className="w-3 h-3" />
                        {stats.pendingDeliverables} Pending
                      </div>
                    )}
                  </div>

                  {/* Footer Info */}
                  <div className="pt-3 border-t border-current/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${colors.textMuted}`}>Progress:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-current/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-current/40 rounded-full transition-all duration-300"
                            style={{ width: `${stats.progressPercentage || 0}%` }}
                          ></div>
                        </div>
                        <span className={`font-bold ${statusChar.text}`}>{stats.progressPercentage || 0}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${colors.textMuted}`}>Team Size:</span>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        <span className={`font-bold ${statusChar.text}`}>{stats.teamSize || 0}</span>
                      </div>
                    </div>
                    
                    {daysRemaining !== null && (
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${colors.textMuted}`}>Days Remaining:</span>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          <span className={`font-bold ${isOverdue ? cardCharacters.urgent.text : statusChar.text}`}>
                            {isOverdue ? `${Math.abs(daysRemaining)} overdue` : `${daysRemaining} days`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}