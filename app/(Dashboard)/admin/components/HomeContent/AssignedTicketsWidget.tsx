// app/(Dashboard)/dept-head/components/HomeContent/AssignedTicketsWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, ArrowRight, AlertCircle, Loader2, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme, useCardCharacter } from '@/app/context/ThemeContext';

interface AssignedTicket {
  _id: string;
  ticketNumber: string;
  functionalityName: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface AssignedTicketsWidgetProps {
  onViewAll: () => void;
}

export default function AssignedTicketsWidget({ onViewAll }: AssignedTicketsWidgetProps) {
  const { colors, theme } = useTheme();
  const informativeChar = useCardCharacter('informative');
  const [tickets, setTickets] = useState<AssignedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      const userData = localStorage.getItem('user');
      if (!userData) {
        console.log('❌ No user data in localStorage');
        setError('Please log in again');
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      const identifier = user.username || user._id || user.id || user.userId;
      
      if (!identifier) {
        console.error('❌ No user identifier found in user object:', user);
        setError('Unable to identify user. Please log in again.');
        setLoading(false);
        return;
      }
      
      try {
        console.log('🔍 Fetching user ID for identifier:', identifier);
        const response = await fetch(`/api/users/get-user-id?identifier=${encodeURIComponent(identifier)}`);
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          setError('Server error: API route not found.');
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
          // Update localStorage with the resolved user ID
          user._id = data.userId;
          localStorage.setItem('user', JSON.stringify(user));
          
          setUserId(data.userId);
          console.log('✅ User ID resolved:', data.userId);
        } else {
          console.error('❌ Failed to fetch user ID:', data.error);
          setError(`Unable to fetch user ID: ${data.error || 'Unknown error'}`);
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Error fetching user ID:', error);
        setError('Failed to fetch user information.');
        setLoading(false);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAssignedTickets();
    }
  }, [userId]);

  const fetchAssignedTickets = async () => {
    try {
      console.log('🎫 Fetching assigned tickets for user:', userId);
      setLoading(true);
      const response = await fetch(`/api/tickets/assigned?userId=${userId}`);
      
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
      
      // Get only the most recent 6 tickets for better horizontal display
      const recentTickets = fetchedTickets
        .sort((a: AssignedTicket, b: AssignedTicket) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 6);
      
      setTickets(recentTickets);
      console.log('✅ Fetched', recentTickets.length, 'recent assigned tickets');
      setError(null);
    } catch (err) {
      console.error('💥 Error fetching assigned tickets:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in-progress':
        return <TrendingUp className="w-4 h-4" />;
      case 'blocked':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    if (theme === 'dark') {
      switch (status) {
        case 'pending': return '#FFB74D';
        case 'in-progress': return '#64B5F6';
        case 'blocked': return '#EF5350';
        case 'resolved': return '#81C784';
        default: return '#90CAF9';
      }
    } else {
      switch (status) {
        case 'pending': return '#FF9800';
        case 'in-progress': return '#2196F3';
        case 'blocked': return '#F44336';
        case 'resolved': return '#4CAF50';
        default: return '#42A5F5';
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    if (theme === 'dark') {
      switch (priority) {
        case 'high': return '#EF5350';
        case 'medium': return '#FFB74D';
        case 'low': return '#81C784';
        default: return '#90CAF9';
      }
    } else {
      switch (priority) {
        case 'high': return '#F44336';
        case 'medium': return '#FF9800';
        case 'low': return '#4CAF50';
        default: return '#42A5F5';
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className={`w-5 h-5 ${colors.textAccent}`} />
            <h3 className={`${colors.textPrimary} text-xl font-black`}>
              Assigned Tickets
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className={`w-8 h-8 ${colors.textAccent} animate-spin mx-auto`} />
            <p className={`${colors.textSecondary} text-sm font-semibold`}>
              Loading tickets...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-red-500" />
            <h3 className={`${colors.textPrimary} text-xl font-black`}>
              Assigned Tickets
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className={`${colors.textSecondary} text-sm font-semibold`}>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-6 bg-gradient-to-b ${colors.buttonPrimary} rounded-full`}></div>
          <h3 className={`${colors.textPrimary} text-xl font-black`}>
            Assigned Tickets
          </h3>
          {tickets.length > 0 && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-br ${colors.cardBg} border ${colors.border} ${colors.textAccent}`}>
              {tickets.length}
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
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

      {/* Tickets Horizontal Scroll */}
      {tickets.length === 0 ? (
        <div className={`flex items-center justify-center py-12 rounded-xl border-2 border-dashed ${colors.border}`}>
          <div className="text-center space-y-2">
            <Ticket className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
            <p className={`${colors.textSecondary} text-sm font-semibold`}>
              No assigned tickets
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Horizontal scroll container */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {tickets.map((ticket) => {
              const statusColor = getStatusColor(ticket.status);
              const priorityColor = getPriorityColor(ticket.priority);
              
              return (
                <div
                  key={ticket._id}
                  onClick={onViewAll}
                  className={`group relative flex-shrink-0 w-[320px] rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.borderHover} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
                >
                  {/* Paper Texture */}
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

                  {/* Hover Glow Effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"
                    style={{ boxShadow: `inset 0 0 30px ${colors.glowPrimary}` }}
                  ></div>

                  <div className="relative z-10 space-y-3">
                    {/* Status Icon & Ticket Number */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ 
                            backgroundColor: `${statusColor}${theme === 'dark' ? '20' : '15'}`,
                            color: statusColor
                          }}
                        >
                          {getStatusIcon(ticket.status)}
                        </div>
                        <span className={`text-sm font-black ${colors.textPrimary}`}>
                          {ticket.ticketNumber}
                        </span>
                      </div>
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: priorityColor }}
                        title={`${ticket.priority} priority`}
                      />
                    </div>

                    {/* Status Badge */}
                    <div
                      className="inline-flex px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: `${statusColor}${theme === 'dark' ? '25' : '15'}`,
                        color: statusColor
                      }}
                    >
                      {ticket.status.replace('-', ' ').toUpperCase()}
                    </div>
                    
                    {/* Functionality Name */}
                    <p className={`text-sm font-semibold ${colors.textSecondary} line-clamp-2 min-h-[2.5rem]`}>
                      {ticket.functionalityName}
                    </p>
                    
                    {/* Footer with Date and Priority */}
                    <div className={`flex items-center justify-between pt-2 border-t-2 ${colors.borderSubtle}`}>
                      <span className={`text-xs ${colors.textMuted} font-medium`}>
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span 
                        className="text-xs font-bold capitalize"
                        style={{ color: priorityColor }}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}