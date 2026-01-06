// ===== app/components/calendars/PersonalCalendar.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import CalendarGrid from './CalendarGrid';
import CalendarSidebar from './CalendarSidebar';
import DayDetailPanel from './DayDetailPanel';
import TodayControlCenter from './TodayControlCenter';
import EventCreator from './EventCreator';
import { autoCompleteExpiredEvents } from '@/app/utils/calendarSync';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react';

interface TimeIntent {
  _id: string;
  type: 'meeting' | 'appointment' | 'task-block' | 'deadline' | 'focus-block' | 'recovery-block' | 'reminder';
  title: string;
  description: string;
  startTime?: Date;
  endTime?: Date;
  allDay: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  color: string;
  isSystemGenerated: boolean;
  autoCompleteOnExpiry: boolean;
}

interface DayHealth {
  _id: string;
  date: Date;
  healthStatus: 'light' | 'balanced' | 'heavy' | 'overloaded';
  metrics: {
    totalEvents: number;
    totalHours: number;
    meetingHours: number;
    focusHours: number;
    deadlineCount: number;
    highPriorityCount: number;
    recoveryHours: number;
  };
}

export default function PersonalCalendar() {
  const { colors, cardCharacters, showToast } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<TimeIntent[]>([]);
  const [dayHealthData, setDayHealthData] = useState<Map<string, DayHealth>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [eventCreatorDate, setEventCreatorDate] = useState<Date>(new Date());
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user._id || user.userId || user.id);
      setUserName(user.name || user.username);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCalendarData();
      autoCompleteExpired();
    }
  }, [userId, currentDate]);

  const autoCompleteExpired = async () => {
    if (!userId) return;
    try {
      await autoCompleteExpiredEvents(userId);
    } catch (error) {
      console.error('Auto-complete error:', error);
    }
  };

  const fetchCalendarData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const eventsResponse = await fetch(
        `/api/calendar/events?userId=${userId}&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
      );
      const eventsData = await eventsResponse.json();

      if (eventsResponse.ok) {
        setEvents(eventsData.events.map((e: any) => ({
          ...e,
          startTime: e.startTime ? new Date(e.startTime) : undefined,
          endTime: e.endTime ? new Date(e.endTime) : undefined,
        })));
      }

      const healthResponse = await fetch('/api/calendar/day-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        }),
      });

      const healthData = await healthResponse.json();

      if (healthResponse.ok) {
        const healthMap = new Map<string, DayHealth>();
        healthData.results.forEach((health: any) => {
          const dateKey = new Date(health.date).toDateString();
          healthMap.set(dateKey, {
            ...health,
            date: new Date(health.date),
          });
        });
        setDayHealthData(healthMap);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventCreated = () => {
    setShowEventCreator(false);
    fetchCalendarData();
  };

  const toggleEventComplete = async (eventId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          updates: { isCompleted: !currentStatus }
        })
      });

      if (response.ok) {
        showToast(
          currentStatus ? 'Event marked as incomplete' : 'Event marked as complete',
          'success'
        );
        fetchCalendarData();
      } else {
        showToast('Failed to update event', 'error');
      }
    } catch (error) {
      showToast('Failed to update event', 'error');
    }
  };

  const getHealthCharacter = (status: string) => {
    switch (status) {
      case 'light': return cardCharacters.completed;
      case 'balanced': return cardCharacters.informative;
      case 'heavy': return cardCharacters.creative;
      case 'overloaded': return cardCharacters.urgent;
      default: return cardCharacters.neutral;
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'light': return <CheckCircle className="w-4 h-4" />;
      case 'balanced': return <Zap className="w-4 h-4" />;
      case 'heavy': return <TrendingUp className="w-4 h-4" />;
      case 'overloaded': return <AlertTriangle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthHealth = Array.from(dayHealthData.values()).reduce(
    (acc, health) => {
      acc[health.healthStatus]++;
      return acc;
    },
    { light: 0, balanced: 0, heavy: 0, overloaded: 0 }
  );

  if (loading && !events.length) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <h2 className={`text-xl font-black ${cardCharacters.informative.text} mb-2`}>ARDA Time & Day Management</h2>
            <p className={`text-sm ${colors.textMuted}`}>Loading your calendar...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 animate-pulse`} style={{ backgroundColor: cardCharacters.informative.iconColor.replace('text-', '') }} />
              <Loader2 className={`relative w-12 h-12 animate-spin ${cardCharacters.informative.iconColor}`} />
            </div>
            <p className={`${colors.textSecondary} text-sm font-semibold`}>Preparing your time canvas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* Header */}
          <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${colors.shadowCard} transition-all duration-300`}>
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
            
            <div className="relative p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${cardCharacters.informative.bg}`}>
                    <Calendar className={`h-5 w-5 ${cardCharacters.informative.iconColor}`} />
                  </div>
                  <div>
                    <h1 className={`text-xl font-black ${cardCharacters.informative.text}`}>Time & Day Management</h1>
                    <p className={`text-xs ${colors.textMuted}`}>
                      Your daily companion for managing attention, energy, and intent
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchCalendarData}
                    disabled={loading}
                    className={`group relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} border border-transparent ${colors.shadowCard} hover:${colors.shadowHover} disabled:opacity-50`}
                  >
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
                    ></div>
                    <RefreshCw className={`h-4 w-4 relative z-10 transition-transform duration-300 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                    <span className="text-sm font-bold relative z-10">Refresh</span>
                  </button>

                  <button
                    onClick={() => {
                      setEventCreatorDate(new Date());
                      setShowEventCreator(true);
                    }}
                    className={`group relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-r ${cardCharacters.creative.bg} ${cardCharacters.creative.text} border ${cardCharacters.creative.border} ${colors.shadowCard} hover:${colors.shadowHover}`}
                  >
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ boxShadow: `inset 0 0 14px ${colors.glowSecondary}, inset 0 0 28px ${colors.glowSecondary}` }}
                    ></div>
                    <Plus className={`h-4 w-4 relative z-10 transition-transform duration-300 group-hover:rotate-90`} />
                    <span className="text-sm font-bold relative z-10">Create Intent</span>
                  </button>
                </div>
              </div>

              {/* Month Navigation & Health Summary */}
              <div className={`p-3 rounded-lg border ${cardCharacters.informative.border} bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousMonth}
                      className={`group relative p-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${cardCharacters.informative.border} hover:${colors.shadowHover}`}
                    >
                      <ChevronLeft className={`h-4 w-4 ${cardCharacters.informative.iconColor} transition-transform duration-300 group-hover:-translate-x-1`} />
                    </button>

                    <h2 className={`text-lg font-black ${colors.textPrimary} min-w-[180px] text-center`}>
                      {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>

                    <button
                      onClick={handleNextMonth}
                      className={`group relative p-2 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${cardCharacters.informative.border} hover:${colors.shadowHover}`}
                    >
                      <ChevronRight className={`h-4 w-4 ${cardCharacters.informative.iconColor} transition-transform duration-300 group-hover:translate-x-1`} />
                    </button>

                    <button
                      onClick={handleToday}
                      className={`group relative px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 overflow-hidden border ${cardCharacters.informative.border} ${cardCharacters.informative.bg} ${cardCharacters.informative.text} ml-2`}
                    >
                      Today
                    </button>
                  </div>

                  {/* Month Health Summary */}
                  <div className="flex items-center gap-2">
                    {(['light', 'balanced', 'heavy', 'overloaded'] as const).map((status) => {
                      const char = getHealthCharacter(status);
                      const count = currentMonthHealth[status];
                      if (count === 0) return null;

                      return (
                        <div
                          key={status}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${char.bg} ${char.text}`}
                        >
                          {getHealthIcon(status)}
                          <span className="capitalize">{status}</span>
                          <span className={`${char.accent}`}>({count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today Control Center */}
          <TodayControlCenter
            userId={userId}
            userName={userName}
            events={events.filter(e => {
              if (!e.startTime) return false;
              const eventDate = new Date(e.startTime).toDateString();
              return eventDate === new Date().toDateString();
            })}
            onRefresh={fetchCalendarData}
          />

          {/* Calendar Grid */}
          <CalendarGrid
            currentDate={currentDate}
            events={events}
            dayHealthData={dayHealthData}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <CalendarSidebar
            currentDate={currentDate}
            events={events}
            onDateSelect={handleDateSelect}
            onToggleComplete={toggleEventComplete}
          />
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          userId={userId}
          userName={userName}
          events={events.filter(e => {
            if (!e.startTime) return false;
            const eventDate = new Date(e.startTime).toDateString();
            return eventDate === selectedDate.toDateString();
          })}
          dayHealth={dayHealthData.get(selectedDate.toDateString())}
          onClose={() => setSelectedDate(null)}
          onUpdate={fetchCalendarData}
          onCreateIntent={(date) => {
            setEventCreatorDate(date);
            setSelectedDate(null);
            setShowEventCreator(true);
          }}
        />
      )}

      {/* Event Creator Modal */}
      {showEventCreator && (
        <EventCreator
          userId={userId}
          userName={userName}
          initialDate={eventCreatorDate}
          onClose={() => setShowEventCreator(false)}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
}