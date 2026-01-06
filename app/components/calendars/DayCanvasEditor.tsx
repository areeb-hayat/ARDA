// ===== app/components/calendars/DayCanvasEditor.tsx =====
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Edit3, Save, FileText, CheckCircle, Circle, X, Tag, Smile } from 'lucide-react';

interface DayCanvasEditorProps {
  userId: string;
  date: Date;
  isPast: boolean;
}

export default function DayCanvasEditor({ userId, date, isPast }: DayCanvasEditorProps) {
  const { colors, cardCharacters, showToast } = useTheme();
  const [canvas, setCanvas] = useState<any>(null);
  const [canvasContent, setCanvasContent] = useState('');
  const [canvasChecklist, setCanvasChecklist] = useState<any[]>([]);
  const [canvasTags, setCanvasTags] = useState<string[]>([]);
  const [canvasMood, setCanvasMood] = useState('');
  const [canvasReflection, setCanvasReflection] = useState('');
  const [isEditingCanvas, setIsEditingCanvas] = useState(false);
  const [savingCanvas, setSavingCanvas] = useState(false);

  const moods = ['energized', 'focused', 'tired', 'stressed', 'balanced', 'creative'];

  useEffect(() => {
    fetchDayCanvas();
  }, [date, userId]);

  const fetchDayCanvas = async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `/api/calendar/day-canvas?userId=${userId}&date=${date.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setCanvas(data.canvas);
        setCanvasContent(data.canvas.content || '');
        setCanvasChecklist(data.canvas.checklist || []);
        setCanvasTags(data.canvas.tags || []);
        setCanvasMood(data.canvas.mood || '');
        setCanvasReflection(data.canvas.reflection || '');
      }
    } catch (error) {
      console.error('Error fetching canvas:', error);
    }
  };

  const saveCanvas = async () => {
    if (!userId) return;

    try {
      setSavingCanvas(true);

      const response = await fetch('/api/calendar/day-canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date: date.toISOString(),
          content: canvasContent,
          checklist: canvasChecklist,
          tags: canvasTags,
          mood: canvasMood,
          reflection: canvasReflection
        })
      });

      if (response.ok) {
        showToast('Day canvas saved successfully', 'success');
        setIsEditingCanvas(false);
        fetchDayCanvas();
      } else {
        showToast('Failed to save canvas', 'error');
      }
    } catch (error) {
      showToast('Failed to save canvas', 'error');
    } finally {
      setSavingCanvas(false);
    }
  };

  const addChecklistItem = () => {
    const newItem = {
      id: Date.now().toString(),
      text: '',
      completed: false,
      createdAt: new Date()
    };
    setCanvasChecklist([...canvasChecklist, newItem]);
  };

  const updateChecklistItem = (id: string, text: string) => {
    setCanvasChecklist(
      canvasChecklist.map(item =>
        item.id === id ? { ...item, text } : item
      )
    );
  };

  const toggleChecklistItem = (id: string) => {
    setCanvasChecklist(
      canvasChecklist.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const removeChecklistItem = (id: string) => {
    setCanvasChecklist(canvasChecklist.filter(item => item.id !== id));
  };

  return (
    <div className={`p-4 rounded-xl border ${colors.modalBorder} ${colors.modalContentBg} backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-black ${colors.modalHeaderText} uppercase flex items-center gap-2`}>
          <FileText className="w-4 h-4" />
          Day Canvas
        </h3>
        
        {isEditingCanvas ? (
          <div className="flex items-center gap-2">
            <button
              onClick={saveCanvas}
              disabled={savingCanvas}
              className={`group relative px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 overflow-hidden border ${cardCharacters.completed.border} ${cardCharacters.completed.bg} ${cardCharacters.completed.text}`}
            >
              <Save className="w-3 h-3 inline mr-1" />
              {savingCanvas ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditingCanvas(false);
                fetchDayCanvas();
              }}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs ${colors.textMuted}`}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditingCanvas(true)}
            className={`group relative px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-300 overflow-hidden border ${cardCharacters.informative.border} ${cardCharacters.informative.bg} ${cardCharacters.informative.text}`}
          >
            <Edit3 className="w-3 h-3 inline mr-1" />
            Edit
          </button>
        )}
      </div>

      {isEditingCanvas ? (
        <div className="space-y-4">
          {/* Notes */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block`}>Notes</label>
            <textarea
              value={canvasContent}
              onChange={(e) => setCanvasContent(e.target.value)}
              placeholder="Write your thoughts, plans, or reflections for this day..."
              className={`w-full h-32 px-3 py-2 rounded-lg text-sm resize-none ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-bold ${colors.textSecondary}`}>Checklist</label>
              <button
                onClick={addChecklistItem}
                className={`text-xs px-2 py-1 rounded ${cardCharacters.informative.bg} ${cardCharacters.informative.text}`}
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-2">
              {canvasChecklist.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleChecklistItem(item.id)}
                    className="flex-shrink-0"
                  >
                    {item.completed ? (
                      <CheckCircle className={`w-4 h-4 ${cardCharacters.completed.iconColor}`} />
                    ) : (
                      <Circle className={`w-4 h-4 ${colors.textMuted}`} />
                    )}
                  </button>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                    placeholder="Checklist item..."
                    className={`flex-1 px-2 py-1 rounded text-xs ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${item.completed ? 'line-through opacity-60' : ''}`}
                  />
                  <button
                    onClick={() => removeChecklistItem(item.id)}
                    className="flex-shrink-0 p-1 hover:bg-red-500/20 rounded"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-2 block flex items-center gap-1`}>
              <Smile className="w-3 h-3" />
              Mood
            </label>
            <div className="flex gap-2 flex-wrap">
              {moods.map(mood => (
                <button
                  key={mood}
                  onClick={() => setCanvasMood(mood)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    canvasMood === mood
                      ? `${cardCharacters.informative.bg} ${cardCharacters.informative.text} border-2 ${cardCharacters.informative.border}`
                      : `${colors.inputBg} ${colors.textMuted} border ${colors.inputBorder}`
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Reflection */}
          {isPast && (
            <div>
              <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block`}>End of Day Reflection</label>
              <textarea
                value={canvasReflection}
                onChange={(e) => setCanvasReflection(e.target.value)}
                placeholder="How did the day go? What did you learn?"
                className={`w-full h-24 px-3 py-2 rounded-lg text-sm resize-none ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className={`text-xs font-bold ${colors.textSecondary} mb-1 block flex items-center gap-1`}>
              <Tag className="w-3 h-3" />
              Tags
            </label>
            <input
              type="text"
              value={canvasTags.join(', ')}
              onChange={(e) => setCanvasTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="Add tags separated by commas..."
              className={`w-full px-3 py-2 rounded-lg text-sm ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Display Notes */}
          {canvasContent && (
            <div className={`p-3 rounded-lg ${colors.cardBg} border ${colors.borderSubtle}`}>
              <p className={`text-sm ${colors.textPrimary} whitespace-pre-wrap`}>
                {canvasContent}
              </p>
            </div>
          )}

          {/* Display Checklist */}
          {canvasChecklist.length > 0 && (
            <div>
              <h4 className={`text-xs font-bold ${colors.textSecondary} mb-2`}>Checklist</h4>
              <div className="space-y-1">
                {canvasChecklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    {item.completed ? (
                      <CheckCircle className={`w-4 h-4 ${cardCharacters.completed.iconColor}`} />
                    ) : (
                      <Circle className={`w-4 h-4 ${colors.textMuted}`} />
                    )}
                    <span className={`text-sm ${item.completed ? 'line-through opacity-60' : ''} ${colors.textPrimary}`}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Display Mood */}
          {canvasMood && (
            <div className="flex items-center gap-2">
              <Smile className={`w-4 h-4 ${colors.textMuted}`} />
              <span className={`text-xs font-bold capitalize px-2 py-1 rounded ${cardCharacters.informative.bg} ${cardCharacters.informative.text}`}>
                {canvasMood}
              </span>
            </div>
          )}

          {/* Display Reflection */}
          {canvasReflection && (
            <div className={`p-3 rounded-lg ${cardCharacters.creative.bg} border ${cardCharacters.creative.border}`}>
              <h4 className={`text-xs font-bold ${cardCharacters.creative.text} mb-1 flex items-center gap-1`}>
                <FileText className="w-3 h-3" />
                Reflection
              </h4>
              <p className={`text-sm ${cardCharacters.creative.text} whitespace-pre-wrap`}>
                {canvasReflection}
              </p>
            </div>
          )}

          {/* Display Tags */}
          {canvasTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className={`w-3 h-3 ${colors.textMuted}`} />
              {canvasTags.map((tag, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-1 rounded ${colors.inputBg} ${colors.textMuted}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!canvasContent && canvasChecklist.length === 0 && !canvasMood && !canvasReflection && canvasTags.length === 0 && (
            <div className="text-center py-8">
              <FileText className={`w-8 h-8 ${colors.textMuted} mx-auto mb-2 opacity-40`} />
              <p className={`text-sm ${colors.textMuted}`}>
                No canvas content yet. Click Edit to start planning this day.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}