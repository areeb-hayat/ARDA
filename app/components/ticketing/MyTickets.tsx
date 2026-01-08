// ============================================
// app/components/ticketing/MyTickets.tsx
// Card-style layout for tickets created by user
// UPDATED TO MATCH CREATE NEW TICKET LAYOUT
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Ticket as TicketIcon, 
  Loader2, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  Filter,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  Search,
  X,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import CreatorTicketDetailModal from './CreatorTicketDetailModal';

interface Ticket {
  _id: string;
  ticketNumber: string;
  functionalityName: string;
  department: string;
  status: string;
  priority: string;
  workflowStage: string;
  createdAt: string;
  blockers: any[];
  currentAssignee: string;
  currentAssignees: string[];
  raisedBy: {
    userId: string;
    name: string;
  };
  functionality: any;
  workflowHistory: any[];
}

interface Props {
  userId: string;
  onBack?: () => void;
}

export default function MyTickets({ userId, onBack }: Props) {
  const { colors, cardCharacters, showToast } = useTheme();
  const charColors = cardCharacters.informative;
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [userIdentifier, setUserIdentifier] = useState('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Unique functionalities for filter
  const [functionalities, setFunctionalities] = useState<string[]>([]);
  const [functionalityFilter, setFunctionalityFilter] = useState<string>('all');

  useEffect(() => {
    const fetchUserIdentifier = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) return;

      const user = JSON.parse(userData);
      const objectId = user._id || userId;
      setUserIdentifier(objectId);
    };

    fetchUserIdentifier();
  }, [userId]);

  useEffect(() => {
    fetchTickets();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [tickets, statusFilter, searchQuery, priorityFilter, functionalityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets?createdBy=${userId}`);
      
      if (!response.ok) throw new Error('Failed to fetch tickets');

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
      showToast(err instanceof Error ? err.message : 'Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
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
        t.workflowStage.toLowerCase().includes(query)
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
      case 'closed':
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
      case 'closed': return cardCharacters.neutral;
      default: return cardCharacters.informative;
    }
  };

  const getStatusCounts = () => {
    return {
      all: tickets.length,
      pending: tickets.filter(t => t.status === 'pending').length,
      'in-progress': tickets.filter(t => t.status === 'in-progress').length,
      blocked: tickets.filter(t => t.status === 'blocked').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Card with Loading State */}
        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                  <TicketIcon className={`h-6 w-6 ${charColors.iconColor}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-black ${charColors.text}`}>My Tickets</h1>
                  <p className={`text-sm ${colors.textMuted}`}>Loading your tickets...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse`} style={{ backgroundColor: charColors.iconColor.replace('text-', '') }} />
              <Loader2 className={`relative w-12 h-12 animate-spin ${charColors.iconColor}`} />
            </div>
            <p className={`${colors.textSecondary} text-sm font-semibold`}>
              Loading your tickets...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {/* Header Card with Error State */}
        <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                  <TicketIcon className={`h-6 w-6 ${charColors.iconColor}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-black ${charColors.text}`}>My Tickets</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} p-10 text-center`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <div className="mb-6">
              <AlertCircle className={`w-16 h-16 mx-auto ${cardCharacters.urgent.iconColor}`} />
            </div>
            
            <h3 className={`text-xl font-black ${cardCharacters.urgent.text} mb-3`}>
              Unable to Load Tickets
            </h3>
            <p className={`${colors.textSecondary} text-sm mb-6 max-w-md mx-auto`}>
              {error}
            </p>
            
            <button
              onClick={fetchTickets}
              className={`group relative px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 inline-flex items-center gap-2 bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
              ></div>
              <RefreshCw className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-180" />
              <span className="relative z-10">Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Combined Header and Filters Section - Matching Create New Ticket Layout */}
      <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-sm bg-gradient-to-br ${charColors.bg} ${charColors.border} ${colors.shadowCard} transition-all duration-300`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-6 space-y-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${charColors.bg} border-2 ${charColors.border}`}>
                <TicketIcon className={`h-6 w-6 ${charColors.iconColor}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-black ${charColors.text}`}>My Tickets</h1>
                <p className={`text-sm ${colors.textMuted}`}>
                  {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} created by you
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

          {/* Status Tabs (Replacing Department Tabs) */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`group relative px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${
                statusFilter === 'all'
                  ? `bg-gradient-to-r ${charColors.bg} ${charColors.border} ${charColors.text}`
                  : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
              }`}
            >
              {statusFilter === 'all' && (
                <>
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                  ></div>
                </>
              )}
              <span className="relative z-10">All ({counts.all})</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('pending')}
              className={`group relative px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${
                statusFilter === 'pending'
                  ? `bg-gradient-to-r ${charColors.bg} ${charColors.border} ${charColors.text}`
                  : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
              }`}
            >
              {statusFilter === 'pending' && (
                <>
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                  ></div>
                </>
              )}
              <span className="relative z-10">Pending ({counts.pending})</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('in-progress')}
              className={`group relative px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${
                statusFilter === 'in-progress'
                  ? `bg-gradient-to-r ${charColors.bg} ${charColors.border} ${charColors.text}`
                  : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
              }`}
            >
              {statusFilter === 'in-progress' && (
                <>
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                  ></div>
                </>
              )}
              <span className="relative z-10">In Progress ({counts['in-progress']})</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('blocked')}
              className={`group relative px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${
                statusFilter === 'blocked'
                  ? `bg-gradient-to-r ${charColors.bg} ${charColors.border} ${charColors.text}`
                  : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
              }`}
            >
              {statusFilter === 'blocked' && (
                <>
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                  ></div>
                </>
              )}
              <span className="relative z-10">Blocked ({counts.blocked})</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`group relative px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${
                statusFilter === 'resolved'
                  ? `bg-gradient-to-r ${charColors.bg} ${charColors.border} ${charColors.text}`
                  : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
              }`}
            >
              {statusFilter === 'resolved' && (
                <>
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                  ></div>
                </>
              )}
              <span className="relative z-10">Resolved ({counts.resolved})</span>
            </button>
            
            <button
              onClick={() => setStatusFilter('closed')}
              className={`group relative px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${
                statusFilter === 'closed'
                  ? `bg-gradient-to-r ${charColors.bg} ${charColors.border} ${charColors.text}`
                  : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
              }`}
            >
              {statusFilter === 'closed' && (
                <>
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                  ></div>
                </>
              )}
              <span className="relative z-10">Closed ({counts.closed})</span>
            </button>
          </div>

          {/* Search and Filters Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Search Bar */}
            <div className="lg:col-span-5 relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.textMuted}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticket number, functionality..."
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

            {/* Functionality Filter */}
            <div className="lg:col-span-3">
              <select
                value={functionalityFilter}
                onChange={(e) => setFunctionalityFilter(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText}`}
              >
                <option value="all">All Functionalities</option>
                {functionalities.map((func) => (
                  <option key={func} value={func}>{func}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div className="lg:col-span-2">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl text-sm transition-all ${colors.inputBg} border-2 ${colors.inputBorder} ${colors.inputText}`}
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {activeFiltersCount > 0 && (
              <div className="lg:col-span-2 flex items-center">
                <button
                  onClick={clearFilters}
                  className={`group relative w-full px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 overflow-hidden border-2 ${cardCharacters.urgent.border} bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}`}
                >
                  <span className="relative z-10">Clear ({activeFiltersCount})</span>
                </button>
              </div>
            )}
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
                : statusFilter === 'all' 
                  ? "No tickets found" 
                  : `No ${statusFilter.replace('-', ' ')} tickets`}
            </p>
            <p className={`${colors.textSecondary} text-sm mb-4`}>
              {searchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : statusFilter === 'all' 
                  ? 'Create your first ticket to get started' 
                  : 'Try selecting a different filter'}
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
            const isClosed = ticket.status === 'closed';
            const hasUnresolvedBlockers = ticket.blockers?.some((b: any) => !b.isResolved);
            const isSuper = ticket.department === 'Super Workflow';
            
            return (
              <button
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket)}
                className={`group relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm text-left transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${statusChar.bg} ${statusChar.border} ${colors.shadowCard} hover:${colors.shadowHover} ${isClosed ? 'opacity-70' : ''}`}
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
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r ${charColors.bg} ${charColors.text} border ${charColors.border}`}>
                        ⚡ Super Workflow
                      </div>
                    )}
                    
                    {isClosed && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r ${cardCharacters.creative.bg} ${cardCharacters.creative.text} border ${cardCharacters.creative.border}`}>
                        <RotateCcw className="w-3 h-3" />
                        Can Reopen
                      </div>
                    )}
                    
                    {hasUnresolvedBlockers && (
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r ${cardCharacters.urgent.bg} ${cardCharacters.urgent.text} border ${cardCharacters.urgent.border}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {ticket.blockers.filter((b: any) => !b.isResolved).length} Blocker{ticket.blockers.filter((b: any) => !b.isResolved).length > 1 ? 's' : ''}
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
                      <span className={`font-medium ${colors.textMuted}`}>Created:</span>
                      <span className={`font-bold ${statusChar.text}`}>
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && userIdentifier && (
        <CreatorTicketDetailModal
          ticket={selectedTicket}
          userId={userIdentifier}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            setSelectedTicket(null);
            fetchTickets();
          }}
        />
      )}
    </div>
  );
}