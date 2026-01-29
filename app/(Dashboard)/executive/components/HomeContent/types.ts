// app/components/ManageUsersContent/types.ts

export interface User {
  _id: string;
  username: string;
  password?: string;
  department: string;
  title: string;
  isDeptHead: boolean;
  isApproved: boolean;
  basicDetails: {
    name: string;
    title: string;
  };
  contactInformation: {
    email: string;
    contactNumber: string;
  };
  employeeNumber: string;
  status: string;
}

export interface NewUserForm {
  username: string;
  password: string;
  department: string;
  title: string;
  isDeptHead: boolean;
  isApproved: boolean;
  name: string;
  email: string;
  contactNumber: string;
  employeeNumber: string;
}

export interface EditUserForm {
  department: string;
  title: string;
  isDeptHead: boolean;
  isApproved: boolean;
}

export interface UserFilters {
  searchTerm: string;
  departmentFilter: string;
  approvalFilter: 'all' | 'approved' | 'unapproved';
  roleFilter: 'all' | 'depthead' | 'employee';
  sortBy: 'name' | 'department' | 'employeeNumber' | 'status';
}