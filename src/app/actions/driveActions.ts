"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getUserDrive,
  addDriveFolder,
  renameDriveFolder,
  deleteDriveFolder,
  toggleStarFile,
  updateDriveFile,
  trashDriveFiles,
  restoreDriveFiles,
  permanentlyDeleteDriveFiles,
  moveDriveFiles,
  calculateStorageStats,
} from "@/data/driveStore";
import { getValidYouTubeToken } from "@/lib/youtubeUploadService";
import {
  updateYouTubeVideoSnippet,
  updateYouTubeVideoPrivacy,
  deleteYouTubeVideo,
  invalidateYouTubeUploadsCache,
} from "@/lib/youtubeSyncService";
import { getUnifiedUserDrive, UnifiedDrivePayload } from "@/lib/driveServer";

async function requireAuthenticatedSession() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Authentication required.");
  }
  return { session, userId };
}

export async function getUnifiedDriveAction(
  forceRefresh = false
): Promise<UnifiedDrivePayload> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return {
      userId: "guest",
      files: [],
      folders: [],
      stats: calculateStorageStats([]),
      source: "local_cache",
      hasYouTubeChannel: true,
    };
  }
  return getUnifiedUserDrive(userId, session, forceRefresh);
}

export async function toggleStarAction(fileId: string) {
  const { userId } = await requireAuthenticatedSession();
  const updated = await toggleStarFile(userId, fileId);
  revalidatePath("/");
  return { success: true, file: updated };
}

export async function renameFileAction(fileId: string, newName: string) {
  const { session, userId } = await requireAuthenticatedSession();
  const updated = await updateDriveFile(userId, fileId, { name: newName });

  const youtubeToken = await getValidYouTubeToken(userId, session);
  const videoId =
    updated?.videoId || (fileId.startsWith("yt_") ? fileId.slice(3) : undefined);
  if (youtubeToken && videoId) {
    updateYouTubeVideoSnippet(youtubeToken, videoId, {
      title: newName.replace(/\.[^/.]+$/, ""),
    }).catch((err) =>
      console.warn("Background YouTube title update warning:", err)
    );
  }

  revalidatePath("/");
  return { success: true, file: updated };
}

export async function updatePrivacyAction(
  fileId: string,
  privacy: "unlisted" | "private" | "public"
): Promise<{ success: boolean; file?: Awaited<ReturnType<typeof updateDriveFile>>; error?: string }> {
  const { session, userId } = await requireAuthenticatedSession();
  const drive = await getUserDrive(userId);
  const existing = drive.files.find((f) => f.id === fileId);
  const videoId =
    existing?.videoId || (fileId.startsWith("yt_") ? fileId.slice(3) : undefined);

  if (videoId) {
    const youtubeToken = await getValidYouTubeToken(userId, session);
    if (!youtubeToken) {
      return {
        success: false,
        error: "YouTube session expired. Please reconnect your Google account.",
      };
    }

    const ytRes = await updateYouTubeVideoPrivacy(youtubeToken, videoId, privacy);
    if (!ytRes.success) {
      return {
        success: false,
        error: ytRes.error || "Failed to update visibility on YouTube.",
      };
    }
  }

  const updated = await updateDriveFile(userId, fileId, { privacy });
  revalidatePath("/");
  return { success: true, file: updated };
}

export async function moveFilesAction(
  fileIds: string[],
  targetFolderId: string | null
) {
  const { userId } = await requireAuthenticatedSession();
  const success = await moveDriveFiles(userId, fileIds, targetFolderId);
  revalidatePath("/");
  return { success };
}

export async function trashFilesAction(fileIds: string[]) {
  const { userId } = await requireAuthenticatedSession();
  const success = await trashDriveFiles(userId, fileIds);
  revalidatePath("/");
  return { success };
}

export async function restoreFilesAction(fileIds: string[]) {
  const { userId } = await requireAuthenticatedSession();
  const success = await restoreDriveFiles(userId, fileIds);
  revalidatePath("/");
  return { success };
}

export async function deletePermanentlyAction(
  fileIds: string[],
  videoIds: string[] = []
) {
  const { session, userId } = await requireAuthenticatedSession();
  const drive = await getUserDrive(userId);
  const toDelete = drive.files.filter((f) => fileIds.includes(f.id));

  const success = await permanentlyDeleteDriveFiles(userId, fileIds);

  const allVideoIds = Array.from(
    new Set(
      [
        ...toDelete.map((item) => item.videoId),
        ...videoIds,
        ...fileIds
          .filter((id) => id.startsWith("yt_"))
          .map((id) => id.slice(3)),
      ].filter((id): id is string => Boolean(id))
    )
  );

  const youtubeToken = await getValidYouTubeToken(userId, session);
  if (youtubeToken && allVideoIds.length > 0) {
    await Promise.allSettled(
      allVideoIds.map((vid) =>
        deleteYouTubeVideo(youtubeToken, vid).catch((err) =>
          console.warn(`Could not delete video ${vid} from YouTube:`, err)
        )
      )
    );
    invalidateYouTubeUploadsCache(userId);
  }

  revalidatePath("/");
  return { success };
}

export async function createFolderAction(name: string, color = "blue") {
  const { userId } = await requireAuthenticatedSession();
  const folder = await addDriveFolder(userId, {
    name,
    color,
    parentId: null,
  });
  revalidatePath("/");
  return { success: true, folder };
}

export async function renameFolderAction(folderId: string, newName: string) {
  const { userId } = await requireAuthenticatedSession();
  const updated = await renameDriveFolder(userId, folderId, newName);
  revalidatePath("/");
  return { success: true, folder: updated };
}

export async function deleteFolderAction(folderId: string) {
  const { userId } = await requireAuthenticatedSession();
  const deleted = await deleteDriveFolder(userId, folderId);
  revalidatePath("/");
  return { success: deleted };
}
