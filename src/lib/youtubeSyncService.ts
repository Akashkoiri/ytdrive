import axios from "axios";

export interface YouTubeVideoResource {
  id: string;
  snippet: {
    title: string;
    description?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    tags?: string[];
    categoryId?: string;
    thumbnails: {
      default?: { url: string; width?: number; height?: number };
      medium?: { url: string; width?: number; height?: number };
      high?: { url: string; width?: number; height?: number };
      standard?: { url: string; width?: number; height?: number };
      maxres?: { url: string; width?: number; height?: number };
    };
  };
  contentDetails?: {
    duration?: string;
    definition?: string; // "hd" | "sd"
  };
  status?: {
    privacyStatus?: "unlisted" | "private" | "public";
    uploadStatus?: string;
    license?: string;
    embeddable?: boolean;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

// In-memory cache for user's uploads to prevent exceeding the 10,000 units/day quota
interface UploadsCacheEntry {
  timestamp: number;
  videos: YouTubeVideoResource[];
  hasChannel?: boolean;
}

const globalForSync = globalThis as unknown as {
  ytUploadsCache?: Map<string, UploadsCacheEntry>;
  ytChannelStatusCache?: Map<string, { timestamp: number; hasChannel: boolean }>;
};
const uploadsCache =
  globalForSync.ytUploadsCache || new Map<string, UploadsCacheEntry>();
globalForSync.ytUploadsCache = uploadsCache;

const channelStatusCache =
  globalForSync.ytChannelStatusCache ||
  new Map<string, { timestamp: number; hasChannel: boolean }>();
globalForSync.ytChannelStatusCache = channelStatusCache;

const UPLOADS_CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Returns the last known YouTube channel existence status for a user (true unless explicitly confirmed missing).
 */
export function getCachedYouTubeChannelStatus(userId: string): boolean {
  const entry = channelStatusCache.get(userId);
  return entry ? entry.hasChannel : true;
}

/**
 * Invalidate cached channel uploads for a specific user (e.g. after upload, rename, privacy change, delete).
 */
export function invalidateYouTubeUploadsCache(userId?: string): void {
  if (userId) {
    uploadsCache.delete(userId);
    channelStatusCache.delete(userId);
  } else {
    uploadsCache.clear();
    channelStatusCache.clear();
  }
}

/**
 * Convert ISO 8601 duration string (e.g. PT1H2M30S) into human readable and total seconds.
 */
export function parseIsoDuration(duration?: string): { formatted: string; seconds: number } {
  if (!duration) return { formatted: "0:00", seconds: 0 };
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { formatted: "0:00", seconds: 0 };

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

/**
 * Estimate video file size based on duration (approx 4.8 Mbps for 1080p HD, 2.4 Mbps for SD).
 */
export function estimateVideoSize(durationSeconds: number, definition = "hd"): number {
  const bytesPerSecond = definition === "hd" ? 600000 : 300000;
  return Math.max(1024 * 1024, durationSeconds * bytesPerSecond);
}

/**
 * Fetch all uploaded videos directly from the user's YouTube Channel using their OAuth access token.
 * Single Source of Truth for the user's personal cloud vault on YouTube.
 */
export async function fetchUserYouTubeUploads(
  userId: string,
  accessToken: string,
  forceRefresh = false
): Promise<YouTubeVideoResource[]> {
  if (!accessToken) return [];

  const now = Date.now();
  const cached = uploadsCache.get(userId);
  if (!forceRefresh && cached && now - cached.timestamp < UPLOADS_CACHE_TTL_MS) {
    return cached.videos;
  }

  try {
    // 1. Get the Channel's "Uploads" playlist ID (costs 1 unit)
    const channelRes = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
      params: {
        part: "contentDetails",
        mine: true,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 10000,
    });

    const channelItem = channelRes.data?.items?.[0];
    const uploadsPlaylistId = channelItem?.contentDetails?.relatedPlaylists?.uploads;

    if (!channelItem) {
      // Confirmed: authenticated Google account has no YouTube channel created yet
      channelStatusCache.set(userId, { timestamp: now, hasChannel: false });
      uploadsCache.set(userId, { timestamp: now, videos: [], hasChannel: false });
      return [];
    }

    channelStatusCache.set(userId, { timestamp: now, hasChannel: true });

    if (!uploadsPlaylistId) {
      uploadsCache.set(userId, { timestamp: now, videos: [], hasChannel: true });
      return [];
    }

    // 2. Fetch recent videos from the Uploads playlist (costs 1 unit)
    const playlistRes = await axios.get("https://www.googleapis.com/youtube/v3/playlistItems", {
      params: {
        part: "snippet,contentDetails,status",
        playlistId: uploadsPlaylistId,
        maxResults: 50,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 10000,
    });

    const playlistItems = playlistRes.data?.items || [];
    const videoIds: string[] = playlistItems
      .map((item: { contentDetails?: { videoId?: string } }) => item.contentDetails?.videoId)
      .filter((id: string | undefined): id is string => Boolean(id));

    if (videoIds.length === 0) {
      uploadsCache.set(userId, { timestamp: now, videos: [] });
      return [];
    }

    // 3. Batch-fetch full video metadata (duration, definition, privacy status) (costs 1 unit)
    const videosRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet,contentDetails,status,statistics",
        id: videoIds.join(","),
        maxResults: 50,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 10000,
    });

    const videos: YouTubeVideoResource[] = videosRes.data?.items || [];

    // Cache the result
    uploadsCache.set(userId, { timestamp: now, videos, hasChannel: true });
    return videos;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const errData = err.response?.data as
        | { error?: { message?: string; errors?: Array<{ reason?: string }> } }
        | undefined;
      const reason = errData?.error?.errors?.[0]?.reason || "";
      const msg = errData?.error?.message || err.message;
      if (
        err.response?.status === 403 &&
        (reason === "youtubeSignupRequired" ||
          reason === "channelNotFound" ||
          msg.includes("youtubeSignupRequired"))
      ) {
        channelStatusCache.set(userId, { timestamp: now, hasChannel: false });
      }
      console.warn("Error fetching user uploads from YouTube API:", errData || err.message);
    } else {
      console.warn("Error fetching user uploads from YouTube API:", err);
    }

    // If fetch failed but we have stale cached data, return that rather than crashing
    if (cached) {
      return cached.videos;
    }
    return [];
  }
}

