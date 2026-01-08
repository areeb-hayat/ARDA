// app/utils/fileUpload.ts
import fs from 'fs';
import path from 'path';

const UPLOAD_BASE_DIR = 'D:\\ARDA\\uploads';
const TICKETS_DIR = path.join(UPLOAD_BASE_DIR, 'tickets');
const ANNOUNCEMENTS_DIR = path.join(UPLOAD_BASE_DIR, 'announcements');

export function ensureUploadDir(ticketNumber: string): string {
  const ticketDir = path.join(TICKETS_DIR, ticketNumber);
  
  if (!fs.existsSync(TICKETS_DIR)) {
    fs.mkdirSync(TICKETS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(ticketDir)) {
    fs.mkdirSync(ticketDir, { recursive: true });
  }
  
  return ticketDir;
}

export function ensureAnnouncementUploadDir(department: string): string {
  const deptDir = path.join(ANNOUNCEMENTS_DIR, department.replace(/[^a-zA-Z0-9]/g, '_'));
  
  if (!fs.existsSync(ANNOUNCEMENTS_DIR)) {
    fs.mkdirSync(ANNOUNCEMENTS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(deptDir)) {
    fs.mkdirSync(deptDir, { recursive: true });
  }
  
  return deptDir;
}

export function saveAttachment(
  ticketNumber: string,
  file: { name: string; data: string | Buffer; type?: string }
): string {
  const uploadDir = ensureUploadDir(ticketNumber);
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${sanitizedName}`;
  const savedPath = path.join(uploadDir, filename);
  
  // Convert base64 to Buffer if needed
  const buffer = Buffer.isBuffer(file.data) 
    ? file.data 
    : Buffer.from(file.data, 'base64');
  
  fs.writeFileSync(savedPath, buffer);
  
  return savedPath; // Return just the path
}

export function saveAnnouncementAttachment(
  department: string,
  file: { name: string; data: string; type: string; size: number }
): { path: string; name: string; type: 'image' | 'document'; size: number } {
  const uploadDir = ensureAnnouncementUploadDir(department);
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${sanitizedName}`;
  const savedPath = path.join(uploadDir, filename);
  
  // Remove base64 prefix if present (e.g., "data:image/png;base64,")
  const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
  const buffer = Buffer.from(base64Data, 'base64');
  
  fs.writeFileSync(savedPath, buffer);
  
  // Determine if it's an image or document based on mime type
  const isImage = file.type.startsWith('image/');
  
  return {
    path: savedPath,
    name: file.name,
    type: isImage ? 'image' : 'document',
    size: file.size
  };
}

export function getAnnouncementAttachmentUrl(filePath: string): string {
  // Convert the file system path to a URL path
  // This assumes you have an API endpoint to serve these files
  // e.g., /api/announcements/attachments?file=path
  return `/api/announcements/attachments?file=${encodeURIComponent(filePath)}`;
}

export function deleteAnnouncementAttachment(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return false;
  }
}