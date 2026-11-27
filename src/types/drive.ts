export interface DriveFile {
  id: string;
  name: string;
  videoId?: string;
  youtubeUrl?: string;
  fileUrl?: string; // Local/hosted direct video URL if uploaded file
  size: number; // in bytes
  duration: string; // e.g. "12:45"
  durationSeconds: number;
  resolution: string; // e.g. "1080p 60fps"
  mimeType: string;
  thumbnailUrl: string;
  localThumbnailUrl?: string;
  folderId: string | null; // null = root "My Drive"
  privacy: "unlisted" | "private" | "public";
  starred: boolean;
  trashed: boolean;
  trashedAt?: string | null;
  tags: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
  backendStorage: "youtube_cloud" | "local_cloud";
}

export interface DriveFolder {
  id: string;
  name: string;
  color: string; // e.g. "blue", "emerald", "amber", "purple", "rose", "zinc"
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserDriveData {
  folders: DriveFolder[];
  files: DriveFile[];
}

export interface StorageQuotaStats {
  usedBytes: number;
  totalFiles: number;
  totalDurationSeconds: number;
  unlistedCount: number;
  privateCount: number;
  publicCount: number;
}

export const DEFAULT_FOLDERS: DriveFolder[] = [];
export const DEFAULT_FILES: DriveFile[] = [];

/**
 * Pure calculation function safe for both client and server runtime.
 */
export function calculateStorageStats(files: DriveFile[]): StorageQuotaStats {
  const activeFiles = files.filter((f) => !f.trashed);
  const usedBytes = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalDurationSeconds = activeFiles.reduce(
    (acc, f) => acc + (f.durationSeconds || 0),
    0
  );
  const unlistedCount = activeFiles.filter(
    (f) => f.privacy === "unlisted"
  ).length;
  const privateCount = activeFiles.filter(
    (f) => f.privacy === "private"
  ).length;
  const publicCount = activeFiles.filter(
    (f) => f.privacy === "public"
  ).length;

  return {
    usedBytes,
    totalFiles: activeFiles.length,
    totalDurationSeconds,
    unlistedCount,
    privateCount,
    publicCount,
  };
}
