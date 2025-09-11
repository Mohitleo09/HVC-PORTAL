import { NextResponse } from 'next/server';
import DBConnection from '../../utils/config/db';
import Trend from '../../utils/models/Trend';
import { MONGODB_URI } from '../../utils/config/environment.js';

// GET all trends
export async function GET() {
  try {
    if (MONGODB_URI) {
      await DBConnection();
      const trends = await Trend.find({}).sort({ createdAt: -1 });
      return NextResponse.json({ trends });
    } else {
      return NextResponse.json({ trends: [] });
    }
  } catch (error) {
    console.error('Error fetching trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}

// POST new trend
export async function POST(request) {
  try {
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

    const newTrend = new Trend({
      topic,
      views: views || 0,
      youtubeLink: youtubeLink || '',
      status: status || 'Active'
    });

    const savedTrend = await newTrend.save();
    return NextResponse.json({ trend: savedTrend });
  } catch (error) {
    console.error('Error creating trend:', error);
    return NextResponse.json(
      { error: 'Failed to create trend' },
      { status: 500 }
    );
  }
}
