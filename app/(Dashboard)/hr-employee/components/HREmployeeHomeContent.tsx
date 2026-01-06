// app/(Dashboard)/employee/components/EmployeeHomeContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Announcement } from '@/app/components/DeptHeadAnnouncements/types';
import AnnouncementsBoardWidget from '@/app/components/DeptHeadAnnouncements/AnnouncementsBoardWidget';
import OrgAnnouncementsWidget from '@/app/components/universal/OrgAnnouncementsComponents/OrgAnnouncementsWidget';
import QuickActionsWidget from './HomeContent/QuickActionsWidget';
import MyTicketsWidget from './HomeContent/MyAssignedTicketsWidget';
import MyTicketsDonut from './HomeContent/MyTicketsDonut';
import MyProjectsSprintsWidget from './HomeContent/MyProjectsSprintsWidget';
import TodaysEventsWidget from './HomeContent/TodaysEventsWidget';
import UpcomingEventsWidget from './HomeContent/UpcomingEventsWidget';
import LoadingState from './HomeContent/LoadingState';
import Styles from './HomeContent/Styles';
import { useTheme } from '@/app/context/ThemeContext';

interface EmployeeHomeContentProps {
  department: string;
  onSectionChange?: (section: string) => void;
}

interface OrgAnnouncement {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  pinned?: boolean;
  edited?: boolean;
}

interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function EmployeeHomeContent({ department, onSectionChange }: EmployeeHomeContentProps) {
  const { colors, showToast, cardCharacters } = useTheme();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [orgAnnouncements, setOrgAnnouncements] = useState<OrgAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('EmployeeHomeContent mounted, onSectionChange:', onSectionChange ? 'defined' : 'undefined');
    fetchAnnouncements();
    fetchOrgAnnouncements();
  }, [department]);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`/api/announcements?department=${encodeURIComponent(department)}`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showToast('Failed to fetch announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgAnnouncements = async () => {
    try {
      const response = await fetch('/api/org-announcements');
      if (response.ok) {
        const data = await response.json();
        setOrgAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching org announcements:', error);
    }
  };

  const handleNavigateToCalendar = () => {
    console.log('Navigate to calendar');
    if (onSectionChange) {
      onSectionChange('calendar');
    } else {
      console.error('onSectionChange is undefined!');
    }
  };

  const handleNavigateToAssignedTickets = () => {
    console.log('Navigate to assigned tickets');
    if (onSectionChange) {
      onSectionChange('assigned-tickets');
    } else {
      console.error('onSectionChange is undefined!');
    }
  };

  const handleNavigateToOrgAnnouncements = () => {
    console.log('Navigate to org announcements section');
    if (onSectionChange) {
      onSectionChange('org-announcements');
    } else {
      console.error('onSectionChange is undefined!');
    }
  };

  const handleNavigateToDeptAnnouncements = () => {
    console.log('Navigate to dept announcements section');
    if (onSectionChange) {
      onSectionChange('announcements');
    } else {
      console.error('onSectionChange is undefined!');
    }
  };

  const handleQuickActionNavigate = (section: string) => {
    console.log('Quick action navigate called with:', section);
    if (onSectionChange) {
      console.log('Calling onSectionChange with:', section);
      onSectionChange(section);
    } else {
      console.error('onSectionChange is undefined!');
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      {/* Dashboard Grid Layout */}
      <div className="space-y-6">
        {/* Top Section - Announcements and Quick Actions/Today's Events */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left Column - Announcements (Reduced Width) */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            {/* Organization Announcements */}
            <div className={`relative overflow-hidden h-[320px] backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl p-4 border-2 ${cardCharacters.authoritative.border} ${colors.shadowCard}`}>
              {/* Paper Texture */}
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative h-full">
                <OrgAnnouncementsWidget
                  announcements={orgAnnouncements}
                  onAnnouncementClick={handleNavigateToOrgAnnouncements}
                />
              </div>
            </div>

            {/* Department Announcements */}
            <div className={`relative overflow-hidden h-[320px] backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl p-4 border-2 ${colors.borderStrong} ${colors.shadowCard}`}>
              {/* Paper Texture */}
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative h-full">
                <AnnouncementsBoardWidget
                  announcements={announcements}
                  onAnnouncementClick={handleNavigateToDeptAnnouncements}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Today's Events */}
          <div className="col-span-12 lg:col-span-8 space-y-5">
            {/* Quick Actions */}
            <div className={`relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl p-5 border-2 ${colors.borderStrong} ${colors.shadowCard}`}>
              {/* Paper Texture */}
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative">
                <QuickActionsWidget onNavigate={handleQuickActionNavigate} />
              </div>
            </div>

            {/* Today's Events & Upcoming Events - Side by Side */}
            <div className="grid grid-cols-2 gap-5">
              {/* Today's Events */}
              <div className={`relative overflow-hidden h-[380px] backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl p-5 border-2 ${colors.borderStrong} ${colors.shadowCard}`}>
                {/* Paper Texture */}
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                
                <div className="relative h-full">
                  <TodaysEventsWidget onViewAll={handleNavigateToCalendar} />
                </div>
              </div>

              {/* Upcoming Events */}
              <div className={`relative overflow-hidden h-[380px] backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl p-5 border-2 ${colors.borderStrong} ${colors.shadowCard}`}>
                {/* Paper Texture */}
                <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
                
                <div className="relative h-full">
                  <UpcomingEventsWidget onViewAll={handleNavigateToCalendar} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - My Tickets (Full Width) & Tickets Donut */}
        <div className="grid grid-cols-12 gap-5">
          {/* My Tickets Widget - Full Width */}
          <div className="col-span-12">
            <div className={`relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl p-5 border-2 ${colors.borderStrong} ${colors.shadowCard}`}>
              {/* Paper Texture */}
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative">
                <MyTicketsWidget onViewAll={handleNavigateToAssignedTickets} />
              </div>
            </div>
          </div>

          {/* Tickets Donut - Left Side */}
          <div className="col-span-12 lg:col-span-5">
            <div className={`relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl p-5 border-2 ${colors.borderStrong} ${colors.shadowCard}`}>
              {/* Paper Texture */}
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative">
                <MyTicketsDonut onClick={handleNavigateToAssignedTickets} />
              </div>
            </div>
          </div>

          {/* My Projects/Sprints Widget - Right Side */}
          <div className="col-span-12 lg:col-span-7">
            <div className={`relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${colors.cardBg} rounded-xl p-5 border-2 ${colors.borderStrong} ${colors.shadowCard}`}>
              {/* Paper Texture */}
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
              
              <div className="relative">
                <MyProjectsSprintsWidget onNavigate={onSectionChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Styles />
    </>
  );
}