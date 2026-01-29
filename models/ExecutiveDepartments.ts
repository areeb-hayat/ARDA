// models/ExecutiveDepartments.ts
import mongoose, { Schema, Document } from 'mongoose';

// Interface for executive department assignments
interface IExecutiveDepartments extends Document {
  userId: string; // Reference to the user's _id in formdatas collection
  username: string; // For easy reference
  departments: string[]; // Array of department names this executive manages
  createdAt: Date;
  updatedAt: Date;
}

const ExecutiveDepartmentsSchema = new Schema<IExecutiveDepartments>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true,
    index: true
  },
  departments: {
    type: [String],
    default: [],
    index: true
  }
}, {
  timestamps: true,
  collection: 'executivedepartments'
});

// Index for querying which executives manage a specific department
ExecutiveDepartmentsSchema.index({ departments: 1 });

// Compound index for user + department queries
ExecutiveDepartmentsSchema.index({ userId: 1, departments: 1 });

export default mongoose.models.ExecutiveDepartments || 
  mongoose.model<IExecutiveDepartments>('ExecutiveDepartments', ExecutiveDepartmentsSchema);