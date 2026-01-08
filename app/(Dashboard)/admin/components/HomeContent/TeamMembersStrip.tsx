// app/(Dashboard)/dept-head/components/HomeContent/TeamMembersStrip.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { User } from 'lucide-react';

interface Employee {
  _id: string;
  username: string;
  displayName?: string;
  basicDetails?: {
    name?: string;
    title?: string;
  };
  title?: string;
  department?: string;
}

interface TeamMembersStripProps {
  department: string;
  onClick: () => void;
}

export default function TeamMembersStrip({ department, onClick }: TeamMembersStripProps) {
  const { colors, theme } = useTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, [department]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/dept-employees?department=${encodeURIComponent(department)}`);
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (employee: Employee) => {
    return employee.displayName || 
      (employee.basicDetails?.name ? 
        `${employee.basicDetails.title || ''} ${employee.basicDetails.name}`.trim() : 
        employee.username) || 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className={`w-6 h-6 border-2 ${colors.textAccent} border-t-transparent rounded-full animate-spin`}></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-6 bg-gradient-to-b ${colors.buttonPrimary} rounded-full`}></div>
          <h3 className={`text-xl font-black ${colors.textPrimary}`}>
            Team Members
          </h3>
        </div>
        <span className={`text-sm font-bold ${colors.textMuted}`}>
          {employees.length} members
        </span>
      </div>

      {/* Horizontal scrollable strip */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-4">
          {employees.map((employee) => (
            <div
              key={employee._id}
              onClick={onClick}
              className={`group flex-shrink-0 w-32 relative overflow-hidden bg-gradient-to-br ${colors.cardBg} rounded-lg p-3 border-2 ${colors.border} ${colors.borderHover} cursor-pointer transition-all duration-300 ${colors.shadowCard} hover:${colors.shadowHover} hover:scale-105`}
            >
              {/* Paper Texture */}
              <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>

              {/* Internal glow on hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
                style={{ boxShadow: `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` }}
              ></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                {/* Avatar - Icon only, no photos */}
                <div className={`relative overflow-hidden w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${colors.glassBg} border-2 ${colors.borderStrong} transition-all duration-300 group-hover:rotate-6 ${colors.shadowCard}`}>
                  {/* Avatar Paper Texture */}
                  <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                  
                  <User className={`relative z-10 h-6 w-6 ${colors.textAccent} transition-all duration-300 group-hover:scale-110`} />
                </div>

                {/* Name */}
                <div className="w-full">
                  <p className={`text-xs font-bold ${colors.textPrimary} truncate`}>
                    {getDisplayName(employee)}
                  </p>
                  <p className={`text-xs font-semibold ${colors.textMuted} truncate mt-0.5`}>
                    {employee.title || 'Team Member'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {employees.length === 0 && (
            <div className={`flex items-center justify-center w-full h-24 ${colors.textMuted} text-sm font-semibold`}>
              No team members found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}