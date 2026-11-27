import { prisma } from "@/lib/prisma";

export * from "@/types/drive";
import {
  DriveFile,
  DriveFolder,
  UserDriveData,
} from "@/types/drive";

// Volatile in-memory cache for ultra-fast response times and fallback
// NEVER written to disk or JSON files. Source of truth is Supabase when reachable.
const globalForDriveCache = globalThis as unknown as {
  driveInMemoryCache?: Map<string, UserDriveData>;
  drivePrismaUnhealthyUntil?: number;
};

const inMemoryCache =
  globalForDriveCache.driveInMemoryCache || new Map<string, UserDriveData>();
globalForDriveCache.driveInMemoryCache = inMemoryCache;

const PRISMA_COOLDOWN_MS = 30 * 1000;

function isPrismaActive(): boolean {
  const unhealthyUntil = globalForDriveCache.drivePrismaUnhealthyUntil || 0;
  return Boolean(prisma) && Date.now() > unhealthyUntil;
}

function handlePrismaError(actionName: string, err: unknown): void {
  const errMsg = err instanceof Error ? err.message : String(err);
  const errCode = (err as { code?: string })?.code || "";
  if (
    errMsg.includes("ENOTFOUND") ||
    errMsg.includes("tenant") ||
    errMsg.includes("connect") ||
    errMsg.includes("P2039") ||
    errMsg.includes("XX000") ||
    errMsg.includes("ECONNREFUSED") ||
    errMsg.includes("timeout") ||
    errCode === "ECONNREFUSED" ||
    errCode === "P1001" ||
    errCode === "P1002"
  ) {
    globalForDriveCache.drivePrismaUnhealthyUntil = Date.now() + PRISMA_COOLDOWN_MS;
    console.warn(
      `[driveStore] Supabase Prisma issue during ${actionName} (${errCode || errMsg.split("\n")[0] || "connection"}). Using RAM fallback.`
    );
  } else {
    console.warn(`[driveStore] Prisma ${actionName} error:`, err);
  }
}

function getOrInitCache(effectiveId: string): UserDriveData {
  let cached = inMemoryCache.get(effectiveId);
  if (!cached) {
    cached = { folders: [], files: [] };
    inMemoryCache.set(effectiveId, cached);
  }
  return cached;
}

function upsertCacheFile(
  effectiveId: string,
  fileId: string,
  updater: (existing: DriveFile) => DriveFile
): DriveFile {
  const cached = getOrInitCache(effectiveId);
  const idx = cached.files.findIndex((f) => f.id === fileId);
  const nowIso = new Date().toISOString();
  const base: DriveFile =
    idx >= 0
      ? cached.files[idx]
      : {
          id: fileId,
          name: "Video.mp4",
          videoId: fileId.startsWith("yt_") ? fileId.slice(3) : undefined,
          youtubeUrl: fileId.startsWith("yt_")
            ? `https://youtu.be/${fileId.slice(3)}`
            : undefined,
          size: 0,
          duration: "0:00",
          durationSeconds: 0,
          resolution: "1080p",
          mimeType: "video/mp4",
          thumbnailUrl: fileId.startsWith("yt_")
            ? `https://i.ytimg.com/vi/${fileId.slice(3)}/hqdefault.jpg`
            : "",
          folderId: null,
          privacy: "unlisted",
          starred: false,
          trashed: false,
          trashedAt: null,
          tags: [],
          description: "",
          createdAt: nowIso,
          updatedAt: nowIso,
          backendStorage: "youtube_cloud",
        };
  const next = updater(base);
  if (idx >= 0) {
    cached.files[idx] = next;
  } else {
    cached.files.unshift(next);
  }
  return next;
}

