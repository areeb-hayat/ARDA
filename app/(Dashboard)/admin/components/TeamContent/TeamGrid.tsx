// app/(Dashboard)/dept-head/components/TeamContent/TeamGrid.tsx
'use client';

import React from 'react';
import EmployeeCard from './EmployeeCard';
import { Employee } from './types';

interface TeamGridProps {
  employees: Employee[];
  hoveredEmployee: string | null;
  updatingPoints: string | null;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
  onUpdatePoints: (employeeId: string, change: number) => void;
  onEmployeeClick?: (employee: Employee) => void;
}

export function TeamGrid({
  employees,
  hoveredEmployee,
  updatingPoints,
  onMouseEnter,
  onMouseLeave,
  onUpdatePoints,
  onEmployeeClick
}: TeamGridProps) {
  
  const handleEmployeeClick = (employee: Employee) => {
    console.log('TeamGrid: Employee clicked', employee._id);
    if (onEmployeeClick) {
      onEmployeeClick(employee);
    } else {
      console.warn('TeamGrid: onEmployeeClick prop is not provided!');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee._id}
          employee={employee}
          isHovered={hoveredEmployee === employee._id}
          isUpdating={updatingPoints === employee._id}
          onMouseEnter={() => onMouseEnter(employee._id)}
          onMouseLeave={onMouseLeave}
          onUpdatePoints={(change) => onUpdatePoints(employee._id, change)}
          onClick={() => handleEmployeeClick(employee)}
        />
      ))}
    </div>
  );
}