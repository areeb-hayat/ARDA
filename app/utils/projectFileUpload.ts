// app/utils/projectFileUpload.ts
import fs from 'fs';
import path from 'path';

const UPLOAD_BASE_DIR = 'D:\\ARDA\\uploads\\projects';

export function ensureUploadDir(identifier: string): string {
  const itemDir = path.join(UPLOAD_BASE_DIR, identifier);
  
  if (!fs.existsSync(UPLOAD_BASE_DIR)) {
    fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(itemDir)) {
    fs.mkdirSync(itemDir, { recursive: true });
  }
  
  return itemDir;
}

export function saveAttachment(
  identifier: string,
  file: { name: string; data: string | Buffer; type?: string }
): string {
  const uploadDir = ensureUploadDir(identifier);
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${sanitizedName}`;
  const savedPath = path.join(uploadDir, filename);
  
  // Convert base64 to Buffer if needed
  const buffer = Buffer.isBuffer(file.data) 
    ? file.data 
    : Buffer.from(file.data, 'base64');
  
  fs.writeFileSync(savedPath, buffer);
  
  return savedPath;
}