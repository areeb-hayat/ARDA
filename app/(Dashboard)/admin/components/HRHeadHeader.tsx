// app/(Dashboard)/hr-employee/components/HREmployeeHeader.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import { LogOut, Briefcase, Building, Mail, Phone, Copy, Check } from 'lucide-react';
import Image from 'next/image';

interface UserData {
  username: string;
  role: string;
  displayName: string;
  department: string;
  title: string;
  isDeptHead: boolean;
  photoUrl?: string;
  email?: string;
  phone?: string;
  employeeNumber?: string;
}

interface DeptHeadHeaderProps {
  user: UserData;
  onLogoClick: () => void;
}

export default function DeptHeadHeader({ user, onLogoClick }: DeptHeadHeaderProps) {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 17) {
      setGreeting('Good Afternoon');
    } else if (hour < 20) {
      setGreeting('Good Evening');
    } else {
      setGreeting('Good Night');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <header className={`bg-gradient-to-r ${colors.background} border-b ${colors.border} backdrop-blur-lg relative`}>
      {/* Paper Texture Overlay */}
      <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02] pointer-events-none`}></div>
      
      <div className="relative px-6 py-4 flex items-center gap-6">
        {/* Logo Section */}
        <div className="w-20 flex-shrink-0">
          <button 
            onClick={onLogoClick}
            onMouseEnter={onLogoClick}
            className="relative group cursor-pointer transition-all duration-300 hover:scale-105 flex flex-col items-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2196F3] to-[#64B5F6] rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
              <div className={`relative bg-gradient-to-br ${colors.glassBg} p-2.5 rounded-xl ${colors.shadowCard} border ${colors.borderStrong}`}>
                <Image
                  src="/NewPepsi.png"
                  alt="Pepsi Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </button>
        </div>

        {/* User Info Section */}
        <div className="flex flex-col justify-center gap-2 flex-shrink-0">
          {/* Row 1: Department, Title, Employee ID */}
          <div className="flex items-center gap-2.5 text-xs">
            <div className={`flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm rounded-lg border ${colors.border} transition-all duration-300 ${colors.shadowCard}`}>
              <Building className={`h-3 w-3 ${colors.textAccent}`} />
              <span className={`font-bold ${colors.textPrimary}`}>{user.department}</span>
            </div>
            
            <div className={`w-1 h-1 ${colors.textMuted} rounded-full opacity-50`}></div>
            
            <div className={`flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm rounded-lg border ${colors.border} transition-all duration-300 ${colors.shadowCard}`}>
              <Briefcase className={`h-3 w-3 ${colors.textAccent}`} />
              <span className={`font-bold ${colors.textPrimary}`}>{user.title}</span>
            </div>
            
            {user.employeeNumber && (
              <>
                <div className={`w-1 h-1 ${colors.textMuted} rounded-full opacity-50`}></div>
                
                <button
                  onClick={() => handleCopy(user.employeeNumber!, 'employeeNumber')}
                  className={`group relative overflow-hidden px-3 py-1.5 ${colors.buttonPrimary} ${colors.buttonPrimaryText} text-xs font-bold rounded-lg border border-transparent ${colors.buttonPrimaryHover} hover:scale-105 transition-all duration-300 flex items-center gap-1.5 ${colors.shadowCard}`}
                >
                  {/* Paper Texture */}
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  
                  {/* Internal Glow */}
                  <div className="button-glow"></div>
                  
                  <span className="relative z-10">ID: {user.employeeNumber}</span>
                  {copiedField === 'employeeNumber' ? (
                    <Check className="h-3 w-3 relative z-10" />
                  ) : (
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity icon-rotate relative z-10" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Row 2: Email and Phone */}
          <div className="flex items-center gap-2.5 text-xs">
            {user.email && (
              <button
                onClick={() => handleCopy(user.email!, 'email')}
                className={`group flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm rounded-lg border ${colors.border} ${colors.borderHover} transition-all duration-300 hover:scale-105 cursor-pointer ${colors.shadowCard}`}
              >
                <Mail className={`h-3 w-3 ${colors.textAccent}`} />
                <span className={`font-bold ${colors.textPrimary}`}>{user.email}</span>
                {copiedField === 'email' ? (
                  <Check className={`h-3 w-3 ${colors.textAccent}`} />
                ) : (
                  <Copy className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ${colors.textAccent}`} />
                )}
              </button>
            )}
            
            {user.phone && (
              <>
                {user.email && <div className={`w-1 h-1 ${colors.textMuted} rounded-full opacity-50`}></div>}
                <button
                  onClick={() => handleCopy(user.phone!, 'phone')}
                  className={`group flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-br ${colors.cardBg} backdrop-blur-sm rounded-lg border ${colors.border} ${colors.borderHover} transition-all duration-300 hover:scale-105 cursor-pointer ${colors.shadowCard}`}
                >
                  <Phone className={`h-3 w-3 ${colors.textAccent}`} />
                  <span className={`font-bold ${colors.textPrimary}`}>{user.phone}</span>
                  {copiedField === 'phone' ? (
                    <Check className={`h-3 w-3 ${colors.textAccent}`} />
                  ) : (
                    <Copy className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ${colors.textAccent}`} />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Welcome Section with Greeting */}
        <div className="flex flex-col justify-center flex-shrink-0">
          <h2 className={`text-2xl font-black ${colors.textPrimary} whitespace-nowrap`}>
            {greeting}, {user.displayName}!
          </h2>
          <p className={`${colors.textAccent} text-sm font-semibold whitespace-nowrap`}>
            Let's make today productive
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 flex-shrink-0 ${colors.shadowCard} hover:${colors.shadowHover} transform hover:scale-105 active:scale-95 overflow-hidden border ${colors.borderSubtle} ${colors.buttonGhostHover}`}
        >
          {/* Paper Texture */}
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
          
          {/* Internal Glow - Red for logout */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ boxShadow: `inset 0 0 14px rgba(244, 67, 54, 0.3), inset 0 0 28px rgba(244, 67, 54, 0.15)` }}
          ></div>
          
          <LogOut className={`h-3.5 w-3.5 transition-all duration-300 relative z-10 ${colors.textSecondary} group-hover:text-red-500 icon-rotate`} />
          <span className={`font-bold text-sm tracking-wide relative z-10 ${colors.textSecondary} group-hover:text-red-500`}>
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}