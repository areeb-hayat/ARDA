// app/models/ProjectManagement/Sprint.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISprintMember {
  userId: string;
  name: string;
  role: 'lead' | 'member';
  joinedAt: Date;
  leftAt?: Date;
}

export interface IAction {
  _id?: string;
  title: string;
  description: string;
  assignedTo: string[];
  status: 'pending' | 'in-progress' | 'in-review' | 'done';
  dueDate?: Date;
  submittedAt?: Date;
  submissionNote?: string;
  attachments: string[];
  blockers: Array<{
    description: string;
    reportedBy: string;
    reportedAt: Date;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
  }>;
  comments: Array<{
    userId: string;
    userName: string;
    message: string;
    createdAt: Date;
  }>;
  history: Array<{
    action: string;
    performedBy: string;
    performedByName: string;
    timestamp: Date;
    details?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISprintChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  attachments?: string[];
}

export interface ISprint extends Document {
  sprintNumber: string;
  title: string;
  description: string;
  department: string;
  projectId?: string;
  projectNumber?: string;
  createdBy: string;
  createdByName: string;
  members: ISprintMember[];
  groupLead: string;
  startDate: Date;
  endDate: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'closed';
  actions: IAction[];
  chat: ISprintChatMessage[];
  health: 'healthy' | 'at-risk' | 'delayed' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>(
  {
    sprintNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      index: true,
    },
    projectNumber: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    members: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        role: { 
          type: String, 
          enum: ['lead', 'member'], 
          required: true 
        },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
      },
    ],
    groupLead: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'closed'],
      default: 'active',
      index: true,
    },
    actions: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        assignedTo: [{ type: String }],
        status: {
          type: String,
          enum: ['pending', 'in-progress', 'in-review', 'done'],
          default: 'pending',
        },
        dueDate: { type: Date },
        submittedAt: { type: Date },
        submissionNote: { type: String },
        attachments: [{ type: String }],
        blockers: [
          {
            description: { type: String, required: true },
            reportedBy: { type: String, required: true },
            reportedAt: { type: Date, default: Date.now },
            isResolved: { type: Boolean, default: false },
            resolvedBy: { type: String },
            resolvedAt: { type: Date },
          },
        ],
        comments: [
          {
            userId: { type: String, required: true },
            userName: { type: String, required: true },
            message: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
          },
        ],
        history: [
          {
            action: { type: String, required: true },
            performedBy: { type: String, required: true },
            performedByName: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            details: { type: String },
          },
        ],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    chat: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        attachments: [{ type: String }],
      },
    ],
    health: {
      type: String,
      enum: ['healthy', 'at-risk', 'delayed', 'critical'],
      default: 'healthy',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SprintSchema.index({ department: 1, status: 1 });
SprintSchema.index({ 'members.userId': 1 });
SprintSchema.index({ groupLead: 1 });
SprintSchema.index({ createdBy: 1 });
SprintSchema.index({ projectId: 1 });

const Sprint: Model<ISprint> =
  mongoose.models.Sprint || mongoose.model<ISprint>('Sprint', SprintSchema);

export default Sprint;