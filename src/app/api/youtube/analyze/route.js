import { NextResponse } from 'next/server';

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Function to validate YouTube URL
function isValidYouTubeUrl(url) {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
}

export async function POST(request) {
  try {
    const { youtubeUrl } = await request.json();
    
    if (!youtubeUrl) {
      return NextResponse.json(
        { success: false, error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(youtubeUrl);
    
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Could not extract video ID from URL' },
        { status: 400 }
      );
    }

    // Use real YouTube Data API v3
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'YouTube API key not configured' },
        { status: 500 }
      );
    }
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,statistics,contentDetails`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Video not found' },
          { status: 404 }
        );
      }
      
      const video = data.items[0];
      const videoData = {
        videoId: video.id,
        title: video.snippet.title,
        views: parseInt(video.statistics.viewCount) || 0,
        thumbnail: video.snippet.thumbnails.default?.url || `https://img.youtube.com/vi/${video.id}/default.jpg`,
        duration: video.contentDetails.duration,
        publishedAt: video.snippet.publishedAt,
        channelTitle: video.snippet.channelTitle,
        description: video.snippet.description
      };
      
      return NextResponse.json({
        success: true,
        video: videoData,
        message: 'Video analyzed successfully'
      });
    } catch (apiError) {
      console.error('YouTube API error:', apiError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch video data from YouTube' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error analyzing YouTube video:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze video' },
      { status: 500 }
    );
  }
}
