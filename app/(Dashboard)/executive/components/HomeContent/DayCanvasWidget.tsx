// app/(Dashboard)/employee/components/HomeContent/DayCanvasWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, CheckSquare, Image as ImageIcon, Tag, Heart, Sparkles, Plus, X, Check, Edit2, Save } from 'lucide-react';
import { useTheme, useCardCharacter } from '@/app/context/ThemeContext';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface DayCanvas {
  _id: string;
  userId: string;
  date: string;
  content?: string;
  checklist?: ChecklistItem[];
  images?: Array<{
    url: string;
    caption?: string;
    uploadedAt: Date;
  }>;
  tags?: string[];
  mood?: 'energized' | 'focused' | 'tired' | 'stressed' | 'balanced' | 'creative';
  reflection?: string;
}

interface DayCanvasWidgetProps {
  userId?: string | null;
  onViewAll?: () => void;
}

export default function DayCanvasWidget({ userId, onViewAll }: DayCanvasWidgetProps) {
  const { colors, theme, showToast } = useTheme();
  const informativeChar = useCardCharacter('informative');
  const [dayCanvas, setDayCanvas] = useState<DayCanvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchDayCanvas();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchDayCanvas = async () => {
    if (!userId) {
      console.log('❌ DayCanvas: No user ID provided');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 DayCanvas: Fetching day canvas for userId:', userId);

      // FIX: Get today's date in YYYY-MM-DD format instead of full ISO string
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // e.g., "2026-01-14"

      const response = await fetch(`/api/calendar/day-canvas?userId=${userId}&date=${dateStr}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ DayCanvas: Fetched day canvas:', data.canvas);
        setDayCanvas(data.canvas);
        setNotesText(data.canvas?.content || '');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ DayCanvas: Failed to fetch:', response.status, errorData);
        showToast?.('Failed to load day canvas', 'error');
      }
    } catch (error) {
      console.error('💥 DayCanvas: Error fetching day canvas:', error);
      showToast?.('Error loading day canvas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateDayCanvas = async (updates: Partial<DayCanvas>) => {
    if (!userId) return false;

    try {
      // FIX: Use YYYY-MM-DD format for consistency
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      const response = await fetch('/api/calendar/day-canvas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          date: dateStr,
          ...updates
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDayCanvas(data.canvas);
        return true;
      } else {
        console.error('Failed to update day canvas');
        return false;
      }
    } catch (error) {
      console.error('Error updating day canvas:', error);
      return false;
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!dayCanvas || !dayCanvas.checklist) return;

    const updatedChecklist = dayCanvas.checklist.map(item =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );

    // Optimistic update
    setDayCanvas({ ...dayCanvas, checklist: updatedChecklist });

    const success = await updateDayCanvas({ checklist: updatedChecklist });
    
    if (!success) {
      // Revert on failure
      setDayCanvas(dayCanvas);
      showToast?.('Failed to update task', 'error');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim()) return;

    setSavingTask(true);

    const newTask: ChecklistItem = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date()
    };

    const updatedChecklist = [...(dayCanvas?.checklist || []), newTask];

    const success = await updateDayCanvas({ checklist: updatedChecklist });

    if (success) {
      setNewTaskText('');
      setIsAddingTask(false);
      showToast?.('Task added successfully', 'success');
    } else {
      showToast?.('Failed to add task', 'error');
    }

    setSavingTask(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!dayCanvas || !dayCanvas.checklist) return;

    const updatedChecklist = dayCanvas.checklist.filter(item => item.id !== taskId);

    // Optimistic update
    const previousCanvas = dayCanvas;
    setDayCanvas({ ...dayCanvas, checklist: updatedChecklist });

    const success = await updateDayCanvas({ checklist: updatedChecklist });
    
    if (!success) {
      // Revert on failure
      setDayCanvas(previousCanvas);
      showToast?.('Failed to delete task', 'error');
    } else {
      showToast?.('Task deleted', 'success');
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);

    const success = await updateDayCanvas({ content: notesText });

    if (success) {
      setIsEditingNotes(false);
      showToast?.('Notes saved successfully', 'success');
    } else {
      showToast?.('Failed to save notes', 'error');
    }

    setSavingNotes(false);
  };

  const handleCancelNotesEdit = () => {
    setNotesText(dayCanvas?.content || '');
    setIsEditingNotes(false);
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'energized':
        return '⚡';
      case 'focused':
        return '🎯';
      case 'tired':
        return '😴';
      case 'stressed':
        return '😰';
      case 'balanced':
        return '⚖️';
      case 'creative':
        return '🎨';
      default:
        return '😊';
    }
  };

  const getMoodColor = (mood?: string) => {
    if (theme === 'dark') {
      switch (mood) {
        case 'energized':
          return 'bg-yellow-500/20 text-yellow-400';
        case 'focused':
          return 'bg-blue-500/20 text-blue-400';
        case 'tired':
          return 'bg-purple-500/20 text-purple-400';
        case 'stressed':
          return 'bg-red-500/20 text-red-400';
        case 'balanced':
          return 'bg-green-500/20 text-green-400';
        case 'creative':
          return 'bg-pink-500/20 text-pink-400';
        default:
          return 'bg-gray-500/20 text-gray-400';
      }
    } else {
      switch (mood) {
        case 'energized':
          return 'bg-yellow-500/10 text-yellow-600';
        case 'focused':
          return 'bg-blue-500/10 text-blue-600';
        case 'tired':
          return 'bg-purple-500/10 text-purple-600';
        case 'stressed':
          return 'bg-red-500/10 text-red-600';
        case 'balanced':
          return 'bg-green-500/10 text-green-600';
        case 'creative':
          return 'bg-pink-500/10 text-pink-600';
        default:
          return 'bg-gray-500/10 text-gray-600';
      }
    }
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

  const completedTasks = dayCanvas?.checklist?.filter(item => item.completed).length || 0;
  const totalTasks = dayCanvas?.checklist?.length || 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className={`w-4 h-4 ${informativeChar.iconColor}`} />
          <h3 className={`${colors.textPrimary} text-sm font-black uppercase`}>Today's Canvas</h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current/20">
        {!dayCanvas ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6">
            <Sparkles className={`w-10 h-10 ${colors.textMuted} mx-auto opacity-40 mb-2`} />
            <p className={`${colors.textSecondary} text-sm font-semibold`}>No canvas for today</p>
            <p className={`${colors.textMuted} text-xs mt-1`}>Start journaling your day!</p>
          </div>
        ) : (
          <>
            {/* Mood */}
            {dayCanvas.mood && (
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMoodIcon(dayCanvas.mood)}</span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-bold capitalize ${getMoodColor(dayCanvas.mood)}`}>
                  {dayCanvas.mood}
                </span>
              </div>
            )}

            {/* Checklist Section */}
            <div className={`p-3 rounded-lg ${colors.cardBg} border ${colors.border}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckSquare className={`w-4 h-4 ${colors.textAccent}`} />
                  <span className={`text-xs font-bold ${colors.textPrimary}`}>Tasks</span>
                </div>
                <span className={`text-xs font-bold ${colors.textAccent}`}>
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              
              {/* Progress Bar */}
              {totalTasks > 0 && (
                <div className={`w-full h-2 rounded-full overflow-hidden mb-3 ${colors.border}`}>
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                  />
                </div>
              )}

              {/* Task List */}
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-current/20">
                {dayCanvas.checklist?.map((item) => (
                  <div key={item.id} className="group flex items-center gap-2 hover:bg-opacity-50 rounded p-1 transition-all">
                    <button
                      onClick={() => handleToggleTask(item.id)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                        item.completed 
                          ? 'bg-green-500/20 border-green-500' 
                          : `${colors.border} hover:border-green-500`
                      }`}
                    >
                      {item.completed && <Check className="w-3 h-3 text-green-500" />}
                    </button>
                    <span className={`text-xs flex-1 truncate transition-all ${
                      item.completed 
                        ? `${colors.textMuted} line-through` 
                        : colors.textSecondary
                    }`}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(item.id)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity ${colors.textMuted} hover:text-red-500`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add Task Form */}
                {isAddingTask ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-opacity-20">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask();
                        if (e.key === 'Escape') {
                          setIsAddingTask(false);
                          setNewTaskText('');
                        }
                      }}
                      placeholder="Enter task..."
                      autoFocus
                      disabled={savingTask}
                      className={`flex-1 px-2 py-1 text-xs rounded ${colors.cardBg} border ${colors.border} ${colors.textPrimary} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                    <button
                      onClick={handleAddTask}
                      disabled={savingTask || !newTaskText.trim()}
                      className={`p-1 rounded ${colors.textAccent} hover:bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {savingTask ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingTask(false);
                        setNewTaskText('');
                      }}
                      disabled={savingTask}
                      className={`p-1 rounded ${colors.textMuted} hover:bg-opacity-20 disabled:opacity-50`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className={`w-full mt-2 pt-2 border-t border-opacity-20 flex items-center justify-center gap-1.5 text-xs font-semibold ${colors.textAccent} hover:underline transition-all`}
                  >
                    <Plus className="w-3 h-3" />
                    Add Task
                  </button>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className={`p-3 rounded-lg ${colors.cardBg} border ${colors.border}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className={`w-4 h-4 ${colors.textAccent}`} />
                  <span className={`text-xs font-bold ${colors.textPrimary}`}>Notes</span>
                </div>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className={`p-1 rounded ${colors.textMuted} hover:${colors.textAccent} transition-colors`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Write your notes here..."
                    rows={4}
                    disabled={savingNotes}
                    className={`w-full px-2 py-1.5 text-xs rounded ${colors.cardBg} border ${colors.border} ${colors.textPrimary} focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none`}
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCancelNotesEdit}
                      disabled={savingNotes}
                      className={`px-2 py-1 text-xs font-semibold rounded ${colors.textMuted} hover:bg-opacity-20 disabled:opacity-50`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className={`px-2 py-1 text-xs font-semibold rounded ${colors.textAccent} hover:bg-opacity-20 disabled:opacity-50 flex items-center gap-1`}
                    >
                      {savingNotes ? (
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`text-xs ${dayCanvas.content ? colors.textSecondary : colors.textMuted} ${!dayCanvas.content && 'italic'} line-clamp-3`}>
                  {dayCanvas.content || 'No notes yet. Click edit to add notes.'}
                </p>
              )}
            </div>

            {/* Tags */}
            {dayCanvas.tags && dayCanvas.tags.length > 0 && (
              <div className={`p-3 rounded-lg ${colors.cardBg} border ${colors.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className={`w-4 h-4 ${colors.textAccent}`} />
                  <span className={`text-xs font-bold ${colors.textPrimary}`}>Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dayCanvas.tags.slice(0, 4).map((tag, index) => (
                    <span 
                      key={index}
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold ${colors.textMuted} bg-opacity-10 ${colors.cardBg} border ${colors.border}`}
                    >
                      #{tag}
                    </span>
                  ))}
                  {dayCanvas.tags.length > 4 && (
                    <span className={`px-2 py-0.5 text-xs ${colors.textMuted}`}>
                      +{dayCanvas.tags.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Images */}
            {dayCanvas.images && dayCanvas.images.length > 0 && (
              <div className={`p-3 rounded-lg ${colors.cardBg} border ${colors.border}`}>
                <div className="flex items-center gap-2">
                  <ImageIcon className={`w-4 h-4 ${colors.textAccent}`} />
                  <span className={`text-xs font-bold ${colors.textPrimary}`}>
                    {dayCanvas.images.length} Image{dayCanvas.images.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Reflection Preview */}
            {dayCanvas.reflection && (
              <div className={`p-3 rounded-lg ${colors.cardBg} border ${colors.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className={`w-4 h-4 ${colors.textAccent}`} />
                  <span className={`text-xs font-bold ${colors.textPrimary}`}>Reflection</span>
                </div>
                <p className={`text-xs ${colors.textSecondary} line-clamp-2 italic`}>
                  {dayCanvas.reflection}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}