function formatFile(row: {
  id: string;
  name: string;
  videoId: string | null;
  youtubeUrl: string | null;
  fileUrl: string | null;
  size: bigint | null;
  duration: string | null;
  durationSeconds: number | null;
  resolution: string | null;
  mimeType: string | null;
  thumbnailUrl: string | null;
  folderId: string | null;
  privacy: string | null;
  starred: boolean | null;
  trashed: boolean | null;
  trashedAt: Date | null;
  tags: string[];
  description: string | null;
  backendStorage: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}): DriveFile {
  return {
    id: row.id,
    name: row.name,
    videoId: row.videoId || undefined,
    youtubeUrl: row.youtubeUrl || undefined,
    fileUrl: row.fileUrl || undefined,
    size: Number(row.size || 0),
    duration: row.duration || "0:00",
    durationSeconds: row.durationSeconds || 0,
    resolution: row.resolution || "1080p",
    mimeType: row.mimeType || "video/mp4",
    thumbnailUrl: row.thumbnailUrl || "",
    folderId: row.folderId || null,
    privacy: (row.privacy as "unlisted" | "private" | "public") || "unlisted",
    starred: Boolean(row.starred),
    trashed: Boolean(row.trashed),
    trashedAt: row.trashedAt ? new Date(row.trashedAt).toISOString() : null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    description: row.description || "",
    createdAt: row.createdAt
      ? new Date(row.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: row.updatedAt
      ? new Date(row.updatedAt).toISOString()
      : new Date().toISOString(),
    backendStorage:
      (row.backendStorage as "youtube_cloud" | "local_cloud") || "youtube_cloud",
  };
}

function formatFolder(row: {
  id: string;
  name: string;
  color: string | null;
  parentId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}): DriveFolder {
  return {
    id: row.id,
    name: row.name,
    color: row.color || "blue",
    parentId: row.parentId || null,
    createdAt: row.createdAt
      ? new Date(row.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: row.updatedAt
      ? new Date(row.updatedAt).toISOString()
      : new Date().toISOString(),
  };
}


export async function getUserDrive(userId: string): Promise<UserDriveData> {
  const effectiveId = userId || "guest";
  if (isPrismaActive()) {
    try {
      const [foldersRaw, filesRaw] = await Promise.all([
        prisma.driveFolder.findMany({
          where: { userId: effectiveId },
          orderBy: { createdAt: "asc" },
        }),
        prisma.driveFile.findMany({
          where: { userId: effectiveId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const folders = foldersRaw.map(formatFolder);
      const files = filesRaw.map(formatFile);
      const result: UserDriveData = { folders, files };
      inMemoryCache.set(effectiveId, result);
      return result;
    } catch (err) {
      handlePrismaError("getUserDrive", err);
    }
  }
  return getOrInitCache(effectiveId);
}

export async function clearAllUserDrives(): Promise<void> {
  try {
    await Promise.all([
      prisma.driveFile.deleteMany({}),
      prisma.driveFolder.deleteMany({}),
    ]);
  } catch (err) {
    console.error("[driveStore] Error clearing user drives in Supabase:", err);
  }
  inMemoryCache.clear();
}

export async function addDriveFolder(
  userId: string,
  folder: Omit<DriveFolder, "id" | "createdAt" | "updatedAt">
): Promise<DriveFolder> {
  const effectiveId = userId || "guest";
  const id = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const newFolder: DriveFolder = {
    id,
    name: folder.name.trim() || "Untitled Folder",
    color: folder.color || "blue",
    parentId: folder.parentId || null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  if (isPrismaActive()) {
    try {
      await prisma.driveFolder.create({
        data: {
          id,
          userId: effectiveId,
          name: newFolder.name,
          color: newFolder.color,
          parentId: newFolder.parentId,
          createdAt: now,
          updatedAt: now,
        },
      });
    } catch (err) {
      handlePrismaError("addDriveFolder", err);
    }
  }

  const cached = getOrInitCache(effectiveId);
  cached.folders.push(newFolder);

  return newFolder;
}

export async function renameDriveFolder(
  userId: string,
  folderId: string,
  newName: string
): Promise<DriveFolder | null> {
  const effectiveId = userId || "guest";
  const trimmed = newName.trim();
  const now = new Date();
  let folder: DriveFolder | null = null;

  if (isPrismaActive()) {
    try {
      const updated = await prisma.driveFolder.update({
        where: { id: folderId },
        data: {
          name: trimmed,
          updatedAt: now,
        },
      });
      folder = formatFolder(updated);
    } catch (err) {
      handlePrismaError("renameDriveFolder", err);
    }
  }

  const cached = getOrInitCache(effectiveId);
  const f = cached.folders.find((x) => x.id === folderId);
  if (f) {
    f.name = trimmed;
    f.updatedAt = now.toISOString();
    folder = folder || f;
  }
  return folder;
}

export async function deleteDriveFolder(
  userId: string,
  folderId: string
): Promise<boolean> {
  const effectiveId = userId || "guest";
  if (isPrismaActive()) {
    try {
      // Move all files inside this folder back to root "My Drive"
      await prisma.driveFile.updateMany({
        where: { userId: effectiveId, folderId },
        data: { folderId: null, updatedAt: new Date() },
      });

      await prisma.driveFolder.delete({
        where: { id: folderId },
      });
    } catch (err) {
      handlePrismaError("deleteDriveFolder", err);
    }
  }

  const cached = getOrInitCache(effectiveId);
  cached.folders = cached.folders.filter((f) => f.id !== folderId);
  cached.files.forEach((file) => {
    if (file.folderId === folderId) {
      file.folderId = null;
      file.updatedAt = new Date().toISOString();
    }
  });
  return true;
}

export async function addDriveFile(
  userId: string,
  fileData: Partial<DriveFile>
): Promise<DriveFile> {
  const effectiveId = userId || "guest";
  const isYouTube = Boolean(fileData.videoId);
  const id =
    fileData.id ||
    `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  const newFile: DriveFile = {
    id,
    name: fileData.name || `Video_${Date.now()}.mp4`,
    videoId: fileData.videoId,
    youtubeUrl:
      fileData.youtubeUrl ||
      (fileData.videoId ? `https://youtu.be/${fileData.videoId}` : undefined),
    fileUrl: fileData.fileUrl,
    size: fileData.size || 0,
    duration: fileData.duration || "0:00",
    durationSeconds: fileData.durationSeconds || 0,
    resolution: fileData.resolution || "1080p",
    mimeType: fileData.mimeType || "video/mp4",
    thumbnailUrl:
      fileData.thumbnailUrl ||
      (fileData.videoId
        ? `https://i.ytimg.com/vi/${fileData.videoId}/hqdefault.jpg`
        : ""),
    folderId: fileData.folderId || null,
    privacy: fileData.privacy || "unlisted",
    starred: Boolean(fileData.starred),
    trashed: false,
    tags: fileData.tags || [],
    description: fileData.description || "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    backendStorage: isYouTube ? "youtube_cloud" : "local_cloud",
  };

  if (isPrismaActive()) {
    try {
      await prisma.driveFile.upsert({
        where: { id },
        create: {
          id,
          userId: effectiveId,
          name: newFile.name,
          videoId: newFile.videoId || null,
          youtubeUrl: newFile.youtubeUrl || null,
          fileUrl: newFile.fileUrl || null,
          size: BigInt(newFile.size),
          duration: newFile.duration,
          durationSeconds: newFile.durationSeconds,
          resolution: newFile.resolution,
          mimeType: newFile.mimeType,
          thumbnailUrl: newFile.thumbnailUrl || null,
          folderId: newFile.folderId,
          privacy: newFile.privacy,
          starred: newFile.starred,
          trashed: false,
          tags: newFile.tags,
          description: newFile.description,
          backendStorage: newFile.backendStorage,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          name: newFile.name,
          videoId: newFile.videoId || null,
          youtubeUrl: newFile.youtubeUrl || null,
          fileUrl: newFile.fileUrl || null,
          size: BigInt(newFile.size),
          duration: newFile.duration,
          durationSeconds: newFile.durationSeconds,
          resolution: newFile.resolution,
          mimeType: newFile.mimeType,
          thumbnailUrl: newFile.thumbnailUrl || null,
          folderId: newFile.folderId,
          privacy: newFile.privacy,
          starred: newFile.starred,
          tags: newFile.tags,
          description: newFile.description,
          updatedAt: now,
        },
      });
    } catch (err) {
      handlePrismaError("addDriveFile", err);
    }
  }

  const cached = getOrInitCache(effectiveId);
  const existingIdx = cached.files.findIndex((f) => f.id === id);
  if (existingIdx >= 0) {
    cached.files[existingIdx] = newFile;
  } else {
    cached.files.unshift(newFile);
  }

  return newFile;
}

export async function updateDriveFile(
  userId: string,
  fileId: string,
  updates: Partial<DriveFile>
): Promise<DriveFile | null> {
  const effectiveId = userId || "guest";
  const now = new Date();
  let dbFile: DriveFile | null = null;

  if (isPrismaActive()) {
    try {
      const updatePayload: Record<string, unknown> = {
        updatedAt: now,
      };
      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.privacy !== undefined) updatePayload.privacy = updates.privacy;
      if (updates.folderId !== undefined) updatePayload.folderId = updates.folderId;
      if (updates.starred !== undefined) updatePayload.starred = updates.starred;
      if (updates.trashed !== undefined) updatePayload.trashed = updates.trashed;
      if (updates.tags !== undefined) updatePayload.tags = updates.tags;
      if (updates.description !== undefined)
        updatePayload.description = updates.description;

      const updated = await prisma.driveFile.update({
        where: { id: fileId },
        data: updatePayload,
      });

      dbFile = formatFile(updated);
    } catch (err) {
      handlePrismaError("updateDriveFile", err);
    }
  }

  return upsertCacheFile(effectiveId, fileId, (existing) => ({
    ...(dbFile || existing),
    ...updates,
    updatedAt: now.toISOString(),
  }));
}

export async function toggleStarFile(
  userId: string,
  fileId: string
): Promise<DriveFile | null> {
  const effectiveId = userId || "guest";
  const now = new Date();
  let dbFile: DriveFile | null = null;

  if (isPrismaActive()) {
    try {
      const current = await prisma.driveFile.findUnique({
        where: { id: fileId },
      });
      if (current) {
        const updated = await prisma.driveFile.update({
          where: { id: fileId },
          data: {
            starred: !current.starred,
            updatedAt: now,
          },
        });
        dbFile = formatFile(updated);
      }
    } catch (err) {
      handlePrismaError("toggleStarFile", err);
    }
  }

  return upsertCacheFile(effectiveId, fileId, (existing) =>
    dbFile
      ? dbFile
      : {
          ...existing,
          starred: !existing.starred,
          updatedAt: now.toISOString(),
        }
  );
}

export async function trashDriveFiles(
  userId: string,
  fileIds: string[]
): Promise<boolean> {
  const effectiveId = userId || "guest";
  const now = new Date();

  if (isPrismaActive()) {
    try {
      await prisma.driveFile.updateMany({
        where: { id: { in: fileIds } },
        data: {
          trashed: true,
          trashedAt: now,
          updatedAt: now,
        },
      });
    } catch (err) {
      handlePrismaError("trashDriveFiles", err);
    }
  }

  for (const fileId of fileIds) {
    upsertCacheFile(effectiveId, fileId, (existing) => ({
      ...existing,
      trashed: true,
      trashedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }));
  }
  return true;
}

export async function restoreDriveFiles(
  userId: string,
  fileIds: string[]
): Promise<boolean> {
  const effectiveId = userId || "guest";
  const now = new Date();

  if (isPrismaActive()) {
    try {
      await prisma.driveFile.updateMany({
        where: { id: { in: fileIds } },
        data: {
          trashed: false,
          trashedAt: null,
          updatedAt: now,
        },
      });
    } catch (err) {
      handlePrismaError("restoreDriveFiles", err);
    }
  }

  for (const fileId of fileIds) {
    upsertCacheFile(effectiveId, fileId, (existing) => ({
      ...existing,
      trashed: false,
      trashedAt: null,
      updatedAt: now.toISOString(),
    }));
  }
  return true;
}

export async function permanentlyDeleteDriveFiles(
  userId: string,
  fileIds: string[]
): Promise<boolean> {
  const effectiveId = userId || "guest";
  if (isPrismaActive()) {
    try {
      await prisma.driveFile.deleteMany({
        where: { id: { in: fileIds } },
      });
    } catch (err) {
      handlePrismaError("permanentlyDeleteDriveFiles", err);
    }
  }

  const cached = getOrInitCache(effectiveId);
  cached.files = cached.files.filter((f) => !fileIds.includes(f.id));
  return true;
}

export async function moveDriveFiles(
  userId: string,
  fileIds: string[],
  targetFolderId: string | null
): Promise<boolean> {
  const effectiveId = userId || "guest";
  const now = new Date();

  if (isPrismaActive()) {
    try {
      await prisma.driveFile.updateMany({
        where: { id: { in: fileIds } },
        data: {
          folderId: targetFolderId,
          updatedAt: now,
        },
      });
    } catch (err) {
      handlePrismaError("moveDriveFiles", err);
    }
  }

  for (const fileId of fileIds) {
    upsertCacheFile(effectiveId, fileId, (existing) => ({
      ...existing,
      folderId: targetFolderId,
      updatedAt: now.toISOString(),
    }));
  }
  return true;
}
