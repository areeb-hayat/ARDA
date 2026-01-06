// app/api/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
    }

    // Security: ensure file is within uploads directory
    const UPLOAD_BASE = 'D:\\ARDA\\uploads\\projects';
    const normalizedPath = path.normalize(filePath);
    
    if (!normalizedPath.startsWith(UPLOAD_BASE)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 403 });
    }

    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = fs.readFileSync(normalizedPath);
    const filename = path.basename(normalizedPath).split('_').slice(1).join('_') || 'download';
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': file.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}