// app/models/ProjectManagement/Project.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProjectMember {
  userId: string;
  name: string;
  role: 'lead' | 'member';
  joinedAt: Date;
  leftAt?: Date;
}

export interface IDeliverable {
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

export interface IChatMessage {
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  attachments?: string[];
}

export interface IProject extends Document {
  projectNumber: string;
  title: string;
  description: string;
  department: string;
  createdBy: string;
  createdByName: string;
  members: IProjectMember[];
  groupLead: string;
  startDate: Date;
  targetEndDate?: Date;
  completedAt?: Date;
  status: 'active' | 'completed' | 'archived';
  deliverables: IDeliverable[];
  chat: IChatMessage[];
  health: 'healthy' | 'at-risk' | 'delayed' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    projectNumber: {
      type: String,
      required: true,
      unique: true,
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
    targetEndDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    deliverables: [
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
ProjectSchema.index({ department: 1, status: 1 });
ProjectSchema.index({ 'members.userId': 1 });
ProjectSchema.index({ groupLead: 1 });
ProjectSchema.index({ createdBy: 1 });

// Clear any cached model to prevent schema conflicts
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}

const Project: Model<IProject> = mongoose.model<IProject>('Project', ProjectSchema);

export default Project;