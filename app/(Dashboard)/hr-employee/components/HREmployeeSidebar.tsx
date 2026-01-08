// app/(Dashboard)/hr-employee/components/HREmployeeSidebar.tsx
'use client';

import React, { useState } from 'react';
import { 
  Home,
  FileText, 
  Building2, 
  Clock, 
  ChevronRight,
  Settings,
  Users,
  BarChart3,
  Activity,
  UserCheck,
  Download,
  Calendar,
  TicketIcon,
  ListChecks,
  Megaphone
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/app/context/ThemeContext';

export type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  visible: boolean;
  isExternal?: boolean;
  externalUrl?: string;
};

interface HREmployeeSidebarProps {
  activeItem: string;
  onItemClick: (itemId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function HREmployeeSidebar({ activeItem, onItemClick, isOpen, onClose }: HREmployeeSidebarProps) {
  const { colors, theme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleMouseLeave = () => {
    onClose();
  };

  const sidebarItems: SidebarItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },
  
  // Broadcast
  {
    id: 'announcements',
    label: 'Announcements',
    icon: <Megaphone className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },
  {
    id: 'org-announcements',
    label: 'Org Announcements',
    icon: <Megaphone className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },

  // Operations
  {
    id: 'projects',
    label: 'My Work',
    icon: <ListChecks className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },
  {
    id: 'assigned-tickets',
    label: 'Assigned Tickets',
    icon: <FileText className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },
  {
    id: 'tickets',
    label: 'Create Ticket',
    icon: <TicketIcon className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },

  // People & control
  {
    id: 'manage-users',
    label: 'Manage Users',
    icon: <Users className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },
  {
    id: 'download-logs',
    label: 'View Logs',
    icon: <Download className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: false
  },

  // Planning
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <Calendar className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: <Users className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },

  // Reference
  {
    id: 'policies',
    label: 'Policies',
    icon: <FileText className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },
  {
    id: 'org-info',
    label: 'Org Info',
    icon: <Building2 className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true
  },

  // External systems
  {
    id: 'timetrax',
    label: 'TimeTrax',
    icon: <Clock className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true,
    isExternal: true,
    externalUrl: 'http://192.168.9.20:90/Login.aspx'
  },
  {
    id: 'ats',
    label: 'ATS',
    icon: <UserCheck className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: false,
    isExternal: true,
    externalUrl: 'https://google.com'
  },
  {
    id: 'qliksense',
    label: 'QlikSense',
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true,
    isExternal: true,
    externalUrl: 'https://qlik.pepsiisb.com:9443'
  },
  {
    id: 'theia',
    label: 'Theia',
    icon: <Activity className="h-3.5 w-3.5" />,
    color: theme === 'dark' ? '#64B5F6' : '#2196F3',
    visible: true,
    isExternal: true,
    externalUrl: 'https://theia.pepsiisb.com/portal/'
  }
];


  const handleItemClick = (item: SidebarItem) => {
    if (item.isExternal && item.externalUrl) {
      window.open(item.externalUrl, '_blank');
    } else {
      onItemClick(item.id);
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b ${colors.sidebarBg} border-r ${colors.border} flex flex-col z-50 ${colors.shadowDropdown} transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseLeave={handleMouseLeave}
      >
        {/* Paper Texture Overlay */}
        <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02] pointer-events-none`}></div>

        {/* Logo Section with ARDA */}
        <div className={`relative border-b ${colors.border} flex items-center justify-center py-6`}>
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-r from-[#2196F3] to-[#64B5F6] rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-all duration-300`}></div>
              <div className={`relative bg-gradient-to-br ${colors.glassBg} p-2.5 rounded-xl ${colors.shadowCard} border ${colors.borderStrong}`}>
                <Image
                  src="/NewPepsi.png"
                  alt="Pepsi Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className={`text-2xl font-black ${colors.textPrimary} tracking-tight`}>
              ARDA
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="relative flex-1 overflow-y-auto py-4 px-3 space-y-2">
          {sidebarItems
            .filter(item => item.visible)
            .map((item) => {
              const isActive = activeItem === item.id && !item.isExternal;
              const isHovered = hoveredItem === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    w-full group relative overflow-hidden rounded-lg transition-all duration-300
                    ${isActive 
                      ? `bg-gradient-to-r ${colors.sidebarItemActiveBg} border ${colors.borderStrong} ${colors.shadowHover}` 
                      : `bg-gradient-to-br ${colors.sidebarItemBg} border ${colors.border} ${colors.borderHover}`
                    }
                  `}
                >
                  {/* Paper Texture */}
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

                  {/* Hover Gradient Effect */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-r ${colors.cardBgHover}
                    transition-transform duration-300
                    ${isHovered || isActive ? 'translate-x-0' : '-translate-x-full'}
                  `}></div>

                  <div className="relative flex items-center justify-between p-3">
                    <div className="flex items-center space-x-3">
                      <div 
                        className={`p-2 rounded-lg transition-all duration-300 ${isActive ? 'shadow-md' : ''}`}
                        style={{
                          backgroundColor: isActive ? item.color : 'transparent',
                          boxShadow: isActive ? `0 0 14px ${item.color}60` : undefined
                        }}
                      >
                        <div className={`transition-all duration-300 ${isActive ? 'text-white' : `${colors.textAccent}`}`}>
                          {item.icon}
                        </div>
                      </div>

                      <div className="text-left">
                        <div className={`
                          font-bold text-sm transition-colors duration-300
                          ${isActive ? colors.textOnDark : `${colors.textPrimary}`}
                        `}>
                          {item.label}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`
                      h-3.5 w-3.5 transition-all duration-300
                      ${isActive 
                        ? `${colors.textAccent} translate-x-0 opacity-100` 
                        : `${colors.textMuted} -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:${colors.textAccent}`
                      }
                    `} />
                  </div>

                  {isActive && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                      style={{ 
                        backgroundColor: item.color,
                        boxShadow: `0 0 7px ${item.color}`
                      }}
                    ></div>
                  )}
                </button>
              );
            })}
        </div>

        {/* Bottom Section - Settings */}
        <div className={`relative p-3 border-t ${colors.border}`}>
          {/* Paper Texture */}
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
          
          <button 
            onClick={() => {
              onItemClick('settings');
              onClose();
            }}
            className={`w-full relative overflow-hidden flex items-center space-x-2 p-3 rounded-lg transition-all duration-300 group ${
              activeItem === 'settings'
                ? `bg-gradient-to-r ${colors.sidebarItemActiveBg} border ${colors.borderStrong}`
                : `bg-gradient-to-br ${colors.sidebarItemBg} border ${colors.border} ${colors.borderHover}`
            }`}
          >
            {/* Paper Texture */}
            <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
            
            <div className={`relative p-2 rounded-lg transition-all duration-300 ${
              activeItem === 'settings'
                ? `${colors.buttonPrimary} shadow-md`
                : `bg-transparent ${colors.buttonGhostHover}`
            }`}
              style={{
                boxShadow: activeItem === 'settings' ? `0 0 14px ${theme === 'dark' ? '#64B5F6' : '#2196F3'}60` : undefined
              }}
            >
              <Settings className={`h-3.5 w-3.5 transition-colors duration-300 ${
                activeItem === 'settings' ? colors.textOnDark : `${colors.textAccent} group-hover:${colors.textOnDark}`
              }`} />
            </div>
            <span className={`relative font-bold text-sm transition-colors ${
              activeItem === 'settings' ? colors.textOnDark : `${colors.textPrimary}`
            }`}>
              Settings
            </span>
          </button>
        </div>
      </div>
    </>
  );
}