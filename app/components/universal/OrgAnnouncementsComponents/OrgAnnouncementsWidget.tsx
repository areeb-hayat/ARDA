// app/components/universal/OrgAnnouncementsComponents/OrgAnnouncementsWidget.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Pin, ArrowRight, AlertCircle } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface OrgAnnouncement {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  pinned?: boolean;
  edited?: boolean;
  expirationDate?: string;
  borderColor?: string;
  targetAudience?: string;
}

interface OrgAnnouncementsWidgetProps {
  onAnnouncementClick: () => void;
  userDepartment?: string;
}

export default function OrgAnnouncementsWidget({ 
  onAnnouncementClick,
  userDepartment = ''
}: OrgAnnouncementsWidgetProps) {
  const { theme, colors } = useTheme();
  const [announcements, setAnnouncements] = useState<OrgAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use emerald/teal colors for org announcements (professional, corporate)
  const orgColor = theme === 'dark' ? '#10B981' : '#059669'; // Emerald green
  const orgColorLight = theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)';
  const orgBorder = theme === 'dark' ? 'border-emerald-500/60' : 'border-emerald-600';
  const iconColor = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600';
  const accentColor = theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700';

  // Theme-aware text colors
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondaryColor = theme === 'dark' ? 'text-white/80' : 'text-gray-700';
  const textMutedColor = theme === 'dark' ? 'text-white/60' : 'text-gray-500';

  useEffect(() => {
    console.log('OrgAnnouncementsWidget: userDepartment =', userDepartment);
    fetchAnnouncements();
  }, [userDepartment]);

  const fetchAnnouncements = async () => {
    try {
      const url = `/api/org-announcements?department=${userDepartment}`;
      console.log('OrgAnnouncementsWidget: Fetching from', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('OrgAnnouncementsWidget: Received', data.announcements?.length || 0, 'announcements');
        setAnnouncements(data.announcements || []);
      } else {
        console.error('OrgAnnouncementsWidget: Failed to fetch, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching org announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show only 3 latest announcements
  const latestAnnouncements = announcements
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className={`h-5 w-5 ${iconColor}`} />
            <h3 className={`text-lg font-black ${colors.textPrimary}`}>
              Organization
            </h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className={`w-6 h-6 border-2 ${orgBorder} border-t-transparent rounded-full animate-spin`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className={`h-5 w-5 ${iconColor}`} />
          <h3 className={`text-lg font-black ${colors.textPrimary}`}>
            Organization
          </h3>
        </div>
        {announcements.length > 0 && (
          <button
            onClick={onAnnouncementClick}
            className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 overflow-hidden bg-gradient-to-br ${colors.cardBg} border ${orgBorder} ${colors.borderHover} backdrop-blur-sm ${colors.shadowCard} hover:${colors.shadowHover}`}
          >
            {/* Paper Texture */}
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            
            {/* Internal glow */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ boxShadow: `inset 0 0 14px ${orgColor}80, inset 0 0 28px ${orgColor}40` }}
            ></div>
            
            <span className={`text-xs font-bold relative z-10 ${accentColor}`}>View All</span>
            <ArrowRight className={`h-3.5 w-3.5 relative z-10 transition-transform duration-300 group-hover:translate-x-1 icon-rotate ${iconColor}`} />
          </button>
        )}
      </div>

      {/* Announcements List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {announcements.length === 0 ? (
          <div className="text-center py-8">
            <Globe className={`h-8 w-8 ${colors.textMuted} mx-auto mb-2`} />
            <p className={`${colors.textMuted} text-xs font-semibold`}>No org announcements</p>
          </div>
        ) : (
          latestAnnouncements.map((announcement) => {
            const isDepartmentSpecific = announcement.targetAudience && announcement.targetAudience !== 'organization';
            
            return (
              <button
                key={announcement._id}
                onClick={onAnnouncementClick}
                className={`announcement-card w-full text-left p-3 rounded-lg transition-all duration-300 cursor-pointer border-2 group relative overflow-hidden`}
                style={{
                  backgroundColor: orgColorLight,
                  borderColor: orgColor,
                  ['--glow-color' as any]: orgColor
                }}
              >
                {/* Paper Texture */}
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>

                {/* Internal glow effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 20px ${orgColor}80, inset 0 0 40px ${orgColor}40`
                  }}
                ></div>

                <div className="relative z-10">
                  {/* Title Row */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className={`text-sm font-black ${textColor} line-clamp-1 flex-1`}>
                      {announcement.title}
                    </h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isDepartmentSpecific && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black"
                          style={{
                            backgroundColor: orgColor,
                            color: 'white'
                          }}
                        >
                          <AlertCircle className="h-2.5 w-2.5" />
                          {announcement.targetAudience}
                        </div>
                      )}
                      {announcement.pinned && !isDepartmentSpecific && (
                        <Pin className="h-3 w-3 text-[#FFD700]" fill="#FFD700" />
                      )}
                    </div>
                  </div>

                  {/* Content Preview */}
                  <p className={`text-xs ${textSecondaryColor} line-clamp-2 mb-2 font-medium`}>
                    {truncateText(announcement.content, 80)}
                  </p>

                  {/* Footer */}
                  <div className={`flex items-center justify-between text-[10px] ${textMutedColor}`}>
                    <span className="font-semibold">
                      {new Date(announcement.createdAt).toLocaleDateString()}
                    </span>
                    <span className="font-semibold">
                      By: {announcement.author}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}