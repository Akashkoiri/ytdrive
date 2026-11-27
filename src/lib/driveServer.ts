import { auth } from "@/auth";
import {
  getUserDrive,
  calculateStorageStats,
  DriveFile,
  DriveFolder,
  StorageQuotaStats,
} from "@/data/driveStore";
import { getValidYouTubeToken } from "@/lib/youtubeUploadService";
import {
  fetchUserYouTubeUploads,
  fetchYouTubeVideosByIds,
  getCachedYouTubeChannelStatus,
  parseIsoDuration,
  estimateVideoSize,
} from "@/lib/youtubeSyncService";

export interface UnifiedDrivePayload {
  userId: string;
  files: DriveFile[];
  folders: DriveFolder[];
  stats: StorageQuotaStats;
  source: "youtube_live" | "local_cache";
  hasYouTubeChannel: boolean;
}

/**
 * High-performance server-side resolver for user drive content.
 * Used by Server Components, Server Actions, and API Route Handlers.
 */
export async function getUnifiedUserDrive(
  userId?: string,
  sessionArg?: unknown,
  forceRefresh = false
): Promise<UnifiedDrivePayload> {
  const session = sessionArg !== undefined ? sessionArg : await auth();
  const effectiveUserId =
    userId ||
    (session as { user?: { id?: string } })?.user?.id ||
    "guest";

  const drive = await getUserDrive(effectiveUserId);
  const folders = [...drive.folders];
  const localFiles = [...drive.files];

  let unifiedFiles: DriveFile[] = [];
  let isLiveYouTube = false;

  // Check if authenticated user has YouTube OAuth permissions
  const youtubeToken = await getValidYouTubeToken(effectiveUserId, session);

  if (youtubeToken) {
    try {
      // 1. Fetch user's channel uploads directly from YouTube (cached in-memory for 60s)
      const ytUploads = await fetchUserYouTubeUploads(
        effectiveUserId,
        youtubeToken,
        forceRefresh
      );
      isLiveYouTube = true;

      // Track mapped video IDs
      const mappedVideoIds = new Set<string>();

      // Build quick metadata lookup from stored drive entries
      const metadataByVideoId = new Map<string, DriveFile>();
      for (const f of localFiles) {
        if (f.videoId) {
          metadataByVideoId.set(f.videoId, f);
        }
        metadataByVideoId.set(f.id, f);
      }

      // Convert YouTube channel uploads into DriveFiles
      for (const yt of ytUploads) {
        mappedVideoIds.add(yt.id);
        const meta = metadataByVideoId.get(yt.id);
        const durationParsed = parseIsoDuration(yt.contentDetails?.duration);
        const estimatedSize =
          meta?.size ||
          estimateVideoSize(
            durationParsed.seconds,
            yt.contentDetails?.definition
          );

        const thumbnail =
          yt.snippet.thumbnails.maxres?.url ||
          yt.snippet.thumbnails.high?.url ||
          yt.snippet.thumbnails.medium?.url ||
          `https://i.ytimg.com/vi/${yt.id}/hqdefault.jpg`;

        unifiedFiles.push({
          id: meta?.id || `yt_${yt.id}`,
          name:
            meta?.name ||
            `${yt.snippet.title.replace(/[\\/:*?"<>|]/g, "_")}.mp4`,
          videoId: yt.id,
          youtubeUrl: `https://youtu.be/${yt.id}`,
          fileUrl: meta?.fileUrl,
          size: estimatedSize,
          duration: durationParsed.formatted,
          durationSeconds: durationParsed.seconds,
          resolution:
            yt.contentDetails?.definition === "hd" ? "1080p 60fps" : "720p",
          mimeType: "video/mp4",
          thumbnailUrl: thumbnail,
          folderId: meta?.folderId || null,
          privacy:
            (yt.status?.privacyStatus as "unlisted" | "private" | "public") ||
            "unlisted",
          starred: Boolean(meta?.starred),
          trashed: Boolean(meta?.trashed),
          trashedAt: meta?.trashedAt || null,
          tags:
            meta?.tags && meta.tags.length > 0
              ? meta.tags
              : yt.snippet.tags?.slice(0, 5) || ["YouTube"],
          description: yt.snippet.description || meta?.description || "",
          createdAt:
            yt.snippet.publishedAt ||
            meta?.createdAt ||
            new Date().toISOString(),
          updatedAt:
            meta?.updatedAt ||
            yt.snippet.publishedAt ||
            new Date().toISOString(),
          backendStorage: "youtube_cloud",
        });
      }

      // 2. Hydrate imported YouTube videos (videos saved in drive that are not in channel uploads)
      const importedToHydrate = localFiles.filter(
        (f) => f.videoId && !mappedVideoIds.has(f.videoId)
      );

      if (importedToHydrate.length > 0) {
        const importedIds = importedToHydrate
          .map((f) => f.videoId!)
          .filter(Boolean);
        const ytDetailsMap = await fetchYouTubeVideosByIds(importedIds, {
          accessToken: youtubeToken,
        });

        for (const f of importedToHydrate) {
          const ytDetail = f.videoId ? ytDetailsMap.get(f.videoId) : undefined;
          if (ytDetail) {
            const durationParsed = parseIsoDuration(
              ytDetail.contentDetails?.duration
            );
            const thumbnail =
              ytDetail.snippet.thumbnails.maxres?.url ||
              ytDetail.snippet.thumbnails.high?.url ||
              ytDetail.snippet.thumbnails.medium?.url ||
              f.thumbnailUrl;

            unifiedFiles.push({
              ...f,
              name:
                f.name ||
                `${ytDetail.snippet.title.replace(/[\\/:*?"<>|]/g, "_")}.mp4`,
              thumbnailUrl: thumbnail,
              duration: durationParsed.formatted || f.duration,
              durationSeconds: durationParsed.seconds || f.durationSeconds,
              resolution:
                ytDetail.contentDetails?.definition === "hd"
                  ? "1080p 60fps"
                  : f.resolution,
              privacy:
                (ytDetail.status?.privacyStatus as
                  | "unlisted"
                  | "private"
                  | "public") || f.privacy,
              description: ytDetail.snippet.description || f.description,
            });
          } else {
            unifiedFiles.push(f);
          }
        }
      }

      // 3. Keep any local uploaded files
      const nonYouTubeFiles = localFiles.filter((f) => !f.videoId);
      unifiedFiles.push(...nonYouTubeFiles);
    } catch (err) {
      console.warn(
        "Failed to fetch live YouTube channel files, using local cache fallback:",
        err
      );
      unifiedFiles = [...localFiles];
    }
  } else {
    unifiedFiles = [...localFiles];
  }

  const stats = calculateStorageStats(unifiedFiles);

  const hasYouTubeChannel = youtubeToken
    ? getCachedYouTubeChannelStatus(effectiveUserId)
    : true;

  return {
    userId: effectiveUserId,
    files: unifiedFiles,
    folders,
    stats,
    source: isLiveYouTube ? "youtube_live" : "local_cache",
    hasYouTubeChannel,
  };
}
