import { NextResponse } from "next/server";
import { auth } from "@/auth";
import axios from "axios";
import { addDriveFile } from "@/data/driveStore";
import { invalidateYouTubeUploadsCache } from "@/lib/youtubeSyncService";

// Helper to extract YouTube video ID from various URL formats
function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=ID or /embed/ID or /v/ID
  const standardMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (standardMatch) return standardMatch[1];

  return null;
}

// Convert ISO 8601 duration (e.g. PT1H20M45S) to human readable (1:20:45) and seconds
function parseIsoDuration(duration: string): { formatted: string; seconds: number } {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { formatted: "12:00", seconds: 720 };

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  let formatted = "";
  if (hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return { formatted, seconds: totalSeconds };
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required to import videos." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { url, folderId, privacy = "unlisted", customName, tags } = body;

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL or Video ID. Please provide a valid link." },
        { status: 400 }
      );
    }

    let title = customName || `YouTube_Import_${videoId}.mp4`;
    let duration = "15:30";
    let durationSeconds = 930;
    let thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    let description = "Imported from YouTube to Cloud Drive.";
    let tagsList = tags || ["YouTube", "Cloud Import"];

    const apiKey = process.env.NEXT_YOUTUBE_API_KEY;

    if (apiKey) {
      try {
        const ytRes = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
        );

        if (ytRes.data?.items && ytRes.data.items.length > 0) {
          const item = ytRes.data.items[0];
          const snippet = item.snippet;
          const contentDetails = item.contentDetails;

          if (snippet?.title && !customName) {
            title = `${snippet.title.replace(/[\\/:*?"<>|]/g, "_")}.mp4`;
          }
          if (snippet?.description) {
            description = snippet.description.slice(0, 300);
          }
          if (snippet?.thumbnails) {
            thumbnailUrl =
              snippet.thumbnails.maxres?.url ||
              snippet.thumbnails.high?.url ||
              snippet.thumbnails.medium?.url ||
              thumbnailUrl;
          }
          if (snippet?.tags && Array.isArray(snippet.tags)) {
            tagsList = snippet.tags.slice(0, 5);
          }
          if (contentDetails?.duration) {
            const parsed = parseIsoDuration(contentDetails.duration);
            duration = parsed.formatted;
            durationSeconds = parsed.seconds;
          }
        }
      } catch (err) {
        console.warn("Could not query YouTube API directly, using fallback metadata:", err);
      }
    }

    // Realistic file size estimate based on duration (approx 25MB per minute in 1080p)
    const estimatedSizeBytes = Math.max(
      45000000,
      Math.floor(durationSeconds * (25 * 1024 * 1024 / 60))
    );

    const newDriveFile = await addDriveFile(userId, {
      name: title,
      videoId,
      youtubeUrl: `https://youtu.be/${videoId}`,
      size: estimatedSizeBytes,
      duration,
      durationSeconds,
      resolution: "1080p 60fps",
      mimeType: "video/mp4",
      thumbnailUrl,
      folderId: folderId && folderId !== "root" && folderId !== "null" ? folderId : null,
      privacy: privacy as "unlisted" | "private" | "public",
      tags: tagsList,
      description,
    });

    invalidateYouTubeUploadsCache(userId);

    return NextResponse.json({
      success: true,
      file: newDriveFile,
      message: "Video saved to YouTube Cloud Drive successfully!",
    });
  } catch (err: unknown) {
    console.error("Error importing from YouTube:", err);
    return NextResponse.json({ error: "Failed to import video to Drive" }, { status: 500 });
  }
}
