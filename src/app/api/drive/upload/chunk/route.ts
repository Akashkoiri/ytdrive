import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addDriveFile } from "@/data/driveStore";
import {
  getValidYouTubeToken,
  initYouTubeUploadSession,
  uploadChunkToYouTube,
  abortYouTubeUploadSession,
  checkUserYouTubeChannel,
  YouTubeUploadError,
} from "@/lib/youtubeUploadService";
import { invalidateYouTubeUploadsCache } from "@/lib/youtubeSyncService";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id || "guest";
  const accessToken = await getValidYouTubeToken(userId, session);
  const hasYouTubeAccess = Boolean(accessToken);
  const channelCheck = accessToken
    ? await checkUserYouTubeChannel(accessToken)
    : null;

  return NextResponse.json({
    status: "ok",
    service: "YouTube Data API v3 Resumable Upload Engine",
    connectedToYouTube: hasYouTubeAccess,
    hasYouTubeChannel: channelCheck ? channelCheck.status !== "missing" : true,
    chunkMultiple: "256KB",
    standardChunkSize: "5MB",
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // ------------------------------------------------------------------------
    // 1. STREAM BINARY CHUNK TO YOUTUBE RESUMABLE API
    // ------------------------------------------------------------------------
    if (contentType.includes("multipart/form-data")) {
      const authSession = await auth();
      const userId = authSession?.user?.id;
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required", requiresAuth: true },
          { status: 401 }
        );
      }

      const formData = await request.formData();
      const uploadId = formData.get("uploadId") as string;
      const chunkIndexRaw = formData.get("chunkIndex") as string | null;
      const startRaw = formData.get("start") as string | null;
      const endRaw = formData.get("end") as string | null;
      const totalSizeRaw = formData.get("totalSize") as string | null;
      const chunkFile = formData.get("chunk") as File | null;

      if (!uploadId || !chunkFile) {
        return NextResponse.json(
          { error: "Missing uploadId or chunk payload" },
          { status: 400 }
        );
      }

      const chunkArrayBuffer = await chunkFile.arrayBuffer();
      const chunkBuffer = Buffer.from(chunkArrayBuffer);

      const chunkIndex = chunkIndexRaw ? parseInt(chunkIndexRaw, 10) : undefined;
      const startByte = startRaw ? parseInt(startRaw, 10) : undefined;
      const endByte = endRaw ? parseInt(endRaw, 10) : undefined;
      const totalBytes = totalSizeRaw ? parseInt(totalSizeRaw, 10) : undefined;

      // Stream chunk directly to YouTube - ZERO files written to server disk
      const result = await uploadChunkToYouTube({
        uploadId,
        expectedUserId: userId,
        chunkBuffer,
        startByte,
        endByte,
        totalBytes,
        chunkIndex,
      });

      if (result.status === "incomplete") {
        return NextResponse.json({
          success: true,
          status: "incomplete",
          message: "Chunk received and forwarded to YouTube",
        });
      }

      // Upload finished! YouTube created the video and returned videoId
      const session = result.session;
      const videoId = result.videoId!;

      // Register file in Cloud Drive store
      const effectiveUserId = session.userId || userId;
      const newDriveFile = await addDriveFile(effectiveUserId, {
        name: session.metadata?.title || session.fileName,
        videoId,
        youtubeUrl: `https://youtu.be/${videoId}`,
        size: session.fileSize,
        duration: session.metadata?.duration || "0:00",
        durationSeconds: session.metadata?.durationSeconds || 0,
        resolution: session.metadata?.resolution || "1080p 60fps",
        mimeType: session.mimeType || "video/mp4",
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        folderId:
          session.metadata?.folderId &&
          session.metadata.folderId !== "root" &&
          session.metadata.folderId !== "null"
            ? session.metadata.folderId
            : null,
        privacy: session.metadata?.privacy || "unlisted",
        tags: Array.isArray(session.metadata?.tags) ? session.metadata.tags : [],
        description: session.metadata?.description || "",
        backendStorage: "youtube_cloud",
      });

      invalidateYouTubeUploadsCache(effectiveUserId);

      return NextResponse.json({
        success: true,
        status: "complete",
        videoId,
        file: newDriveFile,
        message: "Video uploaded directly to your YouTube channel in original quality!",
      });
    }

    // ------------------------------------------------------------------------
    // 2. JSON COMMANDS (INIT / ABORT)
    // ------------------------------------------------------------------------
    const body = await request.json();
    const { action } = body;

    // A. INITIALIZE YOUTUBE RESUMABLE UPLOAD SESSION
    if (action === "init") {
      const {
        fileName,
        fileSize,
        mimeType,
        metadata,
      } = body;

      const authSession = await auth();
      const userId = authSession?.user?.id;

      if (!userId) {
        return NextResponse.json(
          {
            error: "Authentication required",
            requiresAuth: true,
            message: "Please sign in to upload videos.",
          },
          { status: 401 }
        );
      }

      // Check YouTube OAuth access token
      const accessToken = await getValidYouTubeToken(userId, authSession);

      if (!accessToken) {
        return NextResponse.json(
          {
            error: "YOUTUBE_AUTH_REQUIRED",
            requiresYouTubeAuth: true,
            message:
              "To upload videos directly into your YouTube account in original quality, please connect your Google/YouTube account.",
          },
          { status: 403 }
        );
      }

      // Initiate Resumable Upload session on Google YouTube servers
      const sessionResult = await initYouTubeUploadSession({
        userId,
        accessToken,
        fileName,
        fileSize,
        mimeType: mimeType || "video/mp4",
        metadata,
      });

      return NextResponse.json({
        success: true,
        uploadId: sessionResult.uploadId,
        chunkSize: sessionResult.chunkSize,
        totalChunks: sessionResult.totalChunks,
        message: "YouTube resumable upload session established",
      });
    }

    // B. ABORT / CANCEL
    if (action === "abort") {
      const authSession = await auth();
      const userId = authSession?.user?.id;
      if (!userId) {
        return NextResponse.json(
          { error: "Authentication required", requiresAuth: true },
          { status: 401 }
        );
      }
      const { uploadId } = body;
      if (uploadId) {
        await abortYouTubeUploadSession(uploadId, userId);
      }
      return NextResponse.json({ success: true, message: "YouTube upload aborted" });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof YouTubeUploadError) {
      console.warn(`YouTube chunk upload rejected (${err.code}):`, err.message);
      return NextResponse.json(
        {
          error: err.message,
          message: err.message,
          code: err.code,
          requiresYouTubeChannel: err.code === "YOUTUBE_CHANNEL_REQUIRED",
          requiresYouTubeAuth: err.code === "YOUTUBE_AUTH_EXPIRED",
        },
        { status: err.status }
      );
    }

    console.error("YouTube chunk upload error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to process YouTube upload",
      },
      { status: 500 }
    );
  }
}
