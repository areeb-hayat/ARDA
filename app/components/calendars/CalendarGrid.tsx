// ===== app/components/calendars/CalendarGrid.tsx =====
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  CheckCircle,
  Zap,
  TrendingUp,
  AlertTriangle,
  Circle,
  Clock,
  X
} from 'lucide-react';

interface TimeIntent {
  _id: string;
  type: string;
  title: string;
  startTime?: Date;
  endTime?: Date;
  isCompleted: boolean;
  priority: string;
  isSystemGenerated: boolean;
  color: string;
}

interface DayHealth {
  healthStatus: 'light' | 'balanced' | 'heavy' | 'overloaded';
  metrics: {
    totalEvents: number;
    totalHours: number;
  };
}

interface CalendarGridProps {
  currentDate: Date;
  events: TimeIntent[];
  dayHealthData: Map<string, DayHealth>;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

export default function CalendarGrid({
  currentDate,
  events,
  dayHealthData,
  selectedDate,
  onDateSelect
}: CalendarGridProps) {
  const { colors, cardCharacters } = useTheme();

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
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
    return events.filter(event => {
      if (!event.startTime) return false;
      const eventDate = new Date(event.startTime).toDateString();
      return eventDate === date.toDateString();
    });
  };

  const getPriorityWeight = (priority: string) => {
    const weights = { urgent: 4, high: 3, medium: 2, low: 1 };
    return weights[priority as keyof typeof weights] || 0;
  };

  const getTopPriorityEvents = (dayEvents: TimeIntent[]) => {
    return dayEvents
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
      })
      .slice(0, 2);
  };

  const getHealthCharacter = (status: string) => {
    switch (status) {
      case 'heavy': return cardCharacters.creative;
      case 'overloaded': return cardCharacters.urgent;
      case 'light':
      case 'balanced':
      default: return cardCharacters.informative;
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'light': return <CheckCircle className="w-3 h-3" />;
      case 'balanced': return <Zap className="w-3 h-3" />;
      case 'heavy': return <TrendingUp className="w-3 h-3" />;
      case 'overloaded': return <AlertTriangle className="w-3 h-3" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isFuture = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate > today;
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.neutral.bg} ${cardCharacters.neutral.border} ${colors.shadowCard}`}>
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
      
      <div className="relative p-4">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className={`text-center py-2 text-xs font-black ${colors.textSecondary}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days - Fixed Height */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-[128px]" />;
            }

            const dayEvents = getEventsForDate(date);
            const topEvents = getTopPriorityEvents(dayEvents);
            const dayHealth = dayHealthData.get(date.toDateString());
            const healthChar = dayHealth ? getHealthCharacter(dayHealth.healthStatus) : cardCharacters.informative;
            const today = isToday(date);
            const past = isPast(date);
            const future = isFuture(date);
            const selected = isSelected(date);

            const completedEvents = dayEvents.filter(e => e.isCompleted).length;
            const totalEvents = dayEvents.length;
            const showHealthIndicator = dayHealth && (dayHealth.healthStatus === 'heavy' || dayHealth.healthStatus === 'overloaded');

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={`
                  group relative rounded-xl overflow-hidden transition-all duration-300
                  border-2 h-[128px] flex flex-col
                  ${selected ? `${healthChar.border} border-opacity-100 shadow-xl` : `${cardCharacters.neutral.border} border-opacity-20`}
                  ${today ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''}
                  ${past ? 'opacity-50' : future ? 'opacity-85' : 'opacity-100'}
                  hover:shadow-xl hover:scale-[1.02]
                  bg-gradient-to-br ${healthChar.bg}
                `}
                style={today ? { ringColor: healthChar.iconColor.replace('text-', '') } : {}}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                
                {/* Hover Glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                ></div>

                {/* Past Day Overlay with X */}
                {past && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <X className={`w-16 h-16 ${colors.textMuted} opacity-10`} strokeWidth={1} />
                  </div>
                )}

                <div className="relative h-full p-2 flex flex-col justify-between z-20">
                  {/* Date Header */}
                  <div className="flex items-start justify-between mb-1 flex-shrink-0">
                    <span className={`
                      font-black transition-all duration-300
                      ${today ? 'text-base scale-110' : 'text-sm'}
                      ${past ? `${colors.textMuted}` : healthChar.text}
                    `}>
                      {date.getDate()}
                    </span>
                    
                    {showHealthIndicator && (
                      <div className={`${healthChar.iconColor} transition-transform duration-300 group-hover:scale-125`}>
                        {getHealthIcon(dayHealth.healthStatus)}
                      </div>
                    )}
                  </div>

                  {/* Top 2 Priority Events */}
                  {topEvents.length > 0 && (
                    <div className="space-y-1 flex-1 overflow-hidden min-h-0">
                      {topEvents.map((event, i) => (
                        <div
                          key={event._id || i}
                          className={`
                            text-left px-1.5 py-1 rounded text-[10px] font-bold truncate
                            transition-all duration-200
                            ${event.isCompleted 
                              ? `${cardCharacters.completed.bg} ${cardCharacters.completed.text} opacity-60 line-through` 
                              : `bg-white/10 backdrop-blur-sm ${past ? colors.textMuted : healthChar.text}`
                            }
                          `}
                          style={{
                            borderLeft: `2px solid ${event.color || '#2196F3'}`
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {event.startTime && (
                              <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                            )}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      
                      {totalEvents > 2 && (
                        <div className={`text-[9px] font-bold ${past ? colors.textMuted : healthChar.text} opacity-70 px-1.5`}>
                          +{totalEvents - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer with completion status */}
                  {totalEvents > 0 && (
                    <div className="mt-1 pt-1 border-t border-current/10 flex-shrink-0">
                      <div className={`flex items-center justify-between text-[9px] font-bold ${past ? colors.textMuted : healthChar.text}`}>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          <span>{completedEvents}/{totalEvents}</span>
                        </div>
                        {dayHealth && (
                          <span className="opacity-70">
                            {dayHealth.metrics.totalHours.toFixed(1)}h
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Today Badge */}
                  {today && (
                    <div className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse`}
                         style={{ backgroundColor: healthChar.iconColor.replace('text-', '') }}
                    />
                  )}

                  {/* Future Day Indicator */}
                  {future && totalEvents === 0 && (
                    <div className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full ${healthChar.iconColor} opacity-40`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}