import { getUserOAuthTokens, saveUserOAuthTokens } from "@/data/userStore";

export type YouTubeUploadErrorCode =
  | "YOUTUBE_CHANNEL_REQUIRED"
  | "YOUTUBE_AUTH_EXPIRED"
  | "YOUTUBE_FORBIDDEN"
  | "YOUTUBE_API_ERROR";

export const YOUTUBE_CREATE_CHANNEL_MESSAGE =
  "No YouTube channel found for this Google account. Please create a YouTube channel first (youtube.com/create_channel), then try uploading again.";

export class YouTubeUploadError extends Error {
  code: YouTubeUploadErrorCode;
  status: number;

  constructor(message: string, code: YouTubeUploadErrorCode, status = 500) {
    super(message);
    this.name = "YouTubeUploadError";
    this.code = code;
    this.status = status;
  }
}

export function hasYouTubeUploadScope(scope?: string): boolean {
  if (!scope) return true;
  const scopes = scope.split(/\s+/);
  return scopes.some(
    (s) =>
      s === "https://www.googleapis.com/auth/youtube.upload" ||
      s === "https://www.googleapis.com/auth/youtube"
  );
}

export type YouTubeChannelCheckResult =
  | { status: "exists"; channelId: string; channelTitle?: string }
  | { status: "missing" }
  | { status: "unauthorized"; message?: string }
  | { status: "error"; httpStatus: number; message?: string };

/**
 * Verify whether the authenticated Google account has an active YouTube channel.
 */
export async function checkUserYouTubeChannel(
  accessToken: string
): Promise<YouTubeChannelCheckResult> {
  if (!accessToken) {
    return { status: "unauthorized", message: "Missing access token" };
  }

  try {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (res.ok) {
      const data = await res.json().catch(() => null);
      const firstChannel = Array.isArray(data?.items) ? data.items[0] : undefined;
      if (!firstChannel) {
        return { status: "missing" };
      }
      return {
        status: "exists",
        channelId: firstChannel.id as string,
        channelTitle: firstChannel.snippet?.title as string | undefined,
      };
    }

    const errData = await res.json().catch(() => null);
    const reason = errData?.error?.errors?.[0]?.reason || "";
    const message =
      errData?.error?.message ||
      `YouTube API responded with status ${res.status}`;

    if (
      res.status === 403 &&
      (reason === "youtubeSignupRequired" ||
        reason === "channelNotFound" ||
        message.includes("youtubeSignupRequired"))
    ) {
      return { status: "missing" };
    }

    if (res.status === 401) {
      return { status: "unauthorized", message };
    }

    return { status: "error", httpStatus: res.status, message };
  } catch (err) {
    return {
      status: "error",
      httpStatus: 500,
      message: err instanceof Error ? err.message : "Failed to verify YouTube channel",
    };
  }
}

async function refreshGoogleAccessToken(
  userId: string,
  refreshToken: string,
  scope?: string
): Promise<string | null> {
  if (
    !refreshToken ||
    !process.env.AUTH_GOOGLE_ID ||
    !process.env.AUTH_GOOGLE_SECRET
  ) {
    return null;
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID,
        client_secret: process.env.AUTH_GOOGLE_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const refreshed = await res.json();
    if (res.ok && refreshed.access_token) {
      const newExpiresAt = Math.floor(
        Date.now() / 1000 + (refreshed.expires_in || 3600)
      );
      const newRefreshToken = refreshed.refresh_token || refreshToken;
      await saveUserOAuthTokens(userId, {
        accessToken: refreshed.access_token,
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        scope: scope || "",
      });
      return refreshed.access_token as string;
    }
  } catch (err) {
    console.error("Failed to refresh Google YouTube token:", err);
  }
  return null;
}

export interface YouTubeUploadSession {
  uploadId: string;
  uploadUrl: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize: number;
  totalChunks: number;
  createdAt: number;
  metadata?: {
    title?: string;
    folderId?: string | null;
    privacy?: "unlisted" | "private" | "public";
    tags?: string[];
    description?: string;
    duration?: string;
    durationSeconds?: number;
    resolution?: string;
  };
}

