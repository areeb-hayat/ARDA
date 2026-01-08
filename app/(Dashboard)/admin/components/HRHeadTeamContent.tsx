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

export default function HRHeadTeamContent({ department }: TeamContentProps) {
  const { colors } = useTheme();
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
    fetchEmployees();
  }, [department]);

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

  if (loading) {
    return <TeamLoadingState department={department} />;
  }

  return (
    <>
      {/* Paper Texture Background */}
      <div className={`fixed inset-0 ${colors.paperTexture} opacity-[0.02] pointer-events-none`}></div>
      
      <div className="relative space-y-5">
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