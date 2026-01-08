// app/components/DeptTickets/DeptTicketsContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Ticket as TicketIcon, 
  Loader2, 
  AlertCircle, 
  Search, 
  X,
  RefreshCw,
  Filter,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Ticket {
  _id: string;
  ticketNumber: string;
  functionalityName: string;
  status: string;
  priority: string;
  workflowStage: string;
  department: string;
  raisedBy: {
    name: string;
    userId: string;
  };
  createdAt: string;
  blockers: any[];
  currentAssignee: string;
  currentAssignees: string[];
  groupLead: string | null;
  functionality: any;
  workflowHistory: any[];
  contributors: Array<{
    userId: string;
    name: string;
    role: string;
    joinedAt: Date;
    leftAt?: Date;
  }>;
}

interface DeptTicketsContentProps {
  department: string;
}

export default function DeptTicketsContent({ department }: DeptTicketsContentProps) {
  const { colors, cardCharacters, showToast } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter and search states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Unique functionalities for filter
  const [functionalities, setFunctionalities] = useState<string[]>([]);
  const [functionalityFilter, setFunctionalityFilter] = useState<string>('all');

  useEffect(() => {
    if (department) {
      fetchTickets();
    }
  }, [department]);

  useEffect(() => {
    applyFilters();
  }, [tickets, statusFilter, searchQuery, priorityFilter, functionalityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/by-department?department=${encodeURIComponent(department)}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error: Invalid response format.');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tickets');
      }

      const data = await response.json();
      const fetchedTickets = data.tickets || [];
      setTickets(fetchedTickets);
      
      // Extract unique functionalities
      const uniqueFunctionalities = Array.from(
        new Set(fetchedTickets.map((t: Ticket) => t.functionalityName))
      ).sort();
      setFunctionalities(uniqueFunctionalities as string[]);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.ticketNumber.toLowerCase().includes(query) ||
        t.functionalityName.toLowerCase().includes(query) ||
        t.raisedBy.name.toLowerCase().includes(query)
      );
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    if (functionalityFilter !== 'all') {
      filtered = filtered.filter(t => t.functionalityName === functionalityFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredTickets(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setFunctionalityFilter('all');
  };

  const activeFiltersCount = [
    searchQuery,
    statusFilter !== 'all' ? statusFilter : '',
    priorityFilter !== 'all' ? priorityFilter : '',
    functionalityFilter !== 'all' ? functionalityFilter : ''
  ].filter(Boolean).length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'in-progress':
        return <TrendingUp className="w-5 h-5" />;
      case 'blocked':
        return <AlertTriangle className="w-5 h-5" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <TicketIcon className="w-5 h-5" />;
    }
  };

  const getStatusCharacter = (status: string) => {
    switch (status) {
      case 'pending': return cardCharacters.interactive;
      case 'in-progress': return cardCharacters.informative;
      case 'blocked': return cardCharacters.urgent;
      case 'resolved': return cardCharacters.completed;
      default: return cardCharacters.neutral;
    }
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
              Loading department tickets...
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
            <h3 className={`text-xl font-black ${cardCharacters.urgent.text} mb-3`}>Unable to Load Tickets</h3>
            <p className={`${colors.textSecondary} text-sm mb-6`}>{error}</p>
            <button
              onClick={fetchTickets}
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
                <TicketIcon className={`h-6 w-6 ${charColors.iconColor}`} />
              </div>
              <div>
                <h2 className={`text-2xl font-black ${charColors.text}`}>Department Tickets</h2>
                <p className={`text-sm ${colors.textMuted}`}>
                  {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} in {department}
                </p>
              </div>
            </div>
            
            <button
              onClick={fetchTickets}
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
                placeholder="Search by ticket number, functionality, or raised by..."
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
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="resolved">Resolved</option>
                </select>

                <select
                  value={functionalityFilter}
                  onChange={(e) => setFunctionalityFilter(e.target.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText}`}
                >
                  <option value="all">All Functionalities</option>
                  {functionalities.map((func) => (
                    <option key={func} value={func}>{func}</option>
                  ))}
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
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={clearFilters}
                    className={`group relative px-4 py-2 rounded-xl font-bold text-xs transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${cardCharacters.urgent.border} bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}`}
                  >
                    Clear Filters ({activeFiltersCount})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Grid - Card Style */}
      {filteredTickets.length === 0 ? (
        <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} p-16 text-center`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <TicketIcon className={`w-16 h-16 ${colors.textMuted} mx-auto mb-4 opacity-40`} />
            <p className={`${colors.textPrimary} text-lg font-bold mb-2`}>
              {searchQuery || activeFiltersCount > 0
                ? "No tickets match your filters" 
                : "No tickets in this department"}
            </p>
            <p className={`${colors.textSecondary} text-sm mb-4`}>
              {searchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : 'There are no tickets in this department at the moment'}
            </p>
            {(searchQuery || activeFiltersCount > 0) && (
              <button
                onClick={clearFilters}
                className={`group relative mt-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 inline-flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
              >
                <span className="relative z-10">Clear All Filters</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => {
            const statusChar = getStatusCharacter(ticket.status);
            const isInGroup = ticket.currentAssignees && ticket.currentAssignees.length > 1;
            const hasUnresolvedBlockers = ticket.blockers?.some((b: any) => !b.isResolved);
            const isSuper = ticket.department === 'Super Workflow';
            
            return (
              <div
                key={ticket._id}
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
                      {getStatusIcon(ticket.status)}
                    </div>
                    
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${statusChar.bg} ${statusChar.text} border ${statusChar.border}`}>
                      {ticket.status.replace('-', ' ').toUpperCase()}
                    </div>
                  </div>

                  {/* Ticket Number */}
                  <div>
                    <h3 className={`text-xl font-black ${statusChar.text} mb-1`}>
                      {ticket.ticketNumber}
                    </h3>
                    <p className={`text-sm font-semibold ${colors.textSecondary} line-clamp-2`}>
                      {ticket.functionalityName}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {isSuper && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-2 border-purple-500/30`}>
                        ⚡ Super Workflow
                      </div>
                    )}
                    
                    {isInGroup && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r ${cardCharacters.creative.bg} ${cardCharacters.creative.text} border ${cardCharacters.creative.border}`}>
                        <Users className="w-3 h-3" />
                        Group
                      </div>
                    )}
                    
                    {hasUnresolvedBlockers && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text} border ${cardCharacters.urgent.border}`}>
                        <AlertTriangle className="w-3 h-3" />
                        Blocked
                      </div>
                    )}
                  </div>

                  {/* Footer Info */}
                  <div className="pt-3 border-t border-current/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${colors.textMuted}`}>Priority:</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                          ticket.priority === 'high' ? 'bg-red-500' :
                          ticket.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></div>
                        <span className={`font-bold capitalize ${statusChar.text}`}>{ticket.priority}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${colors.textMuted}`}>Raised by:</span>
                      <span className={`font-bold ${statusChar.text}`}>{ticket.raisedBy.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${colors.textMuted}`}>Created:</span>
                      <span className={`font-bold ${statusChar.text}`}>
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
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