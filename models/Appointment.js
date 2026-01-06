// ===== models/Appointment.js =====
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  // Creator information
  creatorId: {
    type: String,
    required: true,
    index: true
  },
  creatorUsername: {
    type: String,
    required: true,
    index: true
  },
  creatorName: {
    type: String,
    required: true
  },
  
  // Appointment type
  type: {
    type: String,
    enum: ['individual', 'group'],
    default: 'individual',
    required: true
  },
  
  // Participants (for group appointments)
  participants: [{
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'counter-proposed'],
      default: 'pending'
    },
    responseDate: Date,
    declineReason: String,
    counterProposal: {
      date: Date,
      startTime: String,
      endTime: String,
      reason: String
    }
  }],
  
  // Appointment details
  title: {
    type: String,
    required: true
  },
  description: String,
  proposedDate: {
    type: Date,
    required: true,
    index: true
  },
  proposedStartTime: {
    type: String,
    required: true
  },
  proposedEndTime: {
    type: String,
    required: true
  },
  
  // Overall status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'partially-accepted', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Calendar integration
  calendarEventIds: [{
    userId: String,
    eventId: mongoose.Schema.Types.ObjectId
  }],
  
  // History tracking
  history: [{
    action: {
      type: String,
      required: true
    },
    by: {
      type: String,
      required: true
    },
    byName: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Compound indexes for efficient queries
appointmentSchema.index({ creatorUsername: 1, status: 1, proposedDate: 1 });
appointmentSchema.index({ 'participants.username': 1, status: 1, proposedDate: 1 });
appointmentSchema.index({ creatorUsername: 1, createdAt: -1 });
appointmentSchema.index({ proposedDate: 1, status: 1 });

// Method to check if all participants have accepted
appointmentSchema.methods.isFullyAccepted = function() {
  return this.participants.every(p => p.status === 'accepted');
};

// Method to check if any participant has declined
appointmentSchema.methods.hasDeclines = function() {
  return this.participants.some(p => p.status === 'declined');
};

// Method to get pending participants
appointmentSchema.methods.getPendingParticipants = function() {
  return this.participants.filter(p => p.status === 'pending');
};

// Method to update overall status based on participant statuses
appointmentSchema.methods.updateOverallStatus = function() {
  if (this.hasDeclines()) {
    this.status = 'declined';
  } else if (this.isFullyAccepted()) {
    this.status = 'accepted';
  } else if (this.participants.some(p => p.status === 'accepted')) {
    this.status = 'partially-accepted';
  } else {
    this.status = 'pending';
  }
};

export default mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);