// In-memory active YouTube resumable sessions (persisted on globalThis across dev Fast Refresh)
// Key: uploadId (uuid/timestamp)
const globalForUploadSessions = globalThis as unknown as {
  activeSessions?: Map<string, YouTubeUploadSession>;
};
const activeSessions =
  globalForUploadSessions.activeSessions ||
  new Map<string, YouTubeUploadSession>();
globalForUploadSessions.activeSessions = activeSessions;

// Clean up stale sessions older than 4 hours
function cleanStaleSessions(): void {
  const now = Date.now();
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > FOUR_HOURS) {
      activeSessions.delete(id);
    }
  }
}

/**
 * Retrieve a valid YouTube access token for the given user ID.
 * Automatically refreshes the token with Google OAuth if expired.
 */
export async function getValidYouTubeToken(
  userId: string,
  session?: unknown
): Promise<string | null> {
  // 1. Check user store first
  let tokenRecord = await getUserOAuthTokens(userId);

  // 2. If not in userStore or session has a newer token, prefer the freshest token
  const s = session as Record<string, unknown> | undefined;
  const sessionExpiresAt =
    typeof s?.expiresAt === "number" ? s.expiresAt : undefined;
  const storeExpiresAt = tokenRecord?.expiresAt;
  const sessionIsFresher = Boolean(
    s?.accessToken &&
      (!tokenRecord?.accessToken ||
        (sessionExpiresAt !== undefined &&
          (storeExpiresAt === undefined || sessionExpiresAt > storeExpiresAt)))
  );

  if (sessionIsFresher && s?.accessToken) {
    tokenRecord = {
      accessToken: s.accessToken as string,
      refreshToken:
        (s.refreshToken as string | undefined) || tokenRecord?.refreshToken,
      expiresAt: sessionExpiresAt,
      scope: (s.scope as string | undefined) || tokenRecord?.scope,
    };
    if (userId) {
      await saveUserOAuthTokens(userId, tokenRecord).catch(() => {});
    }
  }

  if (!tokenRecord || !tokenRecord.accessToken) {
    return null;
  }

  const { accessToken, refreshToken, expiresAt, scope } = tokenRecord;

  // Verify the token has youtube upload permissions
  if (!hasYouTubeUploadScope(scope)) {
    return null;
  }

  // If token is still valid (with 60-second buffer), use it directly
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (expiresAt && nowInSeconds < expiresAt - 60) {
    return accessToken;
  }

  // If expired or expiring soon, refresh if refreshToken is available
  if (refreshToken) {
    const refreshedAccessToken = await refreshGoogleAccessToken(
      userId,
      refreshToken,
      scope
    );
    if (refreshedAccessToken) {
      return refreshedAccessToken;
    }
  }

  // If expired and refresh failed or was not possible, force reconnect rather than using a dead token
  if (expiresAt && nowInSeconds >= expiresAt) {
    return null;
  }

  return accessToken;
}

/**
 * Initialize a YouTube Resumable Upload session.
 * Initiates the upload on Google's YouTube Data API v3 servers and retrieves the resumable upload URL.
 */
