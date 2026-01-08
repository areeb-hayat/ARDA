// ============================================
// models/SuperFunctionality.ts
// Super User cross-departmental workflow functionality
// ============================================

import mongoose, { Schema, Document } from 'mongoose';

interface IWorkflowNode {
  id: string;
  type: 'start' | 'employee' | 'end';
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    employeeId?: string;
    employeeName?: string;
    employeeTitle?: string;
    employeeDepartment?: string;
    employeeAvatar?: string;
    nodeType?: 'sequential' | 'parallel';
    groupLead?: string;
    groupMembers?: string[];
  };
}

interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
}

interface IFormField {
  id: string;
  type: 'text' | 'textarea' | 'dropdown' | 'radio' | 'checkbox' | 'number' | 'date' | 'file' | 'table';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  tableConfig?: {
    columns: {
      id: string;
      label: string;
      type: 'text' | 'number' | 'dropdown' | 'date';
      options?: string[];
    }[];
    minRows?: number;
    maxRows?: number;
  };
  order: number;
}

interface IAccessControl {
  type: 'organization' | 'departments' | 'specific_users';
  departments?: string[];
  users?: string[];
}

interface ISuperFunctionality extends Document {
  name: string;
  description: string;
  workflow: {
    nodes: IWorkflowNode[];
    edges: IWorkflowEdge[];
  };
  formSchema: {
    fields: IFormField[];
    useDefaultFields: boolean;
  };
  accessControl: IAccessControl;
  createdBy: {
    userId: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowNodeSchema = new Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['start', 'employee', 'end'], 
    required: true 
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  data: {
    label: { type: String, required: true },
    employeeId: String,
    employeeName: String,
    employeeTitle: String,
    employeeDepartment: String,
    employeeAvatar: String,
    nodeType: { 
      type: String, 
      enum: ['sequential', 'parallel'],
      default: 'sequential'
    },
    groupLead: String,
    groupMembers: [String]
  }
}, { _id: false });

const WorkflowEdgeSchema = new Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true }
}, { _id: false });

const FormFieldSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'textarea', 'dropdown', 'radio', 'checkbox', 'number', 'date', 'file', 'table'],
    required: true
  },
  label: { type: String, required: true },
  placeholder: { type: String, required: false },
  required: { type: Boolean, default: false },
  options: { type: [String], required: false },
  validation: {
    type: Schema.Types.Mixed,
    required: false
  },
  tableConfig: {
    type: Schema.Types.Mixed,
    required: false
  },
  order: { type: Number, required: true }
}, { _id: false });

const AccessControlSchema = new Schema({
  type: {
    type: String,
    enum: ['organization', 'departments', 'specific_users'],
    required: true,
    default: 'organization'
  },
  departments: {
    type: [String],
    default: []
  },
  users: {
    type: [String],
    default: []
  }
}, { _id: false });

const SuperFunctionalitySchema = new Schema<ISuperFunctionality>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  workflow: {
    nodes: {
      type: [WorkflowNodeSchema],
      required: true
    },
    edges: {
      type: [WorkflowEdgeSchema],
      required: true
    }
  },
  formSchema: {
    type: {
      fields: {
        type: [FormFieldSchema],
        default: []
      },
      useDefaultFields: {
        type: Boolean,
        default: true
      }
    },
    required: false,
    default: () => ({
      fields: [],
      useDefaultFields: true
    })
  },
  accessControl: {
    type: AccessControlSchema,
    required: true,
    default: () => ({
      type: 'organization',
      departments: [],
      users: []
    })
  },
  createdBy: {
    userId: { type: String, required: true },
    name: { type: String, required: true }
  }
}, {
  timestamps: true,
  strict: true
});

// Indexes for efficient queries
SuperFunctionalitySchema.index({ 'accessControl.type': 1 });
SuperFunctionalitySchema.index({ 'accessControl.departments': 1 });
SuperFunctionalitySchema.index({ 'accessControl.users': 1 });
SuperFunctionalitySchema.index({ createdAt: -1 });
SuperFunctionalitySchema.index({ name: 'text', description: 'text' });

// Post-save hook for debugging
SuperFunctionalitySchema.post('save', function(doc) {
  console.log('🔍 POST-SAVE HOOK - SuperFunctionality saved:', {
    id: doc._id,
    name: doc.name,
    accessType: doc.accessControl.type,
    hasFormSchema: !!doc.formSchema,
    fieldCount: doc.formSchema?.fields?.length || 0
  });
});

export default mongoose.models.SuperFunctionality || 
  mongoose.model<ISuperFunctionality>('SuperFunctionality', SuperFunctionalitySchema);