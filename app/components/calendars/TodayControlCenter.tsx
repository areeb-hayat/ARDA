// ===== app/components/calendars/TodayControlCenter.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import EventListModal from './EventListModal';
import {
  Sun,
  Moon,
  Clock,
  CheckCircle,
  Circle,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Zap
} from 'lucide-react';

interface TimeIntent {
  _id: string;
  type: string;
  title: string;
  description: string;
  startTime?: Date;
  endTime?: Date;
  isCompleted: boolean;
  priority: string;
  color: string;
  isSystemGenerated: boolean;
}

interface TodayControlCenterProps {
  userId: string;
  userName: string;
  events: TimeIntent[];
  onRefresh: () => void;
}

export default function TodayControlCenter({
  userId,
  userName,
  events,
  onRefresh
}: TodayControlCenterProps) {
  const { colors, cardCharacters, showToast } = useTheme();
  const [canvas, setCanvas] = useState<any>(null);
  const [greeting, setGreeting] = useState('');
  const [dayHealth, setDayHealth] = useState<any>(null);
  const [showModal, setShowModal] = useState<'completed' | 'upcoming' | 'overdue' | null>(null);
  const [expandedIntents, setExpandedIntents] = useState(false);

  useEffect(() => {
    fetchTodayData();
    setGreetingMessage();
  }, [userId]);

  const setGreetingMessage = () => {
    const hour = new Date().getHours();
    const name = userName.split(' ')[0];

    if (hour < 11) {
      setGreeting(`Good morning, ${name}`);
    } else if (hour < 14) {
      setGreeting(`Good afternoon, ${name}`);
    } else {
      setGreeting(`Good evening, ${name}`);
    }
  };

  const fetchTodayData = async () => {
    if (!userId) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const canvasResponse = await fetch(
        `/api/calendar/day-canvas?userId=${userId}&date=${today.toISOString()}`
      );
      if (canvasResponse.ok) {
        const canvasData = await canvasResponse.json();
        setCanvas(canvasData.canvas);
      }

      const healthResponse = await fetch(
        `/api/calendar/day-health?userId=${userId}&date=${today.toISOString()}`
      );
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setDayHealth(healthData.dayHealth);
      }
    } catch (error) {
      console.error('Error fetching today data:', error);
    }
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
      case 'light': return <CheckCircle className="w-5 h-5" />;
      case 'balanced': return <Zap className="w-5 h-5" />;
      case 'heavy': return <TrendingUp className="w-5 h-5" />;
      case 'overloaded': return <AlertTriangle className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getHealthMessage = (status: string) => {
    switch (status) {
      case 'light': return 'Today looks peaceful with light commitments ahead.';
      case 'balanced': return 'A well-balanced day with good mix of work and recovery.';
      case 'heavy': return 'Today is demanding—pace yourself and stay focused.';
      case 'overloaded': return 'Critical day ahead—consider prioritizing or rescheduling.';
      default: return 'Your day awaits.';
    }
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
        onRefresh();
      } else {
        showToast('Failed to update event', 'error');
      }
    } catch (error) {
      showToast('Failed to update event', 'error');
    }
  };

  const deleteEvent = async (eventId: string, isSystemGenerated: boolean) => {
    if (isSystemGenerated) {
      showToast('System-generated events cannot be deleted', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/calendar/events?eventId=${eventId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Event deleted successfully', 'success');
        onRefresh();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete event', 'error');
      }
    } catch (error) {
      showToast('Failed to delete event', 'error');
    }
  };

  const completedEvents = events.filter(e => e.isCompleted);
  const upcomingEvents = events.filter(e => !e.isCompleted && e.startTime && new Date(e.startTime) > new Date());
  const overdueEvents = events.filter(e => !e.isCompleted && e.endTime && new Date(e.endTime) < new Date());

  const healthChar = dayHealth ? getHealthCharacter(dayHealth.healthStatus) : cardCharacters.informative;
  const hour = new Date().getHours();
  const isDaytime = hour >= 6 && hour < 18;

  return (
    <>
      <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${healthChar.bg} ${healthChar.border} ${colors.shadowCard} transition-all duration-300`}>
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
        
        <div className="relative p-5">
          {/* Header with Greeting */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${healthChar.bg} ${healthChar.border} border-2`}>
                {isDaytime ? (
                  <Sun className={`w-6 h-6 ${healthChar.iconColor}`} />
                ) : (
                  <Moon className={`w-6 h-6 ${healthChar.iconColor}`} />
                )}
              </div>
              <div>
                <h2 className={`text-lg font-black ${healthChar.text}`}>{greeting}</h2>
                <p className={`text-xs ${colors.textMuted} mt-0.5`}>
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Day Health Badge */}
            {dayHealth && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${healthChar.bg} ${healthChar.text} border-2 ${healthChar.border}`}>
                {getHealthIcon(dayHealth.healthStatus)}
                <div>
                  <p className="text-xs font-black uppercase">{dayHealth.healthStatus}</p>
                  <p className="text-[10px] opacity-70">{dayHealth.metrics.totalEvents} intents</p>
                </div>
              </div>
            )}
          </div>

          {/* Health Message - Only show if heavy or overloaded */}
          {dayHealth && (dayHealth.healthStatus === 'heavy' || dayHealth.healthStatus === 'overloaded') && (
            <div className={`mb-4 p-3 rounded-lg bg-gradient-to-br ${colors.cardBg} border ${healthChar.border}`}>
              <p className={`text-sm ${healthChar.text} font-medium`}>
                {getHealthMessage(dayHealth.healthStatus)}
              </p>
            </div>
          )}

          {/* Stats Grid - Clickable */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Completed */}
            <button
              onClick={() => setShowModal('completed')}
              className={`group relative overflow-hidden rounded-lg border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.completed.bg} ${cardCharacters.completed.border} p-3 transition-all duration-300 hover:shadow-lg cursor-pointer`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowSuccess}` }}
              ></div>
              <div className="relative">
                <CheckCircle className={`w-5 h-5 ${cardCharacters.completed.iconColor} mb-2 transition-transform duration-300 group-hover:scale-110`} />
                <p className={`text-2xl font-black ${cardCharacters.completed.text}`}>{completedEvents.length}</p>
                <p className={`text-xs ${colors.textMuted} mt-1`}>Completed</p>
              </div>
            </button>

            {/* Upcoming */}
            <button
              onClick={() => setShowModal('upcoming')}
              className={`group relative overflow-hidden rounded-lg border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} p-3 transition-all duration-300 hover:shadow-lg cursor-pointer`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
              ></div>
              <div className="relative">
                <Clock className={`w-5 h-5 ${cardCharacters.informative.iconColor} mb-2 transition-transform duration-300 group-hover:scale-110`} />
                <p className={`text-2xl font-black ${cardCharacters.informative.text}`}>{upcomingEvents.length}</p>
                <p className={`text-xs ${colors.textMuted} mt-1`}>Upcoming</p>
              </div>
            </button>

            {/* Overdue or Total Time */}
            {overdueEvents.length > 0 ? (
              <button
                onClick={() => setShowModal('overdue')}
                className={`group relative overflow-hidden rounded-lg border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.urgent.bg} ${cardCharacters.urgent.border} p-3 transition-all duration-300 hover:shadow-lg cursor-pointer`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowWarning}` }}
                ></div>
                <div className="relative">
                  <AlertTriangle className={`w-5 h-5 ${cardCharacters.urgent.iconColor} mb-2 transition-transform duration-300 group-hover:scale-110`} />
                  <p className={`text-2xl font-black ${cardCharacters.urgent.text}`}>{overdueEvents.length}</p>
                  <p className={`text-xs ${colors.textMuted} mt-1`}>Needs Attention</p>
                </div>
              </button>
            ) : (
              <div className={`relative overflow-hidden rounded-lg border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} p-3`}>
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div className="relative">
                  <Zap className={`w-5 h-5 ${cardCharacters.informative.iconColor} mb-2`} />
                  <p className={`text-2xl font-black ${cardCharacters.informative.text}`}>
                    {dayHealth ? `${dayHealth.metrics.totalHours.toFixed(1)}h` : '0h'}
                  </p>
                  <p className={`text-xs ${colors.textMuted} mt-1`}>Total Time</p>
                </div>
              </div>
            )}
          </div>

          {/* Today's Intents Preview - Expandable */}
          {events.length > 0 && (
            <div className={`p-3 rounded-lg border ${healthChar.border} bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm`}>
              <button
                onClick={() => setExpandedIntents(!expandedIntents)}
                className="w-full flex items-center justify-between mb-2"
              >
                <h3 className={`text-xs font-black ${colors.textSecondary} uppercase`}>Today's Intents</h3>
                <span className={`text-xs ${colors.textMuted}`}>{expandedIntents ? '▲' : '▼'}</span>
              </button>
              
              {expandedIntents && (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current/20">
                  {events.map(event => (
                    <div
                      key={event._id}
                      className={`group flex items-center gap-2 p-2 rounded-lg transition-all ${
                        event.isCompleted 
                          ? `${cardCharacters.completed.bg} ${cardCharacters.completed.text} opacity-60` 
                          : `${cardCharacters.neutral.bg} ${cardCharacters.neutral.text} hover:shadow-md`
                      }`}
                    >
                      <button
                        onClick={() => toggleEventComplete(event._id, event.isCompleted)}
                        className="flex-shrink-0 transition-transform duration-300 hover:scale-125"
                      >
                        {event.isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate ${event.isCompleted ? 'line-through' : ''}`}>
                          {event.title}
                        </p>
                        {event.startTime && (
                          <p className="text-[10px] opacity-70">
                            {new Date(event.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        )}
                      </div>
                      {event.isSystemGenerated && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/10 font-bold">
                          AUTO
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Canvas Quick Preview */}
          {canvas && canvas.content && (
            <div className={`mt-3 p-3 rounded-lg border ${healthChar.border} bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm`}>
              <h3 className={`text-xs font-black ${colors.textSecondary} mb-2 uppercase`}>Today's Notes</h3>
              <p className={`text-xs ${colors.textPrimary} line-clamp-2`}>
                {canvas.content}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event List Modals */}
      {showModal === 'completed' && (
        <EventListModal
          title="Completed Events"
          icon={<CheckCircle className={`w-5 h-5 ${cardCharacters.completed.iconColor}`} />}
          events={completedEvents}
          characterType="completed"
          onClose={() => setShowModal(null)}
          onToggleComplete={toggleEventComplete}
          onDelete={deleteEvent}
        />
      )}

      {showModal === 'upcoming' && (
        <EventListModal
          title="Upcoming Events"
          icon={<Clock className={`w-5 h-5 ${cardCharacters.informative.iconColor}`} />}
          events={upcomingEvents}
          characterType="informative"
          onClose={() => setShowModal(null)}
          onToggleComplete={toggleEventComplete}
          onDelete={deleteEvent}
        />
      )}

      {showModal === 'overdue' && (
        <EventListModal
          title="Events Needing Attention"
          icon={<AlertTriangle className={`w-5 h-5 ${cardCharacters.urgent.iconColor}`} />}
          events={overdueEvents}
          characterType="urgent"
          onClose={() => setShowModal(null)}
          onToggleComplete={toggleEventComplete}
          onDelete={deleteEvent}
        />
      )}
    </>
  );
}