export async function initYouTubeUploadSession(params: {
  userId: string;
  accessToken: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  metadata?: {
    title?: string;
    folderId?: string | null;
    privacy?: "unlisted" | "private" | "public";
    tags?: string[];
    description?: string;
    duration?: string;
    durationSeconds?: number;
    resolution?: string;
  };
}): Promise<{
  uploadId: string;
  chunkSize: number;
  totalChunks: number;
}> {
  cleanStaleSessions();

  const rawTitle = params.metadata?.title || params.fileName;
  const title =
    rawTitle.replace(/\.(mp4|mov|webm|mkv|avi|flv|wmv)$/i, "").trim() ||
    rawTitle;
  const privacy = params.metadata?.privacy || "unlisted";
  const description =
    params.metadata?.description || "Uploaded securely via YT Drive in original quality";
  const tags = params.metadata?.tags || ["ytdrive"];

  const requestBody = {
    snippet: {
      title,
      description,
      tags,
      categoryId: "22", // People & Blogs
    },
    status: {
      privacyStatus: privacy,
      embeddable: true,
      selfDeclaredMadeForKids: false,
    },
  };

  let activeAccessToken = params.accessToken;

  // Verify the user actually has a YouTube channel before initiating upload
  let channelCheck = await checkUserYouTubeChannel(activeAccessToken);
  if (channelCheck.status === "unauthorized") {
    const stored = await getUserOAuthTokens(params.userId).catch(() => null);
    if (stored?.refreshToken) {
      const refreshed = await refreshGoogleAccessToken(
        params.userId,
        stored.refreshToken,
        stored.scope
      );
      if (refreshed) {
        activeAccessToken = refreshed;
        channelCheck = await checkUserYouTubeChannel(activeAccessToken);
      }
    }
  }

  if (channelCheck.status === "missing") {
    throw new YouTubeUploadError(
      YOUTUBE_CREATE_CHANNEL_MESSAGE,
      "YOUTUBE_CHANNEL_REQUIRED",
      403
    );
  }

  if (channelCheck.status === "unauthorized") {
    throw new YouTubeUploadError(
      "YouTube access token expired or invalid. Please reconnect your Google/YouTube account.",
      "YOUTUBE_AUTH_EXPIRED",
      401
    );
  }

  // Google YouTube Resumable Upload initialization endpoint
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${activeAccessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": params.mimeType || "video/mp4",
        "X-Upload-Content-Length": String(params.fileSize),
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!initRes.ok) {
    const errorData = await initRes.json().catch(() => null);
    const reason = errorData?.error?.errors?.[0]?.reason || "";
    const errorMsg =
      errorData?.error?.message ||
      `YouTube API responded with status ${initRes.status} (${initRes.statusText})`;

    // Check common YouTube specific causes
    if (initRes.status === 401) {
      const recheck = await checkUserYouTubeChannel(activeAccessToken);
      if (recheck.status === "missing") {
        throw new YouTubeUploadError(
          YOUTUBE_CREATE_CHANNEL_MESSAGE,
          "YOUTUBE_CHANNEL_REQUIRED",
          403
        );
      }
      throw new YouTubeUploadError(
        `YouTube access token expired or invalid (${errorMsg}). Please reconnect your Google/YouTube account.`,
        "YOUTUBE_AUTH_EXPIRED",
        401
      );
    }
    if (initRes.status === 403) {
      if (
        reason === "youtubeSignupRequired" ||
        reason === "channelNotFound" ||
        errorMsg.includes("youtubeSignupRequired")
      ) {
        throw new YouTubeUploadError(
          YOUTUBE_CREATE_CHANNEL_MESSAGE,
          "YOUTUBE_CHANNEL_REQUIRED",
          403
        );
      }
      if (errorMsg.includes("uploadLimitExceeded")) {
        throw new YouTubeUploadError(
          "YouTube daily upload limit reached for your account. Please try again tomorrow.",
          "YOUTUBE_FORBIDDEN",
          403
        );
      }
      throw new YouTubeUploadError(
        `YouTube permission denied: ${errorMsg}. Make sure you granted YouTube upload permissions.`,
        "YOUTUBE_FORBIDDEN",
        403
      );
    }

    throw new YouTubeUploadError(
      `Failed to initialize YouTube upload: ${errorMsg}`,
      "YOUTUBE_API_ERROR",
      initRes.status >= 400 ? initRes.status : 500
    );
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new Error("YouTube did not return a resumable upload location header.");
  }

  // YouTube requires chunks to be multiples of 256 KiB (262,144 bytes)
  const YOUTUBE_CHUNK_UNIT = 256 * 1024; // 262,144 bytes
  // 4 MB chunks (16 * 256 KiB = 4,194,304 bytes) stay below common proxy payload limits
  let chunkSize = 16 * YOUTUBE_CHUNK_UNIT;
  if (params.fileSize <= 10 * 1024 * 1024) {
    // 2.5 MB for smaller files
    chunkSize = 10 * YOUTUBE_CHUNK_UNIT;
  }

  const totalChunks = Math.max(1, Math.ceil(params.fileSize / chunkSize));
  const uploadId = `yt_up_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const session: YouTubeUploadSession = {
    uploadId,
    uploadUrl,
    userId: params.userId,
    fileName: params.fileName,
    fileSize: params.fileSize,
    mimeType: params.mimeType || "video/mp4",
    chunkSize,
    totalChunks,
    createdAt: Date.now(),
    metadata: params.metadata,
  };

  activeSessions.set(uploadId, session);

  return {
    uploadId,
    chunkSize,
    totalChunks,
  };
}

/**
 * Upload a binary chunk directly to YouTube's resumable upload endpoint.
 * Zero files are written to the local server disk.
 */
export async function uploadChunkToYouTube(params: {
  uploadId: string;
  chunkBuffer: Buffer;
  startByte?: number;
  endByte?: number;
  totalBytes?: number;
  chunkIndex?: number;
}): Promise<{
  status: "incomplete" | "complete";
  videoId?: string;
  session: YouTubeUploadSession;
  rawResponse?: unknown;
}> {
  const session = activeSessions.get(params.uploadId);
  if (!session) {
    throw new Error("Upload session not found or expired. Please restart the upload.");
  }

  // The total byte size expected by YouTube for this video (from initialized session)
  const totalBytes =
    session.fileSize ||
    (params.totalBytes !== undefined && !isNaN(params.totalBytes)
      ? params.totalBytes
      : params.chunkBuffer.length);

  // Start byte offset
  const startByte =
    params.startByte !== undefined && !isNaN(params.startByte)
      ? params.startByte
      : params.chunkIndex !== undefined && !isNaN(params.chunkIndex)
      ? params.chunkIndex * session.chunkSize
      : 0;

  // The last byte index (inclusive) must match startByte + chunkBuffer.length - 1
  const endByte = startByte + params.chunkBuffer.length - 1;

  const contentRange = `bytes ${startByte}-${endByte}/${totalBytes}`;

  const ytRes = await fetch(session.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(params.chunkBuffer.length),
      "Content-Range": contentRange,
      "Content-Type": session.mimeType,
    },
    body: params.chunkBuffer as unknown as BodyInit,
  });

  // 308 Resume Incomplete indicates YouTube successfully stored the chunk and is awaiting next
  if (ytRes.status === 308) {
    return {
      status: "incomplete",
      session,
    };
  }

  // 200 or 201 indicates YouTube received all chunks and created the video resource
  if (ytRes.status === 200 || ytRes.status === 201) {
    const videoData = await ytRes.json();
    const videoId = videoData?.id;

    if (!videoId) {
      throw new Error("YouTube completed upload but did not return a valid video ID.");
    }

    // Clean up session from memory
    activeSessions.delete(params.uploadId);

    return {
      status: "complete",
      videoId,
      session,
      rawResponse: videoData,
    };
  }

  // Otherwise, handle error response from YouTube
  const errorText = await ytRes.text();
  let errorJson: { error?: { message?: string } } | null = null;
  try {
    errorJson = JSON.parse(errorText);
  } catch {
    // raw text
  }

  const errorMessage =
    errorJson?.error?.message ||
    errorText ||
    `YouTube error HTTP ${ytRes.status} (${ytRes.statusText})`;

  throw new Error(`YouTube chunk upload failed: ${errorMessage}`);
}

/**
 * Abort an active YouTube upload session.
 */
export async function abortYouTubeUploadSession(uploadId: string): Promise<boolean> {
  const session = activeSessions.get(uploadId);
  if (!session) return false;

  try {
    await fetch(session.uploadUrl, {
      method: "DELETE",
      headers: { "Content-Length": "0" },
    });
  } catch (err) {
    console.warn("Could not send abort signal to YouTube:", err);
  } finally {
    activeSessions.delete(uploadId);
  }

  return true;
}
