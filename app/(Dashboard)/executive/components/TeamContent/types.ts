// app/(Dashboard)/executive/components/TeamContent/types.ts
export interface TeamContentProps {
  department: string;
}

export interface Employee {
  _id: string;
  username: string;
  displayName?: string;
  title?: string;
  department?: string;
  employeeNumber?: string;
  points?: number;
  photoUrl?: string;
  email?: string;
  basicDetails?: {
    title?: string;
    name?: string;
    profileImage?: string;
  };
  contactInformation?: {
    email?: string;
  };
}