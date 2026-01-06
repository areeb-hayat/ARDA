// ===== app/components/calendars/DayDetailPanel.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { X, CheckCircle, Circle, Clock, FileText, Trash2 } from 'lucide-react';
import DayCanvasEditor from './DayCanvasEditor';

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

interface DayHealth {
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

interface DayDetailPanelProps {
  date: Date;
  userId: string;
  userName: string;
  events: TimeIntent[];
  dayHealth?: DayHealth;
  onClose: () => void;
  onUpdate: () => void;
  onCreateIntent: (date: Date) => void;
}

export default function DayDetailPanel({
  date,
  userId,
  events,
  dayHealth,
  onClose,
  onUpdate,
  onCreateIntent
}: DayDetailPanelProps) {
  const { colors, cardCharacters, showToast } = useTheme();

  const isToday = date.toDateString() === new Date().toDateString();
  const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
  const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));

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
        onUpdate();
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
        onUpdate();
      } else {
        const data = await response.json();
        showToast(data.error || 'Failed to delete event', 'error');
      }
    } catch (error) {
      showToast('Failed to delete event', 'error');
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

  const healthChar = dayHealth ? getHealthCharacter(dayHealth.healthStatus) : cardCharacters.neutral;
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.startTime || !b.startTime) return 0;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={`relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-xl border backdrop-blur-lg ${colors.modalBg} ${colors.modalBorder} ${colors.modalShadow}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

        {/* Header */}
        <div className={`relative border-b ${colors.modalBorder} ${colors.modalHeaderBg} p-5`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className={`text-2xl font-black ${colors.modalHeaderText} mb-1`}>
                {date.toLocaleDateString('en-US', { 
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
              </h2>
              <div className="flex items-center gap-3 mt-2">
                {isToday && (
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${cardCharacters.informative.bg} ${cardCharacters.informative.text}`}>
                    TODAY
                  </span>
                )}
                {isPast && <span className={`px-3 py-1 rounded-lg text-xs font-bold ${colors.textMuted}`}>PAST</span>}
                {isFuture && (
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${cardCharacters.creative.bg} ${cardCharacters.creative.text}`}>
                    UPCOMING
                  </span>
                )}
                {dayHealth && (
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${healthChar.bg} ${healthChar.text} border ${healthChar.border}`}>
                    {dayHealth.healthStatus.toUpperCase()} DAY
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onCreateIntent(date)}
                className={`group relative px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 overflow-hidden border ${cardCharacters.creative.border} ${cardCharacters.creative.bg} ${cardCharacters.creative.text}`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 14px ${colors.glowSecondary}, inset 0 0 28px ${colors.glowSecondary}` }}
                ></div>
                <span className="relative z-10">+ Create Intent</span>
              </button>

              <button
                onClick={onClose}
                className={`group relative p-2 rounded-lg transition-all duration-300 overflow-hidden border ${healthChar.border} ${healthChar.bg}`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                ></div>
                <X className={`w-5 h-5 relative z-10 ${healthChar.iconColor} transition-transform duration-300 group-hover:rotate-90`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="relative overflow-y-auto max-h-[calc(95vh-140px)] p-5 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current/20">
          
          {/* Day Health Metrics */}
          {dayHealth && (
            <div className={`p-4 rounded-xl border ${healthChar.border} bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm`}>
              <h3 className={`text-sm font-black ${colors.textSecondary} mb-3 uppercase`}>Day Health Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className={`text-xs ${colors.textMuted}`}>Total Events</p>
                  <p className={`text-lg font-black ${healthChar.text}`}>{dayHealth.metrics.totalEvents}</p>
                </div>
                <div>
                  <p className={`text-xs ${colors.textMuted}`}>Total Hours</p>
                  <p className={`text-lg font-black ${healthChar.text}`}>{dayHealth.metrics.totalHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className={`text-xs ${colors.textMuted}`}>Meeting Hours</p>
                  <p className={`text-lg font-black ${healthChar.text}`}>{dayHealth.metrics.meetingHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className={`text-xs ${colors.textMuted}`}>Deadlines</p>
                  <p className={`text-lg font-black ${healthChar.text}`}>{dayHealth.metrics.deadlineCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Time Intents */}
          <div className={`p-4 rounded-xl border ${healthChar.border} bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm`}>
            <h3 className={`text-sm font-black ${colors.textSecondary} mb-3 uppercase flex items-center gap-2`}>
              <Clock className="w-4 h-4" />
              Time Intents ({events.length})
            </h3>
            
            {sortedEvents.length === 0 ? (
              <p className={`text-sm ${colors.textMuted} text-center py-8`}>
                No intents scheduled for this day
              </p>
            ) : (
              <div className="space-y-2">
                {sortedEvents.map(event => (
                  <div
                    key={event._id}
                    className={`group relative overflow-hidden rounded-lg border transition-all duration-300 p-3 ${
                      event.isCompleted
                        ? `${cardCharacters.completed.bg} ${cardCharacters.completed.border} opacity-60`
                        : `${cardCharacters.neutral.bg} ${cardCharacters.neutral.border}`
                    }`}
                  >
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    
                    <div className="relative flex items-start gap-3">
                      <button
                        onClick={() => toggleEventComplete(event._id, event.isCompleted)}
                        className="flex-shrink-0 mt-0.5 transition-transform duration-300 hover:scale-125"
                      >
                        {event.isCompleted ? (
                          <CheckCircle className={`w-5 h-5 ${cardCharacters.completed.iconColor}`} />
                        ) : (
                          <Circle className={`w-5 h-5 ${colors.textMuted}`} />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className={`text-sm font-bold ${event.isCompleted ? 'line-through' : ''} ${colors.textPrimary}`}>
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className={`text-xs ${colors.textMuted} mt-1 line-clamp-2`}>
                                {event.description}
                              </p>
                            )}
                          </div>

                          {!event.isSystemGenerated && (
                            <button
                              onClick={() => deleteEvent(event._id, event.isSystemGenerated)}
                              className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-500/20`}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {event.startTime && (
                            <span className={`text-xs px-2 py-0.5 rounded ${colors.textMuted}`}>
                              {new Date(event.startTime).toLocaleTimeString('en-US', {
                                hour: 'numeric', minute: '2-digit', hour12: true
                              })}
                              {event.endTime && ` - ${new Date(event.endTime).toLocaleTimeString('en-US', {
                                hour: 'numeric', minute: '2-digit', hour12: true
                              })}`}
                            </span>
                          )}
                          
                          <span className={`text-xs px-2 py-0.5 rounded font-bold capitalize ${
                            event.priority === 'urgent' ? `${cardCharacters.urgent.bg} ${cardCharacters.urgent.text}` :
                            event.priority === 'high' ? `${cardCharacters.creative.bg} ${cardCharacters.creative.text}` :
                            `${cardCharacters.neutral.bg} ${cardCharacters.neutral.text}`
                          }`}>
                            {event.priority}
                          </span>

                          <span className={`text-xs px-2 py-0.5 rounded font-bold capitalize ${cardCharacters.neutral.bg} ${cardCharacters.neutral.text}`}>
                            {event.type.replace('-', ' ')}
                          </span>

                          {event.isSystemGenerated && (
                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${colors.textMuted} bg-black/10`}>
                              AUTO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Day Canvas Editor */}
          <DayCanvasEditor userId={userId} date={date} isPast={isPast} />
        </div>
      </div>
    </div>
  );
}