// ===== models/CalendarEvent.js =====
import mongoose from 'mongoose';

const TimeIntentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['meeting', 'appointment', 'task-block', 'deadline', 'focus-block', 'recovery-block', 'reminder'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  startTime: {
    type: Date,
    required: function() {
      return this.type !== 'deadline' && this.type !== 'reminder';
    }
  },
  endTime: {
    type: Date,
    required: function() {
      return this.type !== 'deadline' && this.type !== 'reminder';
    }
  },
  allDay: {
    type: Boolean,
    default: false
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  color: {
    type: String,
    default: '#2196F3'
  },
  reminderMinutesBefore: {
    type: Number,
    default: 15
  },
  hasReminder: {
    type: Boolean,
    default: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date
  },
  // Link to other modules
  linkedAppointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  linkedProjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  linkedTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  // System-generated events cannot be deleted by user
  isSystemGenerated: {
    type: Boolean,
    default: false
  },
  autoCompleteOnExpiry: {
    type: Boolean,
    default: false
  },
  // User who owns this event
  userId: {
    type: String,
    required: true,
    index: true
  },
  // Additional metadata
  location: String,
  attendees: [{
    userId: String,
    name: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    }
  }],
  createdBy: {
    userId: String,
    name: String
  }
}, {
  timestamps: true
});

const DayCanvasSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  content: {
    type: String,
    default: ''
  },
  checklist: [{
    id: String,
    text: String,
    completed: Boolean,
    createdAt: Date
  }],
  images: [{
    url: String,
    caption: String,
    uploadedAt: Date
  }],
  mindMap: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  tags: [String],
  mood: {
    type: String,
    enum: ['energized', 'focused', 'tired', 'stressed', 'balanced', 'creative']
  },
  reflection: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const DayHealthMetricsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  healthStatus: {
    type: String,
    enum: ['light', 'balanced', 'heavy', 'overloaded'],
    default: 'balanced'
  },
  metrics: {
    totalEvents: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    meetingHours: {
      type: Number,
      default: 0
    },
    focusHours: {
      type: Number,
      default: 0
    },
    deadlineCount: {
      type: Number,
      default: 0
    },
    highPriorityCount: {
      type: Number,
      default: 0
    },
    recoveryHours: {
      type: Number,
      default: 0
    }
  },
  computedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
TimeIntentSchema.index({ userId: 1, startTime: 1 });
TimeIntentSchema.index({ userId: 1, endTime: 1 });
TimeIntentSchema.index({ userId: 1, type: 1 });
TimeIntentSchema.index({ isCompleted: 1, endTime: 1 });

DayCanvasSchema.index({ userId: 1, date: 1 }, { unique: true });
DayHealthMetricsSchema.index({ userId: 1, date: 1 }, { unique: true });

// Middleware to auto-complete events
TimeIntentSchema.pre('save', async function() {
  if (this.autoCompleteOnExpiry && this.endTime && new Date() > this.endTime && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = this.endTime;
  }
});

const TimeIntent = mongoose.models.TimeIntent || mongoose.model('TimeIntent', TimeIntentSchema);
const DayCanvas = mongoose.models.DayCanvas || mongoose.model('DayCanvas', DayCanvasSchema);
const DayHealthMetrics = mongoose.models.DayHealthMetrics || mongoose.model('DayHealthMetrics', DayHealthMetricsSchema);

export { TimeIntent, DayCanvas, DayHealthMetrics };