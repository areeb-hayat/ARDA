// app/(Dashboard)/executive/components/ExecutiveTeamContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { TeamContentProps, Employee } from './TeamContent/types';
import {TeamHeader} from './TeamContent/TeamHeader';
import {TeamLoadingState} from './TeamContent/TeamLoadingState';
import {ErrorMessage} from './TeamContent/ErrorMessage';
import {EmptyState} from './TeamContent/EmptyState';
import {TeamGrid} from './TeamContent/TeamGrid';
import { EmployeeTicketModal } from '@/app/components/employeeticketlogs';
import { DeptTicketsContent } from '@/app/components/DeptTickets';
import { Users, Ticket, Building2 } from 'lucide-react';

type TabType = 'team' | 'tickets';

interface ExecutiveDepartment {
  name: string;
  employeeCount?: number;
}

export default function ExecutiveTeamContent({ department }: TeamContentProps) {
  const { colors, cardCharacters } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const [executiveDepartments, setExecutiveDepartments] = useState<string[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<string>('');
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [hoveredEmployee, setHoveredEmployee] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [updatingPoints, setUpdatingPoints] = useState<string | null>(null);
  
  // Modal state
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
    title: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get user ID for fetching executive departments
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user._id || user.id || user.userId || user.username);
    }
  }, []);

  // Fetch executive departments
  useEffect(() => {
    if (userId) {
      fetchExecutiveDepartments();
    }
  }, [userId]);

  // Fetch employees when active department changes
  useEffect(() => {
    if (activeDepartment && activeTab === 'team') {
      fetchEmployees();
    }
  }, [activeDepartment, activeTab]);

  const fetchExecutiveDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await fetch(`/api/admin/executive-departments?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        const depts = data.departments || [];
        setExecutiveDepartments(depts);
        
        // Set first department as active
        if (depts.length > 0 && !activeDepartment) {
          setActiveDepartment(depts[0]);
        }
      } else {
        console.error('Failed to fetch executive departments');
        setError('Failed to load executive departments');
      }
    } catch (error) {
      console.error('Error fetching executive departments:', error);
      setError('Network error: Failed to fetch departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  // REUSE EXISTING API: /api/employee
  const fetchEmployees = async () => {
    if (!activeDepartment) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/employee?department=${encodeURIComponent(activeDepartment)}`);
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
        setFilteredEmployees(data.employees || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch employees');
        setEmployees([]);
        setFilteredEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Network error: Failed to fetch employees');
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee => {
        const name = employee.displayName || employee.username || '';
        const title = employee.title || '';
        const empNum = employee.employeeNumber || '';
        
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               title.toLowerCase().includes(searchTerm.toLowerCase()) ||
               empNum.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  // REUSE EXISTING API: /api/leaderboard
  const updatePoints = async (employeeId: string, change: number) => {
    setUpdatingPoints(employeeId);
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          department: activeDepartment,
          pointsChange: change
        }),
      });

      if (response.ok) {
        await fetchEmployees();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update points');
      }
    } catch (error) {
      console.error('Error updating points:', error);
      alert('Failed to update points');
    } finally {
      setUpdatingPoints(null);
    }
  };

  const handleEmployeeClick = (employee: Employee) => {
    console.log('handleEmployeeClick called with:', employee._id);
    
    const displayName = employee.displayName || 
      (employee.basicDetails ? 
        `${employee.basicDetails.title || ''} ${employee.basicDetails.name || ''}`.trim() : 
        employee.username) || 'N/A';

    const employeeData = {
      id: employee._id,
      name: displayName,
      title: employee.title || 'N/A'
    };

    console.log('Setting selected employee:', employeeData);
    
    setSelectedEmployee(employeeData);
    setIsModalOpen(true);
    
    console.log('Modal should be open now');
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  // Debug log for modal state
  useEffect(() => {
    console.log('Modal state changed:', { isModalOpen, selectedEmployee });
  }, [isModalOpen, selectedEmployee]);

  const tabs = [
    { id: 'team' as TabType, label: 'Team', icon: Users, character: cardCharacters.informative },
    { id: 'tickets' as TabType, label: 'Tickets', icon: Ticket, character: cardCharacters.interactive }
  ];

  if (loadingDepartments) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative">
            <h2 className={`text-xl font-black ${cardCharacters.informative.text} mb-2`}>Executive Dashboard</h2>
            <p className={`text-sm ${colors.textMuted}`}>Loading your departments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (executiveDepartments.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <div className={`relative overflow-hidden rounded-xl border backdrop-blur-sm bg-gradient-to-br ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${colors.shadowCard} p-8`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          <div className="relative text-center">
            <Building2 className={`h-16 w-16 ${colors.textMuted} mx-auto mb-4 opacity-40`} />
            <h2 className={`text-xl font-black ${cardCharacters.informative.text} mb-2`}>No Departments Assigned</h2>
            <p className={`text-sm ${colors.textMuted}`}>
              No departments have been assigned to your executive account. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Paper Texture Background */}
      <div className={`fixed inset-0 ${colors.paperTexture} opacity-[0.02] pointer-events-none`}></div>
      
      <div className="relative space-y-5">
        {/* Department Tabs */}
        <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.shadowCard}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className={`h-5 w-5 ${cardCharacters.informative.iconColor} transition-all duration-300`} />
              <span className={`text-sm font-bold ${colors.textSecondary} uppercase tracking-wider`}>
                Your Departments
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {executiveDepartments.map((dept) => {
                const isActive = activeDepartment === dept;
                
                return (
                  <button
                    key={dept}
                    onClick={() => {
                      setActiveDepartment(dept);
                      setSearchTerm(''); // Clear search when switching departments
                    }}
                    className={`group relative px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden border-2 ${
                      isActive
                        ? `bg-gradient-to-r ${cardCharacters.informative.bg} ${cardCharacters.informative.border} ${cardCharacters.informative.text}`
                        : `${colors.inputBg} ${colors.textSecondary} ${colors.borderSubtle}`
                    }`}
                  >
                    {/* Paper Texture */}
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    
                    {/* Internal Glow - appears on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ 
                        boxShadow: isActive 
                          ? `inset 0 0 20px ${colors.glowPrimary}` 
                          : `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` 
                      }}
                    ></div>
                    
                    <span className="relative z-10">{dept}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Team/Tickets Tab Navigation */}
        <div className={`relative overflow-hidden rounded-2xl border-2 backdrop-blur-sm bg-gradient-to-br ${colors.cardBg} ${colors.border} ${colors.shadowCard}`}>
          <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.03]`}></div>
          
          <div className="relative p-2">
            <div className="grid grid-cols-2 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const charColors = tab.character;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative overflow-hidden rounded-xl p-4 font-bold text-sm transition-all duration-300 border-2
                      ${isActive 
                        ? `bg-gradient-to-br ${charColors.bg} ${charColors.border} ${charColors.text}`
                        : `bg-gradient-to-br ${colors.cardBg} ${colors.borderSubtle} ${colors.textSecondary}`
                      }`}
                  >
                    {/* Paper Texture */}
                    <div className={`absolute inset-0 ${colors.paperTexture} opacity-[0.02]`}></div>
                    
                    {/* Internal Glow - appears on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ 
                        boxShadow: isActive 
                          ? `inset 0 0 20px ${colors.glowPrimary}` 
                          : `inset 0 0 14px ${colors.glowPrimary}, inset 0 0 28px ${colors.glowPrimary}` 
                      }}
                    ></div>
                    
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      {/* Animated Icon - rotates and translates on hover */}
                      <Icon className={`w-5 h-5 transition-all duration-300 group-hover:rotate-12 group-hover:translate-x-1 ${isActive ? charColors.iconColor : ''}`} />
                      <span className="hidden md:inline">{tab.label}</span>
                      <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'team' && (
          <>
            {loading ? (
              <TeamLoadingState department={activeDepartment} />
            ) : (
              <>
                <TeamHeader
                  department={activeDepartment}
                  employeeCount={employees.length}
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />

                {error && <ErrorMessage message={error} />}

                {filteredEmployees.length === 0 ? (
                  <EmptyState searchTerm={searchTerm} />
                ) : (
                  <TeamGrid
                    employees={filteredEmployees}
                    hoveredEmployee={hoveredEmployee}
                    updatingPoints={updatingPoints}
                    onMouseEnter={setHoveredEmployee}
                    onMouseLeave={() => setHoveredEmployee(null)}
                    onUpdatePoints={updatePoints}
                    onEmployeeClick={handleEmployeeClick}
                  />
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'tickets' && (
          <DeptTicketsContent department={activeDepartment} />
        )}
      </div>

      {/* Employee Ticket Analytics Modal */}
      {selectedEmployee && (
        <EmployeeTicketModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          employeeTitle={selectedEmployee.title}
        />
      )}
    </>
  );
}