/**
 * Fetch video metadata for a list of video IDs in batches of up to 50 items.
 */
export async function fetchYouTubeVideosByIds(
  videoIds: string[],
  authOrKey?: { accessToken?: string; apiKey?: string }
): Promise<Map<string, YouTubeVideoResource>> {
  const result = new Map<string, YouTubeVideoResource>();
  const cleanIds = Array.from(new Set(videoIds.filter(Boolean)));
  if (cleanIds.length === 0) return result;

  const apiKey = authOrKey?.apiKey || process.env.NEXT_YOUTUBE_API_KEY;
  const accessToken = authOrKey?.accessToken;

  // Process in chunks of 50 (YouTube API limit per request)
  for (let i = 0; i < cleanIds.length; i += 50) {
    const chunk = cleanIds.slice(i, i + 50);
    try {
      const headers: Record<string, string> = {};
      const params: Record<string, string> = {
        part: "snippet,contentDetails,status,statistics",
        id: chunk.join(","),
        maxResults: "50",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      } else if (apiKey) {
        params.key = apiKey;
      } else {
        break; // No auth or API key available
      }

      const res = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
        params,
        headers,
        timeout: 10000,
      });

      if (res.data?.items) {
        for (const item of res.data.items) {
          result.set(item.id, item);
        }
      }
    } catch (err) {
      console.warn("Could not batch-fetch YouTube videos by IDs:", err);
    }
  }

  return result;
}

/**
 * Update video title, description, or tags directly on YouTube.
 */
export async function updateYouTubeVideoSnippet(
  accessToken: string,
  videoId: string,
  updates: { title?: string; description?: string; tags?: string[]; categoryId?: string }
): Promise<boolean> {
  if (!accessToken || !videoId) return false;

  try {
    // 1. Retrieve current snippet to preserve categoryId and title if not provided
    const getRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: { part: "snippet", id: videoId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const currentItem = getRes.data?.items?.[0];
    if (!currentItem) return false;

    const currentSnippet = currentItem.snippet;
    const body = {
      id: videoId,
      snippet: {
        title: updates.title || currentSnippet.title,
        description: updates.description ?? currentSnippet.description ?? "",
        tags: updates.tags || currentSnippet.tags || [],
        categoryId: updates.categoryId || currentSnippet.categoryId || "22",
      },
    };

    await axios.put("https://www.googleapis.com/youtube/v3/videos", body, {
      params: { part: "snippet" },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    invalidateYouTubeUploadsCache();
    return true;
  } catch (err) {
    console.error("Failed to update video snippet on YouTube:", err);
    return false;
  }
}

/**
 * Update video privacy status directly on YouTube (unlisted, private, public),
 * preserving existing status metadata and keeping embedding enabled.
 */
export async function updateYouTubeVideoPrivacy(
  accessToken: string,
  videoId: string,
  privacy: "unlisted" | "private" | "public"
): Promise<{ success: boolean; error?: string }> {
  if (!accessToken || !videoId) {
    return { success: false, error: "Missing YouTube access token or video ID." };
  }

  try {
    // Read current status so PUT part=status preserves fields like license and selfDeclaredMadeForKids
    const getRes = await axios
      .get("https://www.googleapis.com/youtube/v3/videos", {
        params: { part: "status", id: videoId },
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .catch(() => null);

    const currentStatus = getRes?.data?.items?.[0]?.status as
      | {
          license?: string;
          publicStatsViewable?: boolean;
          selfDeclaredMadeForKids?: boolean;
        }
      | undefined;

    const statusPayload: Record<string, unknown> = {
      privacyStatus: privacy,
      embeddable: true,
      selfDeclaredMadeForKids: currentStatus?.selfDeclaredMadeForKids ?? false,
    };

    if (currentStatus?.license) {
      statusPayload.license = currentStatus.license;
    }
    if (typeof currentStatus?.publicStatsViewable === "boolean") {
      statusPayload.publicStatsViewable = currentStatus.publicStatsViewable;
    }

    const body = {
      id: videoId,
      status: statusPayload,
    };

    await axios.put("https://www.googleapis.com/youtube/v3/videos", body, {
      params: { part: "status" },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    invalidateYouTubeUploadsCache();
    return { success: true };
  } catch (err: unknown) {
    let errorMsg = "Failed to update video visibility on YouTube.";
    if (axios.isAxiosError(err)) {
      const apiMsg = (
        err.response?.data as { error?: { message?: string } } | undefined
      )?.error?.message;
      errorMsg = apiMsg || err.message || errorMsg;
    } else if (err instanceof Error) {
      errorMsg = err.message;
    }
    console.error("Failed to update video privacy on YouTube:", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Permanently delete a video from the user's YouTube Channel.
 */
export async function deleteYouTubeVideo(accessToken: string, videoId: string): Promise<boolean> {
  if (!accessToken || !videoId) return false;

  try {
    await axios.delete("https://www.googleapis.com/youtube/v3/videos", {
      params: { id: videoId },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    invalidateYouTubeUploadsCache();
    return true;
  } catch (err) {
    console.error("Failed to delete video from YouTube:", err);
    return false;
  }
}
