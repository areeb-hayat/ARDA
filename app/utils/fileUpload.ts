// app/utils/fileUpload.ts
import fs from 'fs';
import path from 'path';

const UPLOAD_BASE_DIR = 'D:\\ARDA\\uploads\\tickets';

export function ensureUploadDir(ticketNumber: string): string {
  const ticketDir = path.join(UPLOAD_BASE_DIR, ticketNumber);
  
  if (!fs.existsSync(UPLOAD_BASE_DIR)) {
    fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(ticketDir)) {
    fs.mkdirSync(ticketDir, { recursive: true });
  }
  
  return ticketDir;
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