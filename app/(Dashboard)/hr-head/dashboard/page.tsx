// app/(Dashboard)/hr-head/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import HRHeadSidebar from '../components/HRHeadSidebar';
import HRHeadHeader from '../components/HRHeadHeader';
import HRHeadHomeContent from '../components/HRHeadHomeContent';
import HRHeadTeamContent from '../components/HRHeadTeamContent';
import CalendarView from '../components/CalendarView';
import AppointmentView from '../components/AppointmentView';
import DownloadLogs from '../components/DownloadLogs';
import PoliciesContent from '@/app/components/universal/PoliciesContent';
import ManageUsersContent from '../components/HRManageUsersContent';
import OrgInfoContent from '@/app/components/universal/OrgInfoContent';
import WorkflowsContent from '@/app/components/universal/WorkflowsContent';
import SettingsContent from '@/app/components/universal/SettingsContent';
import TicketingContent from '@/app/components/ticketing/TicketingContent';
import AssignedTicketsContent from '@/app/components/ticketing/AssignedTicketsContent';
import AnnouncementsPage from '@/app/components/DeptHeadAnnouncements/AnnouncementsPage';
import OrgAnnouncementsPage from '@/app/components/universal/OrgAnnouncementsPage';

interface UserData {
  username: string;
  role: 'employee.other' | 'employee.hr' | 'depthead.hr' | 'depthead.other' | 'admin';
  displayName: string;
  department: string;
  title: string;
  isDeptHead: boolean;
  photoUrl?: string;
  email?: string;
  phone?: string;
  employeeNumber?: string;
}

export default function HRHeadDashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState<UserData | null>(null);
  const [manageUsersFilter, setManageUsersFilter] = useState<string | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      
      console.log('HR Head Dashboard - User data:', {
        username: parsedUser.username,
        role: parsedUser.role,
        department: parsedUser.department,
        isDeptHead: parsedUser.isDeptHead
      });
      
      // Verify user is HR head using the role field
      if (parsedUser.role !== 'depthead.hr' && parsedUser.role !== 'admin') {
        console.log('Access denied - redirecting. Role:', parsedUser.role);
        
        // Redirect based on their actual role
        if (parsedUser.role === 'depthead.other') {
          router.push('/dept-head/dashboard');
        } else if (parsedUser.role === 'employee.hr') {
          router.push('/hr-employee/dashboard');
        } else {
          router.push('/employee/dashboard');
        }
        return;
      }
      
      console.log('Access granted to HR Head dashboard');
      setUser(parsedUser);
    } else {
      console.log('No user data - redirecting to login');
      router.push('/auth/login');
    }
  }, [router]);

  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.background} flex items-center justify-center relative overflow-hidden`}>
        <div className="relative text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#0000FF] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`${colors.textPrimary} text-lg font-black`}>Loading HR Dashboard...</p>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#0000FF] rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-[#6495ED] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-[#FF0000] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <HRHeadHomeContent department={user.department} onSectionChange={setActiveSection} />;
      
      case 'tickets':
        return <TicketingContent />;
      
      case 'assigned-tickets':
        return <AssignedTicketsContent />;
      
      case 'team':
        return <HRHeadTeamContent department={user.department} />;
      
      case 'calendar':
        return <CalendarView />;
      
      case 'appointments':
        return <AppointmentView />;
      
      case 'announcements':
        return (
          <AnnouncementsPage 
            department={user.department} 
            userDisplayName={user.displayName} 
            isDeptHead={user.isDeptHead}
            onBack={() => setActiveSection('home')}
          />
        );
      
      case 'org-announcements':
        return <OrgAnnouncementsPage onBack={() => setActiveSection('home')} isHREmployee={true} userDepartment={'HR'}/>;
      
      case 'manage-users':
        return <ManageUsersContent initialFilter={manageUsersFilter} />;
      
      case 'policies':
        return <PoliciesContent />;
      
      case 'org-info':
        return <OrgInfoContent />;
      
      case 'workflows':
        return <WorkflowsContent />;
      
      case 'download-logs':
        return <DownloadLogs />;
      
      case 'settings':
        return <SettingsContent />;
      
      default:
        return <HRHeadHomeContent department={user.department} />;
    }
  };

  return (
    <div className={`flex h-screen bg-gradient-to-br ${colors.background} overflow-hidden`}>
      {/* Sidebar - Now toggleable */}
      <HRHeadSidebar
        activeItem={activeSection}
        onItemClick={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <HRHeadHeader 
          user={user}
          onLogoClick={() => setSidebarOpen(true)}
        />

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto bg-gradient-to-br ${colors.background} p-5 relative custom-scrollbar`}>
          <div className="relative max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #0000FF, #6495ED);
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #6495ED, #0000FF);
        }
      `}</style>
    </div>
  );
}