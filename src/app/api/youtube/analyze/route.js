// import { NextResponse } from 'next/server';

// // Function to extract video ID from YouTube URL
// function extractVideoId(url) {
//   // More comprehensive regex patterns for different YouTube URL formats
//   const patterns = [
//     /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^#&?]*)/,
//     /youtube\.com\/watch\?.*v=([^#&?]*)/,
//     /youtu\.be\/([^#&?]*)/,
//     /youtube\.com\/embed\/([^#&?]*)/,
//     /youtube\.com\/v\/([^#&?]*)/,
//     /youtube\.com\/shorts\/([^#&?]*)/
//   ];
  
//   for (const pattern of patterns) {
//     const match = url.match(pattern);
//     if (match && match[1] && match[1].length === 11) {
//       return match[1];
//     }
//   }
  
//   return null;
// }

// // Function to validate YouTube URL
// function isValidYouTubeUrl(url) {
//   // More flexible YouTube URL validation
//   const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
//   return youtubeRegex.test(url);
// }

// export async function POST(request) {
//   try {
//     const { youtubeUrl } = await request.json();
    
//     if (!youtubeUrl) {
//       return NextResponse.json(
//         { success: false, error: 'YouTube URL is required' },
//         { status: 400 }
//       );
//     }

//     if (!isValidYouTubeUrl(youtubeUrl)) {
//       return NextResponse.json(
//         { success: false, error: 'Invalid YouTube URL. Please use a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)' },
//         { status: 400 }
//       );
//     }

//     const videoId = extractVideoId(youtubeUrl);
    
//     if (!videoId) {
//       return NextResponse.json(
//         { success: false, error: 'Could not extract video ID from URL. Please check the URL format' },
//         { status: 400 }
//       );
//     }

//     // Use real YouTube Data API v3
//     const apiKey = process.env.YOUTUBE_API_KEY;
//     export async function getVideos(query) {
//     const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}&maxResults=10`;
//     const res = await fetch(url);
//     return res.json();
    
//     try {
//       const response = await fetch(
//         `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,statistics,contentDetails`
//       );
      
//       if (!response.ok) {
//         throw new Error(`YouTube API error: ${response.status}`);
//       }
      
//       const data = await response.json();
      
//       if (!data.items || data.items.length === 0) {
//         return NextResponse.json(
//           { success: false, error: 'Video not found' },
//           { status: 404 }
//         );
//       }
      
//       const video = data.items[0];
//       const videoData = {
//         videoId: video.id,
//         title: video.snippet.title,
//         views: parseInt(video.statistics.viewCount) || 0,
//         thumbnail: video.snippet.thumbnails.default?.url || `https://img.youtube.com/vi/${video.id}/default.jpg`,
//         duration: video.contentDetails.duration,
//         publishedAt: video.snippet.publishedAt,
//         channelTitle: video.snippet.channelTitle,
//         description: video.snippet.description
//       };
      
//       return NextResponse.json({
//         success: true,
//         video: videoData,
//         message: 'Video analyzed successfully'
//       });
//     } catch (apiError) {
//       console.error('YouTube API error:', apiError);
//       return NextResponse.json(
//         { success: false, error: 'Failed to fetch video data from YouTube' },
//         { status: 500 }
//       );
//     }

//   } catch (error) {
//     console.error('Error analyzing YouTube video:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to analyze video' },
//       { status: 500 }
//     );
//   }
// }


















import { NextResponse } from "next/server";

// Function to extract video ID from YouTube URL
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^#&?]*)/,
    /youtube\.com\/watch\?.*v=([^#&?]*)/,
    /youtu\.be\/([^#&?]*)/,
    /youtube\.com\/embed\/([^#&?]*)/,
    /youtube\.com\/v\/([^#&?]*)/,
    /youtube\.com\/shorts\/([^#&?]*)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }
  return null;
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
        { success: false, error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid YouTube URL. Please use a valid YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)",
        },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(youtubeUrl);

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not extract video ID from URL. Please check the URL format",
        },
        { status: 400 }
      );
    }

    // YouTube API key
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "YouTube API key not configured" },
        { status: 500 }
      );
    }

    // Fetch video details
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,statistics,contentDetails`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 }
      );
    }

    const video = data.items[0];
    const videoData = {
      videoId: video.id,
      title: video.snippet.title,
      views: parseInt(video.statistics.viewCount) || 0,
      thumbnail:
        video.snippet.thumbnails.default?.url ||
        `https://img.youtube.com/vi/${video.id}/default.jpg`,
      duration: video.contentDetails.duration,
      publishedAt: video.snippet.publishedAt,
      channelTitle: video.snippet.channelTitle,
      description: video.snippet.description,
    };

    return NextResponse.json({
      success: true,
      video: videoData,
      message: "Video analyzed successfully",
    });
  } catch (error) {
    console.error("Error analyzing YouTube video:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze video" },
      { status: 500 }
    );
  }
}

