// models/FormData.ts
import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for each section
interface IEducation {
  title: string;
  degree: string;
  fromDate: string;
  toDate: string;
  country: string;
  specialization: string;
  institute: string;
  percentage: string;
  selectedFile?: string | null;
}

interface ICertification {
  title: string;
  duration: string;
  institute: string;
}

interface IEmployment {
  employer: string;
  fromDate: string;
  toDate: string;
  country: string;
  designation: string;
  leaveReason: string;
  salary: string;
}

interface IRelative {
  name: string;
  relation: string;
  designation: string;
  department: string;
}

interface IParent {
  name: string;
  DOB: string;
  CNIC: string;
}

interface INominee {
  name: string;
  address: string;
  relationship: string;
  amount: string;
  age: string;
  person: string;
}

interface ISpouse {
  name: string;
  DOB: string;
  CNIC: string;
}

interface IChild {
  name: string;
  DOB: string;
  gender: string;
  CNIC: string;
}

// Define the main interface for form data
interface IFormData extends Document {
  // Authentication fields
  username: string;
  password: string;
  department: string;
  title: string;
  isDeptHead: boolean;
  isExecutive: boolean | null;

  basicDetails: {
    title: string;
    name: string;
    fatherName: string;
    gender: string;
    religion: string;
    nationality: string;
    age: string;
    maritalStatus: string;
    profileImage: string;
  };
  identification: {
    CNIC: string;
    birthCountry: string;
    dateOfBirth: string;
    drivingLicense: string;
    drivingLicenseNumber: string;
    dateOfMarriage?: string;
    bloodGroup: string;
    EOBI: string;
  };
  contactInformation: {
    contactNumber: string;
    telephoneNumber: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    postalCode: string;
    district: string;
    country: string;
    emergencyNumber: string;
    emergencyRelation: string;
  };
  educationalDetails: IEducation[];
  certifications: ICertification[];
  employmentHistory: IEmployment[];
  relatives: IRelative[];
  parents: {
    father: IParent;
    mother: IParent;
  };
  dependants: {
    nominees: INominee[];
    spouses: ISpouse[];
    children: IChild[];
  };

  joiningDate: string;
  personnelArea: string;
  employeeGroup: string;
  employeeSubGroup: string;
  employeeNumber: string;
  status: string;
}

// Define Mongoose Schemas
const EducationSchema = new Schema<IEducation>({
  title: String,
  degree: String,
  fromDate: String,
  toDate: String,
  country: String,
  specialization: String,
  institute: String,
  percentage: String,
  selectedFile: { type: String, default: null },
});

const CertificationSchema = new Schema<ICertification>({
  title: String,
  duration: String,
  institute: String,
});

const EmploymentSchema = new Schema<IEmployment>({
  employer: String,
  fromDate: String,
  toDate: String,
  country: String,
  designation: String,
  leaveReason: String,
  salary: String,
});

const RelativeSchema = new Schema<IRelative>({
  name: String,
  relation: String,
  designation: String,
  department: String,
});

const ParentSchema = new Schema<IParent>({
  name: String,
  DOB: String,
  CNIC: String,
});

const NomineeSchema = new Schema<INominee>({
  name: String,
  address: String,
  relationship: String,
  amount: String,
  age: String,
  person: String,
});

const SpouseSchema = new Schema<ISpouse>({
  name: String,
  DOB: String,
  CNIC: String,
});

const ChildSchema = new Schema<IChild>({
  name: String,
  DOB: String,
  gender: String,
  CNIC: String,
});

