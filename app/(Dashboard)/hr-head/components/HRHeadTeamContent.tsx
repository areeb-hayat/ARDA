// app/(Dashboard)/dept-head/components/DepthHeadTeamContent.tsx
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
import { Users, Ticket } from 'lucide-react';

type TabType = 'team' | 'tickets';

export default function HRHeadTeamContent({ department }: TeamContentProps) {
  const { colors, cardCharacters } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('team');
  
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

  useEffect(() => {
    if (activeTab === 'team') {
      fetchEmployees();
    }
  }, [department, activeTab]);

  // REUSE EXISTING API: /api/employee
  const fetchEmployees = async () => {
    if (!department) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/employee?department=${encodeURIComponent(department)}`);
      
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
          department,
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
    { id: 'team' as TabType, label: 'My Team', icon: Users, character: cardCharacters.informative },
    { id: 'tickets' as TabType, label: 'Department Tickets', icon: Ticket, character: cardCharacters.interactive }
  ];

  return (
    <>
      {/* Paper Texture Background */}
      <div className={`fixed inset-0 ${colors.paperTexture} opacity-[0.02] pointer-events-none`}></div>
      
      <div className="relative space-y-5">
        {/* Tab Navigation */}
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
              <TeamLoadingState department={department} />
            ) : (
              <>
                <TeamHeader
                  department={department}
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
          <DeptTicketsContent department={department} />
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