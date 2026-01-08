// app/components/employeeticketlogs/EmployeeTicketModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, TrendingUp, Award, Users, Ticket, FolderKanban, Zap, BarChart3 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { EmployeeTicketModalProps, TicketAnalytics } from './types';
import PrimarySecondarySection from './PrimarySecondarySection';
import AnalyticsLoadingState from './AnalyticsLoadingState';
import AnalyticsErrorState from './AnalyticsErrorState';
import AnalyticsEmptyState from './AnalyticsEmptyState';
import EmployeeProjectsTab from './EmployeeProjectsTab';
import EmployeeSprintsTab from './EmployeeSprintsTab';

type TabType = 'tickets' | 'projects' | 'sprints';

export default function EmployeeTicketModal({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  employeeTitle,
}: EmployeeTicketModalProps) {
  const { colors, cardCharacters, theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('tickets');
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employeeId) {
      if (activeTab === 'tickets') {
        fetchAnalytics();
      }
    }
  }, [isOpen, employeeId, activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/employee-tickets?employeeId=${encodeURIComponent(employeeId)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching ticket analytics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string; icon: typeof Ticket }[] = [
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'sprints', label: 'Sprints', icon: Zap },
  ];

  const infoChar = cardCharacters.informative;
  const authChar = cardCharacters.authoritative;

  return (
    <>
      {/* Modal Overlay */}
      <div
        className={`fixed inset-0 z-50 ${colors.modalOverlay}`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className={`relative w-full max-w-[95vw] h-[90vh] rounded-2xl border-2 ${colors.modalBg} ${colors.modalBorder} ${colors.modalShadow} pointer-events-auto transform transition-all duration-300 flex flex-col overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Paper Texture */}
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
          
          {/* Header - Fixed */}
          <div className={`relative border-b-2 ${colors.modalHeaderBg} ${colors.modalBorder}`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 bg-gradient-to-br ${authChar.bg} ${authChar.border} ${colors.shadowCard}`}>
                    <User className={`h-8 w-8 ${authChar.iconColor}`} />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-black ${colors.modalHeaderText} flex items-center gap-2`}>
                      {employeeName}
                      <BarChart3 className={`h-6 w-6 ${authChar.iconColor}`} />
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className={`h-4 w-4 ${authChar.iconColor}`} />
                      <p className={`text-sm font-semibold ${authChar.accent}`}>
                        {employeeTitle}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className={`group relative p-3 rounded-xl transition-all overflow-hidden border ${colors.borderSubtle} hover:${colors.borderHover}`}
                >
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                  />
                  <X className={`h-5 w-5 ${colors.textPrimary} relative z-10 group-hover:rotate-90 transition-all duration-300`} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 border overflow-hidden ${
                        isActive 
                          ? `bg-gradient-to-r ${colors.buttonPrimary} ${colors.buttonPrimaryText} ${colors.shadowCard} border-transparent` 
                          : `${colors.borderSubtle} ${colors.textSecondary} hover:${colors.borderHover}`
                      }`}
                    >
                      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                      {isActive && (
                        <div 
                          className="absolute inset-0 opacity-100 transition-opacity duration-500"
                          style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}` }}
                        />
                      )}
                      <Icon className={`h-4 w-4 relative z-10 ${isActive ? 'group-hover:rotate-12' : ''} transition-transform duration-300`} />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div 
            className="relative flex-1 overflow-y-auto p-6"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: `${colors.scrollbarThumb} ${colors.scrollbarTrack}`,
            }}
          >
            {activeTab === 'tickets' && (
              <>
                {loading ? (
                  <AnalyticsLoadingState />
                ) : error ? (
                  <AnalyticsErrorState message={error} onRetry={fetchAnalytics} />
                ) : analytics && analytics.totalTickets === 0 ? (
                  <AnalyticsEmptyState employeeName={employeeName} />
                ) : analytics ? (
                  <AnalyticsContent analytics={analytics} />
                ) : null}
              </>
            )}

            {activeTab === 'projects' && (
              <EmployeeProjectsTab employeeId={employeeId} employeeName={employeeName} />
            )}

            {activeTab === 'sprints' && (
              <EmployeeSprintsTab employeeId={employeeId} employeeName={employeeName} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Separate component for analytics content
function AnalyticsContent({ analytics }: { analytics: TicketAnalytics }) {
  const { colors, cardCharacters } = useTheme();
  const completedChar = cardCharacters.completed;
  const infoChar = cardCharacters.informative;
  const authChar = cardCharacters.authoritative;

  return (
    <div className="space-y-6">
      {/* Overall Stats - Horizontal Layout */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Tickets */}
        <div className={`relative p-5 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${authChar.bg} ${authChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${colors.textMuted} mb-1`}>Total Tickets</p>
              <p className={`text-5xl font-black ${authChar.accent}`}>{analytics.totalTickets}</p>
            </div>
            <TrendingUp className={`h-16 w-16 ${authChar.iconColor} opacity-30`} />
          </div>
        </div>

        {/* Primary Tickets */}
        <div className={`relative p-5 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${completedChar.bg} ${completedChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${colors.textMuted} mb-1`}>Primary</p>
              <p className={`text-5xl font-black ${completedChar.accent}`}>{analytics.primaryTickets.total}</p>
            </div>
            <Award className={`h-16 w-16 ${completedChar.iconColor} opacity-30`} />
          </div>
        </div>

        {/* Secondary Tickets */}
        <div className={`relative p-5 rounded-xl border-2 overflow-hidden bg-gradient-to-br ${infoChar.bg} ${infoChar.border}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${colors.textMuted} mb-1`}>Secondary</p>
              <p className={`text-5xl font-black ${infoChar.accent}`}>{analytics.secondaryTickets.total}</p>
            </div>
            <Users className={`h-16 w-16 ${infoChar.iconColor} opacity-30`} />
          </div>
        </div>
      </div>

      {/* Primary and Secondary Sections - Side by Side */}
      <div className="grid grid-cols-2 gap-6">
        <PrimarySecondarySection type="primary" data={analytics.primaryTickets} />
        <PrimarySecondarySection type="secondary" data={analytics.secondaryTickets} />
      </div>
    </div>
  );
}