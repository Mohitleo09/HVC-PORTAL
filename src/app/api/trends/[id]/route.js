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
    const { title, description, category, tags } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Title, description, and category are required' },
        { status: 400 }
      );
    }

    const updatedTrend = await Trend.findByIdAndUpdate(
      id,
      { title, description, category, tags: tags || [] },
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

    if (!MONGODB_URI) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    await DBConnection();
    const deletedTrend = await Trend.findByIdAndDelete(id);

    if (!deletedTrend) {
      return NextResponse.json(
        { error: 'Trend not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Trend deleted successfully' });
  } catch (error) {
    console.error('Error deleting trend:', error);
    return NextResponse.json(
      { error: 'Failed to delete trend' },
      { status: 500 }
    );
  }
} 