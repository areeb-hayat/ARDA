// app/components/ManageUsersContent/types.ts
export interface User {
  _id: string;
  username: string;
  password?: string;
  department: string;
  title: string;
  isDeptHead: boolean;
  isExecutive: boolean | null;
  isApproved: boolean;
  employeeNumber: string;
  joiningDate?: string;
  status?: string;
  employeeGroup?: string;
  employeeSubGroup?: string;
  personnelArea?: string;
  basicDetails?: {
    title?: string;
    name?: string;
    fatherName?: string;
    gender?: string;
    religion?: string;
    nationality?: string;
    age?: string;
    maritalStatus?: string;
    profileImage?: string;
  };
  identification?: {
    CNIC?: string;
    birthCountry?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    drivingLicense?: string;
    drivingLicenseNumber?: string;
    dateOfMarriage?: string;
    EOBI?: string;
  };
  contactInformation?: {
    contactNumber?: string;
    telephoneNumber?: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    postalCode?: string;
    district?: string;
    country?: string;
    emergencyNumber?: string;
    emergencyRelation?: string;
  };
  educationalDetails?: Array<{
    title?: string;
    degree?: string;
    fromDate?: string;
    toDate?: string;
    country?: string;
    institute?: string;
    specialization?: string;
    percentage?: string;
    selectedFile?: string;
    _id?: any;
  }>;
  certifications?: Array<any>;
  employmentHistory?: Array<any>;
  relatives?: Array<{
    name?: string;
    relation?: string;
    designation?: string;
    department?: string;
    _id?: any;
  }>;
  parents?: {
    father?: {
      name?: string;
      DOB?: string;
      CNIC?: string;
      _id?: any;
    };
    mother?: {
      name?: string;
      DOB?: string;
      CNIC?: string;
      _id?: any;
    };
  };
  dependants?: {
    nominees?: Array<{
      name?: string;
      address?: string;
      relationship?: string;
      amount?: string;
      age?: string;
      person?: string;
      _id?: any;
    }>;
    spouses?: Array<{
      name?: string;
      DOB?: string;
      CNIC?: string;
      _id?: any;
    }>;
    children?: Array<{
      name?: string;
      DOB?: string;
      gender?: string;
      CNIC?: string;
      _id?: any;
    }>;
  };
  updatedAt?: Date | string;
  __v?: number;
}

export interface EditUserForm {
  department: string;
  title: string;
  isDeptHead: boolean;
  isExecutive: boolean | null;
  isApproved: boolean;
}

export interface UserFilters {
  searchTerm: string;
  departmentFilter: string;
  approvalFilter: 'all' | 'approved' | 'unapproved';
  roleFilter: 'all' | 'depthead' | 'employee' | 'executive';
  sortBy: 'name' | 'department' | 'employeeNumber' | 'status';
}

export interface ExecutiveDepartments {
  userId: string;
  username: string;
  departments: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}