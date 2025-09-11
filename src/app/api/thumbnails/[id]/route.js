import { NextResponse } from 'next/server';
import DBConnection from '../../../utils/config/db';
import Thumbnail from '../../../utils/models/Thumbnail';
import ThumbnailActivity from '../../../utils/models/ThumbnailActivity';

// DELETE - Delete a specific thumbnail
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Thumbnail ID is required' },
        { status: 400 }
      );
    }

    try {
      // Use the standard database connection
      await DBConnection();
      console.log('✅ Thumbnail database connection successful for DELETE');
    } catch (dbError) {
      console.error('❌ Thumbnail database connection failed for DELETE:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection failed for thumbnails' },
        { status: 500 }
      );
    }

    // Get thumbnail details before deletion for activity tracking
    const thumbnailToDelete = await Thumbnail.findById(id);
    
    if (!thumbnailToDelete) {
      return NextResponse.json(
        { success: false, message: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    const deletedThumbnail = await Thumbnail.findByIdAndDelete(id);
    
    console.log('🗑️ Thumbnail deleted successfully:', id);

    // Track thumbnail deletion activity
    try {
      const thumbnailActivity = new ThumbnailActivity({
        userId: thumbnailToDelete.doctor?.toString() || 'unknown',
        username: thumbnailToDelete.doctor?.toString() || 'unknown',
        thumbnailId: id,
        doctorName: thumbnailToDelete.doctor?.toString() || 'unknown',
        action: 'thumbnail_delete',
        details: {
          page: 'thumbnail_management',
          notes: `Deleted thumbnail for ${thumbnailToDelete.language} language`,
          thumbnailData: {
            language: thumbnailToDelete.language,
            department: thumbnailToDelete.department?.toString(),
            doctor: thumbnailToDelete.doctor?.toString(),
            fileSize: thumbnailToDelete.fileSize,
            fileType: thumbnailToDelete.mimeType,
            originalFileName: thumbnailToDelete.originalFileName,
            timestamp: new Date().toISOString()
          }
        },
        language: thumbnailToDelete.language,
        department: thumbnailToDelete.department?.toString(),
        fileSize: thumbnailToDelete.fileSize,
        fileType: thumbnailToDelete.mimeType,
        originalFileName: thumbnailToDelete.originalFileName,
        status: 'success'
      });
      
      await thumbnailActivity.save();
      console.log('✅ Thumbnail deletion activity tracked');
    } catch (activityError) {
      console.error('❌ Failed to track thumbnail deletion activity:', activityError);
      // Don't fail the main operation if activity tracking fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Thumbnail deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting thumbnail:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete thumbnail' },
      { status: 500 }
    );
  }
}

// PATCH - Update a specific thumbnail
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Thumbnail ID is required' },
        { status: 400 }
      );
    }

    try {
      // Use the standard database connection
      await DBConnection();
      console.log('✅ Thumbnail database connection successful for PATCH');
    } catch (dbError) {
      console.error('❌ Thumbnail database connection failed for PATCH:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection failed for thumbnails' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const department = formData.get('department');
    const doctor = formData.get('doctor');
    const topic = formData.get('topic');
    const language = formData.get('language');
    const thumbnail = formData.get('thumbnail');

    console.log('📋 Received edit form data:', { 
      id,
      department, 
      doctor, 
      topic,
      language,
      hasNewThumbnail: !!thumbnail
    });

    // Validate required fields
    if (!department || !doctor || !language) {
      console.error('❌ Missing required fields in edit form:', { 
        department: !!department, 
        doctor: !!doctor, 
        language: !!language
      });
      return NextResponse.json(
        { success: false, message: 'Department, doctor, and language are required' },
        { status: 400 }
      );
    }

    // Find the existing thumbnail
    const existingThumbnail = await Thumbnail.findById(id);
    if (!existingThumbnail) {
      return NextResponse.json(
        { success: false, message: 'Thumbnail not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      department,
      doctor,
      topic: topic || '', // Include topic field, default to empty string if not provided
      language
    };

    // If a new thumbnail is provided, convert it to base64 and update
    if (thumbnail) {
      console.log('🔄 Converting new thumbnail to base64...');
      
      // Validate file type
      if (!thumbnail.type.startsWith('image/')) {
        console.error('❌ Invalid file type:', thumbnail.type);
        return NextResponse.json(
          { success: false, message: 'Only image files are allowed' },
          { status: 400 }
        );
      }

      const arrayBuffer = await thumbnail.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = `data:${thumbnail.type};base64,${buffer.toString('base64')}`;
      
      updateData.thumbnailUrl = base64Data;
      updateData.originalFileName = thumbnail.name;
      updateData.fileSize = thumbnail.size;
      updateData.mimeType = thumbnail.type;
      
      console.log('✅ New thumbnail converted to base64, size:', buffer.length, 'bytes');
    }

    // Update the thumbnail
    console.log('💾 Updating thumbnail in database...');
    const updatedThumbnail = await Thumbnail.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedThumbnail) {
      throw new Error('Failed to update thumbnail');
    }

    console.log('✅ Thumbnail updated successfully with ID:', updatedThumbnail._id);

    // Track thumbnail update activity
    try {
      const thumbnailActivity = new ThumbnailActivity({
        userId: doctor,
        username: doctor,
        thumbnailId: id,
        doctorName: doctor,
        action: 'thumbnail_update',
        details: {
          page: 'thumbnail_management',
          notes: `Updated thumbnail for ${language} language`,
          thumbnailData: {
            language: language,
            department: department,
            doctor: doctor,
            fileSize: thumbnail ? thumbnail.size : existingThumbnail.fileSize,
            fileType: thumbnail ? thumbnail.type : existingThumbnail.mimeType,
            originalFileName: thumbnail ? thumbnail.name : existingThumbnail.originalFileName,
            timestamp: new Date().toISOString()
          },
          changes: {
            department: existingThumbnail.department?.toString() !== department,
            doctor: existingThumbnail.doctor?.toString() !== doctor,
            topic: existingThumbnail.topic !== (topic || ''),
            language: existingThumbnail.language !== language,
            thumbnail: !!thumbnail
          }
        },
        language: language,
        department: department,
        fileSize: thumbnail ? thumbnail.size : existingThumbnail.fileSize,
        fileType: thumbnail ? thumbnail.type : existingThumbnail.mimeType,
        originalFileName: thumbnail ? thumbnail.name : existingThumbnail.originalFileName,
        previousValues: {
          department: existingThumbnail.department?.toString(),
          doctor: existingThumbnail.doctor?.toString(),
          topic: existingThumbnail.topic,
          language: existingThumbnail.language,
          fileSize: existingThumbnail.fileSize,
          fileType: existingThumbnail.mimeType,
          originalFileName: existingThumbnail.originalFileName
        },
        newValues: {
          department: department,
          doctor: doctor,
          topic: topic || '',
          language: language,
          fileSize: thumbnail ? thumbnail.size : existingThumbnail.fileSize,
          fileType: thumbnail ? thumbnail.type : existingThumbnail.mimeType,
          originalFileName: thumbnail ? thumbnail.name : existingThumbnail.originalFileName
        },
        status: 'success'
      });
      
      await thumbnailActivity.save();
      console.log('✅ Thumbnail update activity tracked');
    } catch (activityError) {
      console.error('❌ Failed to track thumbnail update activity:', activityError);
      // Don't fail the main operation if activity tracking fails
    }

    // Populate the response
    const populatedThumbnail = await Thumbnail.findById(updatedThumbnail._id)
      .populate('department', 'name')
      .populate('doctor', 'name');

    const formattedThumbnail = {
      _id: populatedThumbnail._id,
      thumbnailUrl: populatedThumbnail.thumbnailUrl,
      department: populatedThumbnail.department?._id,
      departmentName: populatedThumbnail.department?.name,
      doctor: populatedThumbnail.doctor?._id,
      doctorName: populatedThumbnail.doctor?.name,
      language: populatedThumbnail.language,
      topic: populatedThumbnail.topic, // Include topic in response
      createdAt: populatedThumbnail.createdAt,
      updatedAt: populatedThumbnail.updatedAt
    };

    console.log('🎉 Thumbnail update completed successfully:', {
      id: formattedThumbnail._id,
      departmentName: formattedThumbnail.departmentName,
      doctorName: formattedThumbnail.doctorName,
      hasNewImage: !!thumbnail
    });

    return NextResponse.json({
      success: true,
      message: 'Thumbnail updated successfully',
      thumbnail: formattedThumbnail
    });
  } catch (error) {
    console.error('❌ Error updating thumbnail:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { success: false, message: `Failed to update thumbnail: ${error.message}` },
      { status: 500 }
    );
  }
}
