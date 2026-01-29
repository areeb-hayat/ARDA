// app/(Dashboard)/executive/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import HRHeadSidebar from '../components/HRHeadSidebar';
import HRHeadHeader from '../components/HRHeadHeader';
import HRHeadHomeContent from '../components/HRHeadHomeContent';
import ExecutiveTeamContent from '../components/ExecutiveTeamContent';
import ExecutiveProjectDashboard from '../components/ExecutiveProjectDashboard';
import CalendarView from '../components/CalendarView';
import AppointmentView from '../components/AppointmentView';
import DownloadLogs from '../components/DownloadLogs';
import PoliciesContent from '@/app/components/universal/PoliciesContent';
import ManageUsersContent from '../components/HRManageUsersContent';
import OrgInfoContent from '@/app/components/universal/OrgInfoContent';
import ExecutiveWorkflowsContent from '../components/ExecutiveWorkflowsContent';
import SettingsContent from '@/app/components/universal/SettingsContent';
import TicketingContent from '@/app/components/ticketing/TicketingContent';
import AssignedTicketsContent from '@/app/components/ticketing/AssignedTicketsContent';
import AnnouncementsPage from '@/app/components/DeptHeadAnnouncements/AnnouncementsPage';
import OrgAnnouncementsPage from '@/app/components/universal/OrgAnnouncementsPage';
import { Loader2 } from 'lucide-react';

interface UserData {
  username: string;
  role: 'employee.other' | 'employee.hr' | 'depthead.hr' | 'depthead.other' | 'executive' | 'admin';
  displayName: string;
  department: string;
  title: string;
  isDeptHead: boolean;
  isExecutive: boolean | null;
  photoUrl?: string;
  email?: string;
  phone?: string;
  employeeNumber?: string;
}

export default function ExecutiveDashboard() {
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
      
      console.log('Executive Dashboard - User data:', {
        username: parsedUser.username,
        role: parsedUser.role,
        department: parsedUser.department,
        isDeptHead: parsedUser.isDeptHead,
        isExecutive: parsedUser.isExecutive
      });
      
      // Verify user is executive using the role field
      if (parsedUser.role !== 'executive' && parsedUser.role !== 'admin') {
        console.log('Access denied - not an executive. Redirecting. Role:', parsedUser.role);
        
        // Redirect based on their actual role
        if (parsedUser.role === 'depthead.hr') {
          router.push('/hr-head/dashboard');
        } else if (parsedUser.role === 'depthead.other') {
          router.push('/dept-head/dashboard');
        } else if (parsedUser.role === 'employee.hr') {
          router.push('/hr-employee/dashboard');
        } else {
          router.push('/employee/dashboard');
        }
        return;
      }
      
      console.log('Access granted to Executive dashboard');
      setUser(parsedUser);
    } else {
      console.log('No user data - redirecting to login');
      router.push('/login');
    }
  }, [router]);

  if (!user) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.background} flex items-center justify-center relative overflow-hidden`}>
        <div className="relative text-center space-y-4">
          <Loader2 className={`w-14 h-14 ${colors.textAccent} animate-spin mx-auto`} />
          <p className={`${colors.textPrimary} text-lg font-bold`}>Loading Executive Dashboard...</p>
          <div className="flex items-center justify-center gap-1.5">
            <div 
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ backgroundColor: colors.glowPrimary }}
            />
            <div 
              className="w-1.5 h-1.5 rounded-full animate-bounce" 
              style={{ 
                backgroundColor: colors.glowSecondary,
                animationDelay: '0.1s' 
              }}
            />
            <div 
              className="w-1.5 h-1.5 rounded-full animate-bounce" 
              style={{ 
                backgroundColor: colors.glowAccent,
                animationDelay: '0.2s' 
              }}
            />
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
        return <ExecutiveTeamContent department={user.department} />;
      
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
      
      case 'projects':
        return <ExecutiveProjectDashboard />;

      case 'org-announcements':
        return <OrgAnnouncementsPage onBack={() => setActiveSection('home')} isHREmployee={true} userDepartment={user.department}/>;
      
      case 'manage-users':
        return <ManageUsersContent initialFilter={manageUsersFilter} />;
      
      case 'policies':
        return <PoliciesContent />;
      
      case 'org-info':
        return <OrgInfoContent />;
      
      case 'workflows':
        return <ExecutiveWorkflowsContent />;
      
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