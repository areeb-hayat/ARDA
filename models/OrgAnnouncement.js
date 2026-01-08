// models/OrgAnnouncement.js
import mongoose from 'mongoose';

const AttachmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['image', 'document'],
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  }
});

const OrgAnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  edited: {
    type: Boolean,
    default: false,
  },
  expirationDate: {
    type: Date,
    default: null,
  },
  borderColor: {
    type: String,
    default: '#FF0000',
  },
  attachments: [AttachmentSchema],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  targetAudience: {
    type: String,
    default: 'organization',
  }
});

// ===== OPTIMIZED INDEXES (NO DUPLICATES) =====

// Primary index for fetching active org announcements sorted by date
OrgAnnouncementSchema.index({ isDeleted: 1, createdAt: -1 });

// Index for priority sorting (pinned announcements first)
OrgAnnouncementSchema.index({ isDeleted: 1, pinned: -1, createdAt: -1 });

// Index for filtering by author
OrgAnnouncementSchema.index({ author: 1, createdAt: -1 });

// Index for expiration management
OrgAnnouncementSchema.index({ expirationDate: 1, isDeleted: 1 });

// Index for target audience filtering (NEW)
OrgAnnouncementSchema.index({ targetAudience: 1, isDeleted: 1, createdAt: -1 });

// Text search index for searching titles and content
OrgAnnouncementSchema.index({ title: 'text', content: 'text' });

// Index for attachment queries
OrgAnnouncementSchema.index({ 'attachments.uploadedAt': -1 });

// Index for attachment type filtering
OrgAnnouncementSchema.index({ 'attachments.type': 1 });

export default mongoose.models.OrgAnnouncement || mongoose.model('OrgAnnouncement', OrgAnnouncementSchema);