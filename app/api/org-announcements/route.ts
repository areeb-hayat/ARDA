// app/api/org-announcements/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import OrgAnnouncement from '@/models/OrgAnnouncement';
import { saveAnnouncementAttachment, deleteAnnouncementAttachment, getAnnouncementAttachmentUrl } from '@/app/utils/fileUpload';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userDepartment = searchParams.get('department') || '';
    
    console.log('=== ORG ANNOUNCEMENTS GET REQUEST ===');
    console.log('Raw department parameter:', searchParams.get('department'));
    console.log('User department:', userDepartment);
    
    // Check if user is HR - normalize to uppercase for comparison
    const isHR = userDepartment.toUpperCase() === 'HR';
    
    const currentDate = new Date();
    
    // Build query based on user department
    let query: any = {
      isDeleted: { $ne: true },
      $or: [
        { expirationDate: null },
        { expirationDate: { $gte: currentDate } }
      ]
    };

    // Filter announcements based on department
    if (isHR) {
      // HR sees all announcements (no targetAudience filter)
      console.log('✓ HR user - showing all announcements');
    } else if (userDepartment && userDepartment.trim() !== '') {
      // Non-HR users with a department see: organization-wide + their department specific
      query.targetAudience = {
        $in: ['organization', userDepartment]
      };
      console.log(`✓ Department user (${userDepartment}) - filtering by:`, query.targetAudience);
    } else {
      // Users without department only see organization-wide
      query.targetAudience = 'organization';
      console.log('✓ User without department - showing only organization-wide');
    }

    console.log('MongoDB Query:', JSON.stringify(query, null, 2));

    const announcements = await OrgAnnouncement.find(query)
      .select('title content author createdAt pinned edited expirationDate borderColor attachments targetAudience')
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    console.log(`✓ Found ${announcements.length} announcements`);
    if (announcements.length > 0) {
      console.log('Announcements targetAudience values:');
      announcements.forEach((ann, idx) => {
        console.log(`  ${idx + 1}. "${ann.title}" -> targetAudience: "${ann.targetAudience}"`);
      });
    }
    console.log('=== END ORG ANNOUNCEMENTS REQUEST ===\n');

    // Convert file paths to URLs for attachments
    const announcementsWithUrls = announcements.map(announcement => ({
      ...announcement,
      attachments: announcement.attachments?.map((att: any) => ({
        ...att,
        url: getAnnouncementAttachmentUrl(att.url)
      }))
    }));

    return NextResponse.json({ 
      success: true, 
      announcements: announcementsWithUrls
    });
  } catch (error) {
    console.error('Error fetching org announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch org announcements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { title, content, author, expirationDate, borderColor, attachments, targetAudience } = body;

    if (!title || !content || !author) {
      return NextResponse.json(
        { error: 'Title, content, and author are required' },
        { status: 400 }
      );
    }

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
          // Use "organization" as the department name for org announcements
          const savedFile = saveAnnouncementAttachment('organization', {
            name: attachment.name,
            data: attachment.url, // This contains the base64 data
            type: attachment.type === 'image' ? 'image/jpeg' : 'application/pdf',
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

    const newAnnouncement = await OrgAnnouncement.create({
      title,
      content,
      author,
      createdAt: new Date(),
      pinned: false,
      edited: false,
      isDeleted: false,
      expirationDate: expirationDateTime,
      borderColor: borderColor || '#FF0000',
      attachments: savedAttachments,
      targetAudience: targetAudience || 'organization'
    });

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
  } catch (error) {
    console.error('Error creating org announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create org announcement' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    if (updates.title || updates.content) {
      updates.edited = true;
    }

    if (updates.expirationDate) {
      const date = new Date(updates.expirationDate);
      date.setHours(17, 0, 0, 0);
      updates.expirationDate = date;
    }

    // Handle attachments update
    if (updates.attachments !== undefined) {
      // Get the current announcement to compare attachments
      const currentAnnouncement = await OrgAnnouncement.findById(id);
      
      if (currentAnnouncement) {
        // Find attachments that were removed
        const currentAttachmentUrls = currentAnnouncement.attachments?.map((att: any) => att.url) || [];
        const newAttachmentUrls = updates.attachments.map((att: any) => att.url || att.path);
        
        // Delete removed attachments from file system
        for (const oldUrl of currentAttachmentUrls) {
          if (!newAttachmentUrls.includes(oldUrl)) {
            deleteAnnouncementAttachment(oldUrl);
          }
        }

        // Process new attachments that need to be saved
        const processedAttachments = [];
        for (const attachment of updates.attachments) {
          // If attachment has a path already (existing attachment), keep it as is
          if (attachment.url && !attachment.url.startsWith('data:')) {
            processedAttachments.push(attachment);
          } else {
            // New attachment that needs to be saved
            try {
              const savedFile = saveAnnouncementAttachment('organization', {
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

        updates.attachments = processedAttachments;
      }
      
      updates.edited = true;
    }

    const updatedAnnouncement = await OrgAnnouncement.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!updatedAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    // Convert file paths to URLs for the response
    const responseAnnouncement = {
      ...updatedAnnouncement.toObject(),
      attachments: updatedAnnouncement.attachments?.map((att: any) => ({
        ...att,
        url: getAnnouncementAttachmentUrl(att.url)
      }))
    };

    return NextResponse.json({ 
      success: true, 
      announcement: responseAnnouncement
    });
  } catch (error) {
    console.error('Error updating org announcement:', error);
    return NextResponse.json(
      { error: 'Failed to update org announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    // Get the announcement to delete attachments
    const announcement = await OrgAnnouncement.findById(id);
    
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

    const deletedAnnouncement = await OrgAnnouncement.findByIdAndUpdate(
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
  } catch (error) {
    console.error('Error deleting org announcement:', error);
    return NextResponse.json(
      { error: 'Failed to delete org announcement' },
      { status: 500 }
    );
  }
}