// app/(Dashboard)/employee/components/HomeContent/MiniCalendarWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme, useCardCharacter } from '@/app/context/ThemeContext';

interface TimeIntent {
  _id: string;
  userId: string;
  type: 'task' | 'deadline' | 'meeting' | 'reminder';
  title: string;
  startTime?: string;
  endTime?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  color?: string;
}

interface MiniCalendarWidgetProps {
  userId?: string | null;
}

export default function MiniCalendarWidget({ userId }: MiniCalendarWidgetProps) {
  const { colors } = useTheme();
  const informativeChar = useCardCharacter('informative');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<TimeIntent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchEvents = async () => {
    if (!userId) {
      console.log('❌ MiniCalendar: No user ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('📅 MiniCalendar: Fetching events for userId:', userId);

      const response = await fetch(`/api/calendar/events?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ MiniCalendar: Fetched events:', data.events?.length || 0);
        setEvents(data.events || []);
      } else {
        console.error('❌ MiniCalendar: Failed to fetch events:', response.status);
      }
    } catch (error) {
      console.error('💥 MiniCalendar: Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const miniCalendarDays = getMiniCalendarDays();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className={`w-6 h-6 border-2 ${colors.textAccent} border-t-transparent rounded-full animate-spin`}></div>
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

  return (
    <div className="h-full flex flex-col">
      {/* Header with Centered Month Navigation */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <button
          onClick={handlePrevMonth}
          className={`p-1 rounded-md transition-colors ${colors.textMuted} hover:${colors.textPrimary} hover:bg-opacity-10 hover:${colors.cardBg}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-2">
          <Calendar className={`w-4 h-4 ${informativeChar.iconColor}`} />
          <h3 className={`${colors.textPrimary} text-sm font-black uppercase`}>
            {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </h3>
        </div>

        <button
          onClick={handleNextMonth}
          className={`p-1 rounded-md transition-colors ${colors.textMuted} hover:${colors.textPrimary} hover:bg-opacity-10 hover:${colors.cardBg}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mini Calendar Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((day, i) => (
            <div key={i} className={`text-center text-[10px] font-bold ${colors.textMuted}`}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days - Fixed with proper aspect ratio */}
        <div className="grid grid-cols-7 gap-1 auto-rows-fr">
          {miniCalendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="w-full" style={{ paddingBottom: '100%', position: 'relative' }} />;
            }

            const dayEvents = getEventsForDate(date);
            const today = isToday(date);

            return (
              <div
                key={date.toISOString()}
                className="w-full relative"
                style={{ paddingBottom: '100%' }}
              >
                <button
                  className={`
                    absolute inset-0 group rounded-lg text-[11px] font-bold transition-all duration-200
                    ${today 
                      ? `${informativeChar.bg} ${informativeChar.text} ring-1 ${informativeChar.border}` 
                      : `${colors.cardBg} ${colors.textPrimary} hover:bg-opacity-80`
                    }
                  `}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    {date.getDate()}
                  </div>
                  
                  {/* Event dots */}
                  {dayEvents.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className={`mt-2 pt-2 border-t ${colors.border}`}>
        <div className="flex items-center justify-between text-xs">
          <span className={`${colors.textMuted} font-semibold`}>This Month</span>
          <span className={`${colors.textPrimary} font-bold`}>
            {events.filter(e => {
              if (!e.startTime) return false;
              const eventDate = new Date(e.startTime);
              return eventDate.getMonth() === currentDate.getMonth() &&
                     eventDate.getFullYear() === currentDate.getFullYear();
            }).length} events
          </span>
        </div>
      </div>
    </div>
  );
}