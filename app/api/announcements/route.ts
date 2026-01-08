// app/api/announcements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import Announcement from '@/models/Announcement';
import { saveAnnouncementAttachment, deleteAnnouncementAttachment, getAnnouncementAttachmentUrl } from '@/app/utils/fileUpload';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get('department');

    if (!department) {
      return NextResponse.json(
        { error: 'Department parameter is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const now = new Date();

    // Uses compound index: { isDeleted: 1, department: 1, createdAt: -1 }
    const allAnnouncements = await Announcement.find({
      department,
      isDeleted: { $ne: true }
    })
    .sort({ pinned: -1, urgent: -1, createdAt: -1 })
    .lean();

    // Filter out expired announcements in-memory
    const activeAnnouncements = allAnnouncements.filter(announcement => {
      if (!announcement.expirationDate) return true;
      
      const expirationDate = new Date(announcement.expirationDate);
      return now < expirationDate;
    });

    // Convert file paths to URLs for attachments
    const announcementsWithUrls = activeAnnouncements.map(announcement => ({
      ...announcement,
      attachments: announcement.attachments?.map((att: any) => ({
        ...att,
        url: getAnnouncementAttachmentUrl(att.url) // Convert file path to URL
      }))
    }));

    return NextResponse.json({
      success: true,
      announcements: announcementsWithUrls
    });

  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 Received POST body:', JSON.stringify(body, null, 2));
    
    const { department, title, content, color, expirationDate, attachments } = body;

    if (!department || !title || !content) {
      console.error('❌ Validation failed:', { department, title, content });
      return NextResponse.json(
        { error: 'Department, title, and content are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let expirationDateTime = null;
    if (expirationDate) {
      const date = new Date(expirationDate);
      date.setHours(17, 0, 0, 0);
      expirationDateTime = date;
    }

    // Process attachments - save files and store paths
    const savedAttachments = [];
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          // Save the file using the fileUpload utility
          const savedFile = saveAnnouncementAttachment(department, {
            name: attachment.name,
            data: attachment.url, // This contains the base64 data
            type: attachment.type === 'image' ? 'image/jpeg' : 'application/pdf', // You may need to pass actual mime type
            size: attachment.size
          });

          savedAttachments.push({
            name: savedFile.name,
            url: savedFile.path, // Store the file system path in DB
            type: savedFile.type,
            size: savedFile.size,
            uploadedAt: new Date()
          });
        } catch (error) {
          console.error('Error saving attachment:', error);
          // Continue with other attachments
        }
      }
    }

    const announcementData = {
      department,
      title,
      content,
      color: color || '#0000FF',
      expirationDate: expirationDateTime,
      attachments: savedAttachments,
    };

    console.log('📝 Creating announcement with data:', JSON.stringify(announcementData, null, 2));

    const newAnnouncement = await Announcement.create(announcementData);

    console.log('✅ Announcement created successfully:', newAnnouncement._id);

    // Convert file paths to URLs for the response
    const responseAnnouncement = {
      ...newAnnouncement.toObject(),
      attachments: newAnnouncement.attachments?.map((att: any) => ({
        ...att,
        url: getAnnouncementAttachmentUrl(att.url)
      }))
    };

    return NextResponse.json({
      success: true,
      announcement: responseAnnouncement
    });

  } catch (error: any) {
    console.error('❌ Error creating announcement:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to create announcement', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, pinned, urgent, expirationDate, isDeleted, attachments } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const updateFields: any = {};

    if (title !== undefined) {
      updateFields.title = title;
      updateFields.edited = true;
    }
    if (content !== undefined) {
      updateFields.content = content;
      updateFields.edited = true;
    }
    if (attachments !== undefined) {
      // Get the current announcement to compare attachments
      const currentAnnouncement = await Announcement.findById(id);
      
      if (currentAnnouncement) {
        // Find attachments that were removed
        const currentAttachmentUrls = currentAnnouncement.attachments?.map((att: any) => att.url) || [];
        const newAttachmentUrls = attachments.map((att: any) => att.url || att.path);
        
        // Delete removed attachments from file system
        for (const oldUrl of currentAttachmentUrls) {
          if (!newAttachmentUrls.includes(oldUrl)) {
            deleteAnnouncementAttachment(oldUrl);
          }
        }

        // Process new attachments that need to be saved
        const processedAttachments = [];
        for (const attachment of attachments) {
          // If attachment has a path already (existing attachment), keep it as is
          if (attachment.url && !attachment.url.startsWith('data:')) {
            processedAttachments.push(attachment);
          } else {
            // New attachment that needs to be saved
            try {
              const savedFile = saveAnnouncementAttachment(currentAnnouncement.department, {
                name: attachment.name,
                data: attachment.url,
                type: attachment.type === 'image' ? 'image/jpeg' : 'application/pdf',
                size: attachment.size
              });

              processedAttachments.push({
                name: savedFile.name,
                url: savedFile.path,
                type: savedFile.type,
                size: savedFile.size,
                uploadedAt: new Date()
              });
            } catch (error) {
              console.error('Error saving attachment during update:', error);
            }
          }
        }

        updateFields.attachments = processedAttachments;
      }
      
      updateFields.edited = true;
    }
    if (pinned !== undefined) {
      updateFields.pinned = pinned;
    }
    if (urgent !== undefined) {
      updateFields.urgent = urgent;
      if (urgent) {
        updateFields.pinned = true;
      }
    }
    if (isDeleted !== undefined) {
      updateFields.isDeleted = isDeleted;
      if (isDeleted) {
        updateFields.deletedAt = new Date();
        
        // Delete all attachments when announcement is deleted
        const announcement = await Announcement.findById(id);
        if (announcement && announcement.attachments) {
          for (const attachment of announcement.attachments) {
            deleteAnnouncementAttachment(attachment.url);
          }
        }
      }
    }
    if (expirationDate !== undefined) {
      if (expirationDate) {
        const date = new Date(expirationDate);
        date.setHours(17, 0, 0, 0);
        updateFields.expirationDate = date;
      } else {
        updateFields.expirationDate = null;
      }
    }

    const result = await Announcement.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Convert file paths to URLs for the response
    const responseAnnouncement = {
      ...result.toObject(),
      attachments: result.attachments?.map((att: any) => ({
        ...att,
        url: getAnnouncementAttachmentUrl(att.url)
      }))
    };

    return NextResponse.json({
      success: true,
      message: 'Announcement updated successfully',
      announcement: responseAnnouncement
    });

  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get the announcement to delete attachments
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Delete all attachments from file system
    if (announcement.attachments && announcement.attachments.length > 0) {
      for (const attachment of announcement.attachments) {
        deleteAnnouncementAttachment(attachment.url);
      }
    }

    // Soft delete by setting isDeleted flag
    const result = await Announcement.findByIdAndUpdate(
      id,
      { 
        $set: { 
          isDeleted: true,
          deletedAt: new Date()
        }
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement', details: error.message },
      { status: 500 }
    );
  }
}