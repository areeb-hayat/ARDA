// app/(Dashboard)/employee/components/HomeContent/UpcomingEventsWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, ArrowRight, MapPin, Users, Calendar } from 'lucide-react';
import { useTheme, useCardCharacter } from '@/app/context/ThemeContext';

interface TimeIntent {
  _id: string;
  userId: string;
  type: 'task' | 'deadline' | 'meeting' | 'reminder';
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  priority: 'low' | 'medium' | 'high';
  color?: string;
  location?: string;
  attendees?: string[];
  isCompleted: boolean;
  completedAt?: string;
  hasReminder: boolean;
  reminderMinutesBefore?: number;
  isSystemGenerated: boolean;
  createdBy?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
}

interface UpcomingEventsWidgetProps {
  userId?: string | null;
  onViewAll: () => void;
}

export default function UpcomingEventsWidget({ userId, onViewAll }: UpcomingEventsWidgetProps) {
  const { colors, theme } = useTheme();
  const informativeChar = useCardCharacter('informative');
  const [events, setEvents] = useState<TimeIntent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUpcomingEvents();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchUpcomingEvents = async () => {
    if (!userId) {
      console.log('❌ UpcomingEvents: No user ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('📅 UpcomingEvents: Fetching events for userId:', userId);

      const response = await fetch(`/api/calendar/events?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ UpcomingEvents: Fetched events:', data.events?.length || 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcomingEvents = (data.events || [])
          .filter((event: TimeIntent) => {
            if (event.isCompleted) return false;
            if (!event.startTime) return false;
            
            const eventDate = new Date(event.startTime);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate > today && eventDate <= nextWeek;
          })
          .sort((a: TimeIntent, b: TimeIntent) => {
            if (!a.startTime || !b.startTime) return 0;
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
          })
          .slice(0, 3);
        
        console.log('📊 UpcomingEvents: Upcoming events to display:', upcomingEvents.length);
        setEvents(upcomingEvents);
      } else {
        console.error('❌ UpcomingEvents: Failed to fetch events:', response.status);
      }
    } catch (error) {
      console.error('💥 UpcomingEvents: Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (eventDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }
    
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (event: TimeIntent) => {
    if (event.allDay) {
      return 'All Day';
    }
    
    if (!event.startTime) {
      return 'No time set';
    }
    
    const start = new Date(event.startTime);
    const timeStr = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    
    if (event.endTime) {
      const end = new Date(event.endTime);
      const endTimeStr = end.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${timeStr} - ${endTimeStr}`;
    }
    
    return timeStr;
  };

  const getTypeColor = (type: string) => {
    if (theme === 'dark') {
      switch (type) {
        case 'task':
          return 'bg-blue-500/20 text-[#64B5F6]';
        case 'deadline':
          return 'bg-red-500/20 text-[#EF5350]';
        case 'meeting':
          return 'bg-purple-500/20 text-[#AB47BC]';
        case 'reminder':
          return 'bg-yellow-500/20 text-[#FFB74D]';
        default:
          return 'bg-gray-500/20 text-[#9E9E9E]';
      }
    } else {
      switch (type) {
        case 'task':
          return 'bg-blue-500/10 text-blue-600';
        case 'deadline':
          return 'bg-red-500/10 text-red-600';
        case 'meeting':
          return 'bg-purple-500/10 text-purple-600';
        case 'reminder':
          return 'bg-yellow-500/10 text-yellow-600';
        default:
          return 'bg-gray-500/10 text-gray-600';
      }
    }
  };

  const getPriorityIndicator = (priority: string) => {
    const sizes = {
      low: 'w-2 h-2',
      medium: 'w-2.5 h-2.5',
      high: 'w-3 h-3'
    };

    const colors = theme === 'dark' ? {
      low: 'bg-[#81C784]',
      medium: 'bg-[#FFB74D]',
      high: 'bg-[#EF5350]'
    } : {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500'
    };

    return (
      <div className={`${sizes[priority as keyof typeof sizes]} ${colors[priority as keyof typeof colors]} rounded-full`} 
           title={`${priority} priority`} />
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className={`w-8 h-8 border-2 ${colors.textAccent} border-t-transparent rounded-full animate-spin`}></div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className={`${colors.textMuted} text-sm`}>No user data available</p>
      </div>
    );
  }

  const accentColor = theme === 'dark' ? '#90CAF9' : '#42A5F5';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className={`w-5 h-5 ${colors.textAccent}`} />
          <h3 className={`${colors.textPrimary} text-lg font-black`}>Upcoming Events</h3>
        </div>
        <button
          onClick={onViewAll}
          className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${informativeChar.border} ${colors.borderHover} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
        >
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
          ></div>
          <span className={`text-xs font-bold relative z-10 ${informativeChar.accent}`}>View All</span>
          <ArrowRight className={`h-3.5 w-3.5 relative z-10 transition-transform duration-300 group-hover:translate-x-1 icon-rotate ${informativeChar.iconColor}`} />
        </button>
      </div>

      {/* Events List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <CalendarDays className={`w-12 h-12 ${colors.textMuted} mx-auto opacity-40`} />
            <p className={`${colors.textSecondary} text-sm font-semibold`}>No upcoming events</p>
            <p className={`${colors.textMuted} text-xs mt-1`}>You're all caught up!</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event._id}
              className={`relative overflow-hidden p-3 rounded-lg bg-gradient-to-br ${colors.cardBg} border-2 ${colors.border} ${colors.borderHover} transition-all duration-200 cursor-pointer group ${colors.shadowCard}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
              ></div>

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span 
                      className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{
                        backgroundColor: theme === 'dark' ? 'rgba(144, 202, 249, 0.2)' : 'rgba(66, 165, 245, 0.15)',
                        color: accentColor
                      }}
                    >
                      {formatDate(event.startTime!)}
                    </span>
                    {event.type && (
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold capitalize ${getTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    )}
                    {getPriorityIndicator(event.priority)}
                  </div>
                  
                  <h4 className={`${colors.textPrimary} font-bold text-sm mb-1.5 truncate group-hover:${colors.textAccent} transition-colors`}>
                    {event.title}
                  </h4>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className={`w-3.5 h-3.5 ${colors.textAccent}`} />
                      <span className={`${colors.textSecondary} text-xs font-semibold`}>
                        {formatTime(event)}
                      </span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 ${colors.textMuted}`} />
                        <span className={`${colors.textMuted} text-xs truncate`}>
                          {event.location}
                        </span>
                      </div>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className={`w-3.5 h-3.5 ${colors.textMuted}`} />
                        <span className={`${colors.textMuted} text-xs`}>
                          {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    
                    {event.description && (
                      <p className={`${colors.textMuted} text-xs truncate`}>
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}