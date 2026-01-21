// ===== models/Ticket.ts (SIMPLIFIED WITH CREDIT FIELDS) =====
import mongoose, { Schema, Document } from 'mongoose';

export interface IContributor {
  userId: string;
  name: string;
  role: 'assignee' | 'group_lead' | 'group_member';
  contributorType: 'primary' | 'secondary';
  joinedAt: Date;
  leftAt?: Date;
}

export interface IBlocker {
  description: string;
  reportedBy: string;
  reportedByName: string;
  reportedAt: Date;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: Date;
}

export interface IWorkflowHistoryEntry {
  actionType: 'in_progress' | 'forwarded' | 'reverted' | 'blocker_reported' | 'blocker_resolved' | 'resolved' | 'closed' | 'reopened' | 'reassigned' | 'group_formed';
  performedBy: {
    userId: string;
    name: string;
  };
  performedAt: Date;
  fromNode?: string;
  toNode?: string;
  explanation?: string;
  blockerDescription?: string;
  reassignedTo?: string[];
  groupMembers?: Array<{
    userId: string;
    name: string;
    isLead: boolean;
  }>;
  attachments?: string[];  // ✅ ADD THIS LINE
}

export interface ITicket extends Document {
  ticketNumber: string;
  functionalityName: string;
  functionality: mongoose.Types.ObjectId;
  department: string;
  raisedBy: {
    userId: string;
    name: string;
    email?: string;
  };
  formData: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'blocked' | 'resolved' | 'closed';
  workflowStage: string;
  currentAssignee: string;
  currentAssignees: string[];
  groupLead: string | null;
  
  // NEW: Simple credit tracking
  primaryCredit: {
    userId: string;
    name: string;
  } | null;
  secondaryCredits: Array<{
    userId: string;
    name: string;
  }>;
  
  // Keep contributors for history/audit
  contributors: IContributor[];
  blockers: IBlocker[];
  workflowHistory: IWorkflowHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const ContributorSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['assignee', 'group_lead', 'group_member'],
    required: true 
  },
  contributorType: {
    type: String,
    enum: ['primary', 'secondary'],
    required: false  // Not required since we use primaryCredit/secondaryCredits now
  },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date }
});

const BlockerSchema = new Schema({
  description: { type: String, required: true },
  reportedBy: { type: String, required: true },
  reportedByName: { type: String, required: true },
  reportedAt: { type: Date, default: Date.now },
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: String },
  resolvedByName: { type: String },
  resolvedAt: { type: Date }
});

const WorkflowHistorySchema = new Schema({
  actionType: { 
    type: String, 
    enum: ['in_progress', 'forwarded', 'reverted', 'blocker_reported', 'blocker_resolved', 'resolved', 'closed', 'reopened', 'reassigned', 'group_formed'],
    required: true 
  },
  performedBy: {
    userId: { type: String, required: true },
    name: { type: String, required: true }
  },
  performedAt: { type: Date, default: Date.now },
  fromNode: { type: String },
  toNode: { type: String },
  explanation: { type: String },
  blockerDescription: { type: String },
  reassignedTo: [{ type: String }],
  groupMembers: [{
    userId: String,
    name: String,
    isLead: Boolean
  }],
  attachments: [{ type: String }]  // ✅ ADD THIS LINE
});


const CreditSchema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true }
}, { _id: false });

const TicketSchema = new Schema<ITicket>({
  ticketNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  functionalityName: { 
    type: String, 
    required: true 
  },
  functionality: { 
    type: Schema.Types.ObjectId, 
    ref: 'Functionality', 
    required: true 
  },
  department: {
    type: String,
    required: true
  },
  raisedBy: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String }
  },
  formData: {
    type: Schema.Types.Mixed,
    default: {}
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'blocked', 'resolved', 'closed'],
    default: 'pending'
  },
  workflowStage: { 
    type: String, 
    required: true 
  },
  currentAssignee: { 
    type: String, 
    required: true 
  },
  currentAssignees: [{ 
    type: String, 
    required: true 
  }],
  groupLead: { 
    type: String, 
    default: null 
  },
  
  // NEW: Simple credit tracking
  primaryCredit: {
    type: CreditSchema,
    default: null
  },
  secondaryCredits: {
    type: [CreditSchema],
    default: []
  },
  
  contributors: {
    type: [ContributorSchema],
    default: []
  },
  blockers: [BlockerSchema],
  workflowHistory: [WorkflowHistorySchema]
}, {
  timestamps: true
});

// ===== INDEXES =====

// Primary lookup indexes
TicketSchema.index({ status: 1, createdAt: -1 });
TicketSchema.index({ currentAssignee: 1, status: 1, createdAt: -1 });
TicketSchema.index({ currentAssignees: 1, status: 1, createdAt: -1 });

// Compound index for tickets created by user
TicketSchema.index({ 'raisedBy.userId': 1, status: 1, createdAt: -1 });

// Department-based queries
TicketSchema.index({ department: 1, status: 1, createdAt: -1 });

// Functionality queries
TicketSchema.index({ functionality: 1, status: 1, createdAt: -1 });

// Priority-based queries
TicketSchema.index({ priority: -1, status: 1, createdAt: -1 });

// NEW: Credit-based indexes
TicketSchema.index({ 'primaryCredit.userId': 1, status: 1 });
TicketSchema.index({ 'secondaryCredits.userId': 1, status: 1 });

// Contributor tracking indexes (for audit)
TicketSchema.index({ 'contributors.userId': 1, status: 1 });

// Blocked tickets queries
TicketSchema.index({ status: 1, 'blockers.isResolved': 1 });

// Workflow stage queries
TicketSchema.index({ workflowStage: 1, status: 1 });

// Group lead queries
TicketSchema.index({ groupLead: 1, status: 1 });

// Date-based queries
TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ updatedAt: -1 });

// Text search
TicketSchema.index({ ticketNumber: 'text', functionalityName: 'text' });

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);