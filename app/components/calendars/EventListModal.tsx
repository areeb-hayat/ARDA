// ===== app/components/calendars/EventListModal.tsx =====
'use client';

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { X, CheckCircle, Circle, Clock, Trash2 } from 'lucide-react';

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

interface EventListModalProps {
  title: string;
  icon: React.ReactNode;
  events: TimeIntent[];
  characterType: 'completed' | 'informative' | 'urgent';
  onClose: () => void;
  onToggleComplete: (eventId: string, currentStatus: boolean) => void;
  onDelete: (eventId: string, isSystemGenerated: boolean) => void;
}

export default function EventListModal({
  title,
  icon,
  events,
  characterType,
  onClose,
  onToggleComplete,
  onDelete
}: EventListModalProps) {
  const { colors, cardCharacters } = useTheme();
  const char = cardCharacters[characterType];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl border backdrop-blur-lg ${colors.modalBg} ${colors.modalBorder} ${colors.modalShadow} animate-modalSlideIn`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

        {/* Header */}
        <div className={`relative border-b ${colors.modalBorder} bg-gradient-to-r ${char.bg} p-5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border-2 ${char.border} bg-gradient-to-r ${char.bg}`}>
                {icon}
              </div>
              <div>
                <h2 className={`text-xl font-black ${char.text}`}>{title}</h2>
                <p className={`text-xs ${colors.textMuted} mt-0.5`}>{events.length} {events.length === 1 ? 'event' : 'events'}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`group relative p-2 rounded-lg transition-all duration-300 overflow-hidden border ${char.border} bg-gradient-to-r ${char.bg}`}
            >
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
              ></div>
              <X className={`w-5 h-5 relative z-10 ${char.iconColor} transition-transform duration-300 group-hover:rotate-90`} />
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="relative overflow-y-auto max-h-[calc(85vh-100px)] p-5 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current/20">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-r ${char.bg} border-2 ${char.border}`}>
                {icon}
              </div>
              <p className={`text-sm ${colors.textMuted}`}>No events in this category</p>
            </div>
          ) : (
            events.map(event => (
              <div
                key={event._id}
                className={`group relative overflow-hidden rounded-lg border transition-all duration-300 p-3 ${
                  event.isCompleted
                    ? `${cardCharacters.completed.bg} ${cardCharacters.completed.border} opacity-60`
                    : `${cardCharacters.neutral.bg} ${cardCharacters.neutral.border} hover:shadow-lg`
                }`}
              >
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
                ></div>
                
                <div className="relative flex items-start gap-3">
                  <button
                    onClick={() => onToggleComplete(event._id, event.isCompleted)}
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
                          onClick={() => onDelete(event._id, event.isSystemGenerated)}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-500/20`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {event.startTime && (
                        <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${cardCharacters.neutral.bg} ${cardCharacters.neutral.text}`}>
                          <Clock className="w-3 h-3" />
                          {new Date(event.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric', minute: '2-digit', hour12: true
                          })}
                          {event.endTime && ` - ${new Date(event.endTime).toLocaleTimeString('en-US', {
                            hour: 'numeric', minute: '2-digit', hour12: true
                          })}`}
                        </span>
                      )}
                      
                      <span 
                        className={`text-xs px-2 py-0.5 rounded font-bold capitalize border-l-2`}
                        style={{ borderLeftColor: event.color }}
                      >
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}