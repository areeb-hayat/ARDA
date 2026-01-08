// app/(Dashboard)/hr-head/components/TeamContent/types.ts

export interface Employee {
  _id: string;
  username: string;
  displayName?: string;
  title: string;
  employeeNumber: string;
  employeeGroup?: string;
  employeeSubGroup?: string;
  basicDetails?: {
    title?: string;
    name?: string;
  };
  contactInformation?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  points?: number;
}

export interface TeamContentProps {
  department: string;
}