const FormDataSchema = new Schema<IFormData>({
  // Authentication fields
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  isDeptHead: {
    type: Boolean,
    default: false,
  },
  isExecutive: {
    type: Boolean,
    default: null,
  },

  basicDetails: {
    title: String,
    name: String,
    fatherName: String,
    gender: String,
    religion: String,
    nationality: String,
    age: String,
    maritalStatus: String,
    profileImage: { type: String, default: '/default-profile.jpg' },
  },

  identification: {
    CNIC: String,
    birthCountry: String,
    dateOfBirth: String,
    drivingLicense: String,
    drivingLicenseNumber: String,
    dateOfMarriage: String,
    bloodGroup: String,
    EOBI: String,
  },
  contactInformation: {
    contactNumber: String,
    telephoneNumber: String,
    email: String,
    addressLine1: String,
    addressLine2: String,
    postalCode: String,
    district: String,
    country: String,
    emergencyNumber: String,
    emergencyRelation: String,
  },
  educationalDetails: [EducationSchema],
  certifications: [CertificationSchema],
  employmentHistory: [EmploymentSchema],
  relatives: [RelativeSchema],
  parents: {
    father: ParentSchema,
    mother: ParentSchema,
  },
  dependants: {
    nominees: [NomineeSchema],
    spouses: [SpouseSchema],
    children: [ChildSchema],
  },

  employeeGroup: { type: String },
  employeeSubGroup: { type: String },
  joiningDate: { type: String },
  personnelArea: { type: String },
  employeeNumber: { type: String, default: 'Not Available' },
  status: { type: String, default: 'pending' },
}, {
  timestamps: true,
});

// Indexes for optimized HR and employee queries
// Username is already unique and automatically indexed

// Primary HR filters - department and status
FormDataSchema.index({ department: 1, status: 1 });

// Employee approval workflow
FormDataSchema.index({ status: 1, createdAt: -1 });

// Department head queries
FormDataSchema.index({ isDeptHead: 1, department: 1 });

// Executive queries (multi-department access)
FormDataSchema.index({ isExecutive: 1 });

// Employee number lookup (unique identifier in HR systems)
FormDataSchema.index({ employeeNumber: 1 });

// Joining date queries (seniority, tenure analysis)
FormDataSchema.index({ joiningDate: 1 });

// Personnel area and employee group (organizational structure)
FormDataSchema.index({ personnelArea: 1, employeeGroup: 1 });

// Compound index for department + employee group + status
FormDataSchema.index({ department: 1, employeeGroup: 1, status: 1 });

// CNIC lookup (national ID verification)
FormDataSchema.index({ 'identification.CNIC': 1 });

// Email lookup for contact information
FormDataSchema.index({ 'contactInformation.email': 1 }, { sparse: true });

// Phone number lookup
FormDataSchema.index({ 'contactInformation.contactNumber': 1 }, { sparse: true });

// Name search within basic details
FormDataSchema.index({ 'basicDetails.name': 1 });

// Gender-based queries (diversity reports)
FormDataSchema.index({ 'basicDetails.gender': 1 });

// Blood group queries (emergency medical info)
FormDataSchema.index({ 'identification.bloodGroup': 1 });

// Date of birth queries (age analysis, birthday reminders)
FormDataSchema.index({ 'identification.dateOfBirth': 1 });

// Marital status queries (benefits eligibility)
FormDataSchema.index({ 'basicDetails.maritalStatus': 1 });

// Nationality queries (visa/work permit management)
FormDataSchema.index({ 'basicDetails.nationality': 1 });

// Compound index for filtering by department, status, and joining date
FormDataSchema.index({ department: 1, status: 1, joiningDate: -1 });

// Educational qualifications search
FormDataSchema.index({ 'educationalDetails.degree': 1 });
FormDataSchema.index({ 'educationalDetails.specialization': 1 });

// Employment history queries (previous employers)
FormDataSchema.index({ 'employmentHistory.employer': 1 });

// Relatives in organization (conflict of interest checks)
FormDataSchema.index({ 'relatives.name': 1 });
FormDataSchema.index({ 'relatives.department': 1 });

// Emergency contact queries
FormDataSchema.index({ 'contactInformation.emergencyNumber': 1 }, { sparse: true });

// Text search for employee names, father names, and email
FormDataSchema.index({ 
  'basicDetails.name': 'text', 
  'basicDetails.fatherName': 'text',
  'contactInformation.email': 'text'
});

// Index for recent form submissions
FormDataSchema.index({ createdAt: -1 });

// Index for updated forms (tracking changes)
FormDataSchema.index({ updatedAt: -1 });

export default mongoose.models.FormData || mongoose.model<IFormData>('FormData', FormDataSchema);