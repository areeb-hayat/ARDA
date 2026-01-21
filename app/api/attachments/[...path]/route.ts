// app/api/attachments/[...path]/route.ts
// Fixed version with corrected security check

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    
    console.log('📎 === ATTACHMENT REQUEST ===');
    console.log('   Segments:', pathSegments);
    
    // Construct file path (attachments are in uploads/tickets/TICKET-NUMBER/*)
    const filePath = path.join('D:\\ARDA\\', 'uploads', 'tickets', ...pathSegments);
    
    console.log('   Constructed path:', filePath);
    console.log('   File exists:', fs.existsSync(filePath));
    
    // Security: Prevent directory traversal
    // ✅ FIX: Use the same base directory as filePath construction
    const uploadsDir = path.join('D:\\ARDA\\', 'uploads', 'tickets');
    const normalizedFilePath = path.normalize(filePath);
    const normalizedUploadsDir = path.normalize(uploadsDir);
    
    console.log('   🔒 Security check:');
    console.log('      File path:', normalizedFilePath);
    console.log('      Base dir:', normalizedUploadsDir);
    console.log('      Starts with base?', normalizedFilePath.startsWith(normalizedUploadsDir));
    
    if (!normalizedFilePath.startsWith(normalizedUploadsDir)) {
      console.error('❌ Security violation: Path traversal attempt');
      console.error('   Normalized file path:', normalizedFilePath);
      console.error('   Normalized base dir:', normalizedUploadsDir);
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('❌ File not found:', filePath);
      
      // Try to find similar files (helpful for debugging)
      const dir = path.dirname(filePath);
      const requestedFilename = path.basename(filePath);
      
      console.log('   Looking in directory:', dir);
      
      if (fs.existsSync(dir)) {
        const filesInDir = fs.readdirSync(dir);
        console.log('   Files in directory:', filesInDir);
        
        // Try to find file by partial match (ignoring timestamp)
        const filenameWithoutTimestamp = requestedFilename.replace(/^\d+_/, '');
        console.log('   Looking for filename containing:', filenameWithoutTimestamp);
        
        const matchingFile = filesInDir.find(f => f.includes(filenameWithoutTimestamp));
        
        if (matchingFile) {
          console.log('   ✅ Found matching file:', matchingFile);
          const matchedPath = path.join(dir, matchingFile);
          
          // Read the matched file
          const fileBuffer = fs.readFileSync(matchedPath);
          const stats = fs.statSync(matchedPath);
          
          const ext = path.extname(matchedPath).toLowerCase();
          const mimeType = getMimeType(ext);
          
          console.log('   Serving matched file:', matchingFile);
          console.log('   Size:', stats.size, 'bytes');
          console.log('   MIME:', mimeType);
          
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': mimeType,
              'Content-Length': stats.size.toString(),
              'Content-Disposition': `inline; filename="${matchingFile}"`,
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        }
      }
      
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    
    console.log('   ✅ File found:', stats.size, 'bytes');
    
    // Determine MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = getMimeType(ext);
    
    console.log('   MIME type:', mimeType);
    console.log('=== END ATTACHMENT REQUEST ===\n');
    
    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': stats.size.toString(),
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
    
  } catch (error) {
    console.error('❌ Error serving attachment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to serve attachment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.wav': 'audio/wav',
    '.avi': 'video/x-msvideo',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}