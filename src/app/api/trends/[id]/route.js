import { NextResponse } from 'next/server';
import DBConnection from '../../../utils/config/db';
import Trend from '../../../utils/models/Trend';
import { MONGODB_URI } from '../../../utils/config/environment.js';

// GET trend by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    await DBConnection();
    const trend = await Trend.findById(id);

    if (!trend) {
      return NextResponse.json(
        { error: 'Trend not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ trend });
  } catch (error) {
    console.error('Error fetching trend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend' },
      { status: 500 }
    );
  }
}

// PUT update trend
export async function PUT(request, { params }) {
  try {
    const { id } = params;

    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    await DBConnection();
    const body = await request.json();
    const { topic, views, youtubeLink, status } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const updatedTrend = await Trend.findByIdAndUpdate(
      id,
      { topic, views: views || 0, youtubeLink: youtubeLink || '', status: status || 'Active' },
      { new: true, runValidators: true }
    );

    if (!updatedTrend) {
      return NextResponse.json(
        { error: 'Trend not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ trend: updatedTrend });
  } catch (error) {
    console.error('Error updating trend:', error);
    return NextResponse.json(
      { error: 'Failed to update trend' },
      { status: 500 }
    );
  }
}

// DELETE trend
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    console.log('🗑️ DELETE request for trend ID:', id);

    if (!MONGODB_URI) {
      console.error('❌ Database not configured');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    await DBConnection();
    
    // First check if the trend exists
    const existingTrend = await Trend.findById(id);
    console.log('🔍 Existing trend:', existingTrend ? 'Found' : 'Not found');
    
    if (!existingTrend) {
      console.error('❌ Trend not found with ID:', id);
      return NextResponse.json(
        { error: 'Trend not found', id: id },
        { status: 404 }
      );
    }

    const deletedTrend = await Trend.findByIdAndDelete(id);
    console.log('✅ Trend deleted successfully:', deletedTrend ? 'Yes' : 'No');

    if (!deletedTrend) {
      console.error('❌ Failed to delete trend with ID:', id);
      return NextResponse.json(
        { error: 'Failed to delete trend', id: id },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Trend deleted successfully',
      deletedTrend: {
        id: deletedTrend._id,
        topic: deletedTrend.topic
      }
    });
  } catch (error) {
    console.error('❌ Error deleting trend:', error);
    return NextResponse.json(
      { error: 'Failed to delete trend', details: error.message },
      { status: 500 }
    );
  }
} 