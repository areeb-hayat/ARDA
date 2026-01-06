// ===== app/components/calendars/CalendarSidebar.tsx =====
'use client';

import React, { useMemo } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  ChevronRight
} from 'lucide-react';

interface TimeIntent {
  _id: string;
  type: string;
  title: string;
  startTime?: Date;
  endTime?: Date;
  isCompleted: boolean;
  priority: string;
  color: string;
  isSystemGenerated: boolean;
}

interface CalendarSidebarProps {
  currentDate: Date;
  events: TimeIntent[];
  onDateSelect: (date: Date) => void;
  onToggleComplete: (eventId: string, currentStatus: boolean) => void;
}

export default function CalendarSidebar({
  currentDate,
  events,
  onDateSelect,
  onToggleComplete
}: CalendarSidebarProps) {
  const { colors, cardCharacters } = useTheme();

  // Get today's events
  const todayEvents = useMemo(() => {
    const today = new Date().toDateString();
    return events
      .filter(e => e.startTime && new Date(e.startTime).toDateString() === today)
      .sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  }, [events]);

  // Get upcoming events (next 7 days, excluding today)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return events
      .filter(e => {
        if (!e.startTime) return false;
        const eventDate = new Date(e.startTime);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate > today && eventDate <= nextWeek;
      })
      .sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });
  }, [events]);

  // Mini calendar logic
  const getMiniCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(e => {
      if (!e.startTime) return false;
      return new Date(e.startTime).toDateString() === date.toDateString();
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const miniCalendarDays = getMiniCalendarDays();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-4">
      {/* Mini Calendar */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${colors.shadowCard}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className={`w-4 h-4 ${cardCharacters.informative.iconColor}`} />
            <h3 className={`text-sm font-black ${cardCharacters.informative.text} uppercase`}>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
          </div>

          {/* Mini Calendar Grid */}
          <div className="space-y-1">
            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => (
                <div key={i} className={`text-center text-[10px] font-bold ${colors.textMuted}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {miniCalendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const dayEvents = getEventsForDate(date);
                const today = isToday(date);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => onDateSelect(date)}
                    className={`
                      group relative aspect-square rounded-lg text-[11px] font-bold transition-all duration-200
                      ${today 
                        ? `${cardCharacters.informative.bg} ${cardCharacters.informative.text} ring-1 ${cardCharacters.informative.border}` 
                        : `${colors.cardBg} ${colors.textPrimary} hover:bg-opacity-80`
                      }
                    `}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {date.getDate()}
                    </div>
                    
                    {/* Event dots */}
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEvents.slice(0, 3).map((event, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Events */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${colors.shadowCard}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className={`w-4 h-4 ${cardCharacters.informative.iconColor}`} />
            <h3 className={`text-sm font-black ${cardCharacters.informative.text} uppercase`}>
              Today's Events
            </h3>
            <span className={`ml-auto text-xs ${colors.textMuted} font-bold`}>
              {todayEvents.length}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current/20">
            {todayEvents.length === 0 ? (
              <p className={`text-xs ${colors.textMuted} text-center py-4`}>
                No events today
              </p>
            ) : (
              todayEvents.map(event => (
                <div
                  key={event._id}
                  className={`group relative overflow-hidden rounded-lg border p-2 transition-all duration-300 cursor-pointer ${
                    event.isCompleted
                      ? `${cardCharacters.completed.bg} ${cardCharacters.completed.border} opacity-60`
                      : `${cardCharacters.neutral.bg} ${cardCharacters.neutral.border} hover:shadow-md`
                  }`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                  ></div>

                  <div className="relative flex items-start gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(event._id, event.isCompleted);
                      }}
                      className="flex-shrink-0 mt-0.5 transition-transform duration-300 hover:scale-125"
                    >
                      {event.isCompleted ? (
                        <CheckCircle className={`w-4 h-4 ${cardCharacters.completed.iconColor}`} />
                      ) : (
                        <Circle className={`w-4 h-4 ${colors.textMuted}`} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${event.isCompleted ? 'line-through' : ''} ${colors.textPrimary} truncate`}>
                        {event.title}
                      </p>
                      {event.startTime && (
                        <p className={`text-[10px] ${colors.textMuted} flex items-center gap-1 mt-0.5`}>
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(event.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      )}
                    </div>

                    <div
                      className="w-1 h-full absolute right-0 top-0 rounded-r-lg"
                      style={{ backgroundColor: event.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events (Next 7 Days) */}
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.creative.bg} ${cardCharacters.creative.border} ${colors.shadowCard}`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-4">
          <div className="flex items-center gap-2 mb-3">
            <ChevronRight className={`w-4 h-4 ${cardCharacters.creative.iconColor}`} />
            <h3 className={`text-sm font-black ${cardCharacters.creative.text} uppercase`}>
              Upcoming
            </h3>
            <span className={`ml-auto text-xs ${colors.textMuted} font-bold`}>
              Next 7 days
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current/20">
            {upcomingEvents.length === 0 ? (
              <p className={`text-xs ${colors.textMuted} text-center py-4`}>
                No upcoming events
              </p>
            ) : (
              upcomingEvents.map(event => (
                <div
                  key={event._id}
                  className={`group relative overflow-hidden rounded-lg border p-2 transition-all duration-300 cursor-pointer ${cardCharacters.neutral.bg} ${cardCharacters.neutral.border} hover:shadow-md`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowSecondary}` }}
                  ></div>

                  <div className="relative">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-xs font-bold ${colors.textPrimary} flex-1 truncate`}>
                        {event.title}
                      </p>
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: event.color }}
                      />
                    </div>

                    {event.startTime && (
                      <div className={`text-[10px] ${colors.textMuted} flex items-center gap-1`}>
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(event.startTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                        <Clock className="w-2.5 h-2.5 ml-1" />
                        {new Date(event.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}