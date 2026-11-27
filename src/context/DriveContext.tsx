"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useDeferredValue,
} from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  DriveFile,
  DriveFolder,
  StorageQuotaStats,
  calculateStorageStats,
} from "@/types/drive";
import {
  getUnifiedDriveAction,
  toggleStarAction,
  renameFileAction,
  updatePrivacyAction,
  moveFilesAction,
  trashFilesAction,
  restoreFilesAction,
  deletePermanentlyAction,
  createFolderAction,
  renameFolderAction,
  deleteFolderAction,
} from "@/app/actions/driveActions";

export interface UploadJob {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBytes?: number;
  currentChunk?: number;
  totalChunks?: number;
  progress: number; // 0 to 100
  speed: string; // e.g. "14.2 MB/s"
  eta?: string; // e.g. "12s left"
  status:
    | "initializing"
    | "uploading"
    | "transcoding"
    | "syncing"
    | "complete"
    | "error";
  statusText: string;
  error?: string;
  errorCode?: string;
  completedFile?: DriveFile;
  losslessBitstream?: boolean;
}

export type DriveTab = "my-drive" | "recent" | "starred" | "shared" | "trash";
export type ViewMode = "grid" | "table";
export type SortOption = "date" | "name" | "size" | "duration";
export type SortOrder = "asc" | "desc";
export type PrivacyFilter = "all" | "unlisted" | "private" | "public";

export interface InitialDriveData {
  userId?: string;
  files?: DriveFile[];
  folders?: DriveFolder[];
  stats?: StorageQuotaStats | null;
  source?: string;
  hasYouTubeChannel?: boolean;
}

interface DriveContextType {
  // State
  allFiles: DriveFile[];
  files: DriveFile[];
  folders: DriveFolder[];
  currentFolderId: string | null;
  currentFolder: DriveFolder | null;
  activeTab: DriveTab;
  searchQuery: string;
  privacyFilter: PrivacyFilter;
  viewMode: ViewMode;
  sortBy: SortOption;
  sortOrder: SortOrder;
  selectedFileIds: string[];
  activePreviewFile: DriveFile | null;
  cinemaFile: DriveFile | null;
  storageStats: StorageQuotaStats | null;
  folderFileCounts: Map<string, number>;
  tabCounts: { starred: number; shared: number; trash: number };
  pendingFileIds: string[];
  pendingFolderIds: string[];
  isLoading: boolean;
  isLiveYouTubeSync: boolean;
  hasYouTubeChannel: boolean;
  isSyncing: boolean;
  activeUploads: UploadJob[];

  // Modal states
  isUploadModalOpen: boolean;
  isImportModalOpen: boolean;
  isNewFolderModalOpen: boolean;
  isMoveModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  setIsImportModalOpen: (open: boolean) => void;
  setIsNewFolderModalOpen: (open: boolean) => void;
  setIsMoveModalOpen: (open: boolean) => void;

  // Actions
  refreshDrive: (forceRefresh?: boolean) => Promise<void>;
  resetDriveState: () => void;
  setCurrentFolderId: (id: string | null) => void;
  setActiveTab: (tab: DriveTab) => void;
  setSearchQuery: (query: string) => void;
  setPrivacyFilter: (filter: PrivacyFilter) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortBy: (sort: SortOption) => void;
  toggleSortOrder: () => void;
  toggleFileSelect: (fileId: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
  setActivePreviewFile: (file: DriveFile | null) => void;
  setCinemaFile: (file: DriveFile | null) => void;

  // Drive Operations
  createFolder: (name: string, color?: string) => Promise<boolean>;
  renameFolder: (id: string, newName: string) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  uploadVideoFile: (
    file: File | null,
    options: {
      title: string;
      folderId?: string | null;
      privacy?: "unlisted" | "private" | "public";
      tags?: string[];
      description?: string;
      duration?: string;
      durationSeconds?: number;
      resolution?: string;
    }
  ) => Promise<void>;
  importFromYouTube: (
    url: string,
    folderId?: string | null,
    privacy?: "unlisted" | "private" | "public",
    customName?: string,
    tags?: string[]
  ) => Promise<boolean>;
  toggleStar: (fileId: string) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveSelectedFiles: (targetFolderId: string | null) => Promise<void>;
  trashSelectedFiles: (overrideIds?: string[]) => Promise<void>;
  restoreSelectedFiles: (overrideIds?: string[]) => Promise<void>;
  deleteSelectedFilesPermanently: (overrideIds?: string[]) => Promise<void>;
  updateFilePrivacy: (
    fileId: string,
    privacy: "unlisted" | "private" | "public"
  ) => Promise<void>;
  dismissUploadJob: (id: string) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const DriveContext = createContext<DriveContextType | undefined>(undefined);

/**
 * Capture a JPEG frame from a local video File so newly uploaded videos have an
 * instant real thumbnail before YouTube finishes generating its remote thumbnail.
 */
async function captureVideoFrameDataUrl(file: File): Promise<string | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;

    const finish = (result: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    const drawFrame = () => {
      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) {
          finish(null);
          return;
        }
        const maxWidth = 640;
        const scale = vw > maxWidth ? maxWidth / vw : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(vw * scale);
        canvas.height = Math.round(vh * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        finish(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        finish(null);
      }
    };

    const timeoutId = setTimeout(() => finish(null), 3500);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    video.onloadeddata = () => {
      const targetTime =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(1, Math.max(0.1, video.duration * 0.15))
          : 0;
      if (targetTime > 0 && video.readyState >= 2) {
        try {
          video.currentTime = targetTime;
        } catch {
          drawFrame();
        }
      } else {
        drawFrame();
      }
    };

    video.onseeked = () => drawFrame();
    video.onerror = () => finish(null);
    video.src = objectUrl;
  });
}

export function DriveProvider({
  children,
  initialData,
  initialTab = "my-drive",
  initialFolderId = null,
}: {
  children: React.ReactNode;
  initialData?: InitialDriveData;
  initialTab?: DriveTab;
  initialFolderId?: string | null;
}) {
  // Master datasets stored in client memory for 0ms transitions
  const [allFiles, setAllFiles] = useState<DriveFile[]>(
    () => initialData?.files || []
  );
  const [folders, setFolders] = useState<DriveFolder[]>(
    () => initialData?.folders || []
  );
  const [currentFolderId, setCurrentFolderIdState] = useState<string | null>(
    initialFolderId
  );
  const [activeTab, setActiveTabState] = useState<DriveTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [selectedPreviewFile, setSelectedPreviewFile] =
    useState<DriveFile | null>(null);
  const [cinemaFile, setCinemaFile] = useState<DriveFile | null>(null);

  // If initialData is provided, loading is already false on frame 1!
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !initialData?.files
  );
  const [isLiveYouTubeSync, setIsLiveYouTubeSync] = useState<boolean>(
    () => initialData?.source === "youtube_live"
  );
  const [hasYouTubeChannel, setHasYouTubeChannel] = useState<boolean>(
    () => initialData?.hasYouTubeChannel ?? true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Upload progress dock
  const [activeUploads, setActiveUploads] = useState<UploadJob[]>([]);
  const [pendingFileIds, setPendingFileIds] = useState<string[]>([]);
  const [pendingFolderIds, setPendingFolderIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const addPendingFiles = useCallback((ids: string[]) => {
    setPendingFileIds((prev) => Array.from(new Set([...prev, ...ids])));
  }, []);

  const removePendingFiles = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setPendingFileIds((prev) => prev.filter((id) => !idSet.has(id)));
  }, []);

  const addPendingFolders = useCallback((ids: string[]) => {
    setPendingFolderIds((prev) => Array.from(new Set([...prev, ...ids])));
  }, []);

  const removePendingFolders = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setPendingFolderIds((prev) => prev.filter((id) => !idSet.has(id)));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Update URL search parameters smoothly without full page reload
  const updateUrlParams = useCallback(
    (tab: DriveTab, folderId: string | null) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (tab === "my-drive") {
        url.searchParams.delete("view");
      } else {
        url.searchParams.set("view", tab);
      }

      if (folderId) {
        url.searchParams.set("folderId", folderId);
      } else {
        url.searchParams.delete("folderId");
      }

      window.history.replaceState(null, "", url.toString());
    },
    []
  );

  const setCurrentFolderId = useCallback(
    (id: string | null) => {
      setCurrentFolderIdState(id);
      setSelectedFileIds([]);
      updateUrlParams(activeTab, id);
    },
    [activeTab, updateUrlParams]
  );

  const setActiveTab = useCallback(
    (tab: DriveTab) => {
      setActiveTabState(tab);
      setCurrentFolderIdState(null);
      setSelectedFileIds([]);
      updateUrlParams(tab, null);
    },
    [updateUrlParams]
  );

  // Synchronized active preview file
  const activePreviewFile = useMemo(() => {
    if (!selectedPreviewFile) return null;
    return (
      allFiles.find((f) => f.id === selectedPreviewFile.id) ??
      selectedPreviewFile
    );
  }, [allFiles, selectedPreviewFile]);

  const setActivePreviewFile = useCallback((file: DriveFile | null) => {
    setSelectedPreviewFile(file);
  }, []);

  // Current folder object
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return folders.find((f) => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  // Real-time storage stats derived instantly from allFiles
  const storageStats = useMemo(() => {
    return calculateStorageStats(allFiles);
  }, [allFiles]);

  // Single-pass O(N) folder & sidebar badge counts
  const { folderFileCounts, tabCounts } = useMemo(() => {
    const countsMap = new Map<string, number>();
    let starred = 0;
    let shared = 0;
    let trash = 0;

    for (const f of allFiles) {
      if (f.trashed) {
        trash++;
        continue;
      }
      if (f.folderId) {
        countsMap.set(f.folderId, (countsMap.get(f.folderId) || 0) + 1);
      }
      if (f.starred) starred++;
      if (f.privacy === "unlisted" || f.privacy === "public") shared++;
    }

    return {
      folderFileCounts: countsMap,
      tabCounts: { starred, shared, trash },
    };
  }, [allFiles]);

  // INSTANT IN-MEMORY DERIVED FILES (0ms Latency for Tab change, Folder switch, Search, Sort, Privacy)
  const files = useMemo(() => {
    let list = allFiles;

    // 1. Tab filtering
    if (activeTab === "trash") {
      list = list.filter((f) => f.trashed);
    } else {
      list = list.filter((f) => !f.trashed);

      if (activeTab === "starred") {
        list = list.filter((f) => f.starred);
      } else if (activeTab === "shared") {
        list = list.filter(
          (f) => f.privacy === "unlisted" || f.privacy === "public"
        );
      } else if (activeTab === "my-drive") {
        if (
          currentFolderId &&
          currentFolderId !== "null" &&
          currentFolderId !== "root"
        ) {
          list = list.filter((f) => f.folderId === currentFolderId);
        } else {
          list = list.filter((f) => !f.folderId);
        }
      }
    }

    // 2. Privacy filter
    if (privacyFilter !== "all") {
      list = list.filter((f) => f.privacy === privacyFilter);
    }

    // 3. Search filter with deferred query for 60fps typing
    const query = deferredSearch.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          (f.tags && f.tags.some((t) => t.toLowerCase().includes(query))) ||
          (f.description && f.description.toLowerCase().includes(query)) ||
          (f.videoId && f.videoId.toLowerCase().includes(query))
      );
    }

    // 4. In-memory sorting (Instant!)
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === "size") {
        cmp = (a.size || 0) - (b.size || 0);
      } else if (sortBy === "duration") {
        cmp = (a.durationSeconds || 0) - (b.durationSeconds || 0);
      } else {
        if (activeTab === "recent") {
          cmp =
            new Date(a.updatedAt || a.createdAt).getTime() -
            new Date(b.updatedAt || b.createdAt).getTime();
        } else {
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [
    allFiles,
    activeTab,
    currentFolderId,
    deferredSearch,
    privacyFilter,
    sortBy,
    sortOrder,
  ]);

  const { data: session, status } = useSession();
  const prevUserIdRef = React.useRef<string | null>(null);

  // Immediate instantaneous reset for logout and account switching
  const resetDriveState = useCallback(() => {
    setAllFiles([]);
    setFolders([]);
    setCurrentFolderIdState(null);
    setSelectedFileIds([]);
    setSelectedPreviewFile(null);
    setCinemaFile(null);
    setHasYouTubeChannel(true);
    setIsLoading(true);
  }, []);

  // Silent Background Refresh: Never clears UI or resets scroll
  const refreshDrive = useCallback(async (forceRefresh = false) => {
    try {
      setIsSyncing(true);
      const data = await getUnifiedDriveAction(forceRefresh);
      if (data) {
        setAllFiles((prev) => {
          const localThumbById = new Map<string, string>();
          for (const f of prev) {
            if (f.localThumbnailUrl) {
              localThumbById.set(f.id, f.localThumbnailUrl);
              if (f.videoId) localThumbById.set(f.videoId, f.localThumbnailUrl);
            }
          }
          return (data.files || []).map((f) => {
            const localThumb =
              f.localThumbnailUrl ||
              localThumbById.get(f.id) ||
              (f.videoId ? localThumbById.get(f.videoId) : undefined);
            return localThumb ? { ...f, localThumbnailUrl: localThumb } : f;
          });
        });
        setFolders(data.folders || []);
        setIsLiveYouTubeSync(data.source === "youtube_live");
        if (typeof data.hasYouTubeChannel === "boolean") {
          setHasYouTubeChannel(data.hasYouTubeChannel);
        }
      }
    } catch (err) {
      console.warn("[DriveContext] Silent background sync warning:", err);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  // Sync if session changes or if mounted without initialData
  useEffect(() => {
    if (status === "loading") return;

    const currentUserId = session?.user?.id || "guest";
    const userChanged =
      prevUserIdRef.current !== null &&
      prevUserIdRef.current !== currentUserId;
    prevUserIdRef.current = currentUserId;

    const initialUserMismatch = Boolean(
      initialData?.userId && initialData.userId !== currentUserId
    );

    if (!userChanged && !initialUserMismatch && (allFiles.length > 0 || initialData)) {
      return;
    }

    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      if (userChanged || initialUserMismatch) {
        resetDriveState();
      }
      await refreshDrive(userChanged || initialUserMismatch);
    });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, status, resetDriveState, refreshDrive, allFiles.length, initialData]);

  // Auth event listeners
  useEffect(() => {
    const handleLogoutStart = () => {
      resetDriveState();
    };

    const handleLoggedOut = () => {
      void refreshDrive(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("ytdrive:logout", handleLogoutStart);
      window.addEventListener("ytdrive:logged-out", handleLoggedOut);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ytdrive:logout", handleLogoutStart);
        window.removeEventListener("ytdrive:logged-out", handleLoggedOut);
      }
    };
  }, [resetDriveState, refreshDrive]);

  // Selection handlers
  const toggleFileSelect = useCallback((fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  }, []);

  const selectAllFiles = useCallback(() => {
    setSelectedFileIds(files.map((f) => f.id));
  }, [files]);

  const clearSelection = useCallback(() => {
    setSelectedFileIds([]);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  // 0ms OPTIMISTIC MUTATIONS (Next.js Server Actions Backend)

  // 1. Toggle Star
  const toggleStar = useCallback(
    async (fileId: string) => {
      // Optimistic update (0ms)
      setAllFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, starred: !f.starred } : f
        )
      );

      try {
        const res = await toggleStarAction(fileId);
        if (!res.success) throw new Error("Star failed");
      } catch (err) {
        console.error("Failed to star file:", err);
        // Rollback
        setAllFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, starred: !f.starred } : f
          )
        );
        showToast("Failed to update star.");
      }
    },
    [showToast]
  );

  // 2. Rename File
  const renameFile = useCallback(
    async (fileId: string, newName: string) => {
      const trimmed = newName.trim();
      const current = allFiles.find((f) => f.id === fileId);
      if (!trimmed || !current || current.name === trimmed) return;

      const originalName = current.name;

      // Optimistic update (0ms)
      setAllFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, name: trimmed } : f))
      );
      showToast(`Renamed to "${trimmed}"`);

      try {
        const res = await renameFileAction(fileId, trimmed);
        if (!res.success) throw new Error("Rename failed");
      } catch (err) {
        console.error("Failed to rename file:", err);
        // Rollback
        setAllFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, name: originalName } : f))
        );
        showToast("Failed to rename file.");
      }
    },
    [allFiles, showToast]
  );

  // 3. Update File Privacy
  const updateFilePrivacy = useCallback(
    async (
      fileId: string,
      privacy: "unlisted" | "private" | "public"
    ) => {
      const current =
        allFiles.find((f) => f.id === fileId) ||
        (cinemaFile?.id === fileId ? cinemaFile : undefined);
      if (!current || current.privacy === privacy) return;

      const originalPrivacy = current.privacy;

      // Optimistic update (0ms) for list/inspector
      addPendingFiles([fileId]);
      setAllFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, privacy } : f))
      );

      try {
        const res = await updatePrivacyAction(fileId, privacy);
        if (!res.success) {
          throw new Error(res.error || "Privacy update failed");
        }
        // Update CinemaPlayerModal after YouTube confirms the change so iframe reloads cleanly
        setCinemaFile((prev) =>
          prev && prev.id === fileId ? { ...prev, privacy } : prev
        );
        showToast(`Visibility updated to ${privacy}`);
      } catch (err) {
        console.warn("Failed to update privacy:", err);
        // Rollback
        setAllFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, privacy: originalPrivacy } : f
          )
        );
        setCinemaFile((prev) =>
          prev && prev.id === fileId ? { ...prev, privacy: originalPrivacy } : prev
        );
        showToast(
          err instanceof Error && err.message
            ? err.message
            : "Failed to update privacy."
        );
      } finally {
        removePendingFiles([fileId]);
      }
    },
    [allFiles, cinemaFile, showToast, addPendingFiles, removePendingFiles]
  );

  // 4. Move Files
  const moveSelectedFiles = useCallback(
    async (targetFolderId: string | null) => {
      if (selectedFileIds.length === 0) return;
      const idsToMove = [...selectedFileIds];
      const previousFiles = allFiles;
      const folderName = targetFolderId
        ? folders.find((f) => f.id === targetFolderId)?.name || "folder"
        : "My Drive";

      // Optimistic update (0ms)
      setAllFiles((prev) =>
        prev.map((f) =>
          idsToMove.includes(f.id) ? { ...f, folderId: targetFolderId } : f
        )
      );
      setSelectedFileIds([]);
      showToast(
        `Moved ${idsToMove.length} item${
          idsToMove.length > 1 ? "s" : ""
        } to ${folderName}.`
      );

      try {
        const res = await moveFilesAction(idsToMove, targetFolderId);
        if (!res.success) throw new Error("Move failed");
      } catch (err) {
        console.error("Failed to move files:", err);
        setAllFiles(previousFiles);
        showToast("Failed to move files.");
      }
    },
    [selectedFileIds, allFiles, folders, showToast]
  );

  // 5. Trash Files
  const trashSelectedFiles = useCallback(
    async (overrideIds?: string[]) => {
      const idsToTrash =
        Array.isArray(overrideIds) && overrideIds.length > 0
          ? [...overrideIds]
          : [...selectedFileIds];
      if (idsToTrash.length === 0) return;
      const count = idsToTrash.length;
      const nowIso = new Date().toISOString();

      addPendingFiles(idsToTrash);
      // Optimistic update (0ms)
      setAllFiles((prev) =>
        prev.map((f) =>
          idsToTrash.includes(f.id)
            ? { ...f, trashed: true, trashedAt: nowIso }
            : f
        )
      );
      setSelectedFileIds((prev) =>
        prev.filter((id) => !idsToTrash.includes(id))
      );
      if (activePreviewFile && idsToTrash.includes(activePreviewFile.id)) {
        setSelectedPreviewFile(null);
      }
      showToast(`Moved ${count} item${count > 1 ? "s" : ""} to Trash.`);

      try {
        const res = await trashFilesAction(idsToTrash);
        if (!res.success) throw new Error("Trash failed");
      } catch (err) {
        console.error("Failed to trash files:", err);
        // Rollback
        setAllFiles((prev) =>
          prev.map((f) =>
            idsToTrash.includes(f.id)
              ? { ...f, trashed: false, trashedAt: null }
              : f
          )
        );
        showToast("Failed to move to trash.");
      } finally {
        removePendingFiles(idsToTrash);
      }
    },
    [selectedFileIds, activePreviewFile, showToast, addPendingFiles, removePendingFiles]
  );

  // 6. Restore Files
  const restoreSelectedFiles = useCallback(
    async (overrideIds?: string[]) => {
      const idsToRestore =
        Array.isArray(overrideIds) && overrideIds.length > 0
          ? [...overrideIds]
          : [...selectedFileIds];
      if (idsToRestore.length === 0) return;
      const count = idsToRestore.length;

      addPendingFiles(idsToRestore);
      // Optimistic update (0ms)
      setAllFiles((prev) =>
        prev.map((f) =>
          idsToRestore.includes(f.id)
            ? { ...f, trashed: false, trashedAt: null }
            : f
        )
      );
      setSelectedFileIds((prev) =>
        prev.filter((id) => !idsToRestore.includes(id))
      );
      showToast(`Restored ${count} item${count > 1 ? "s" : ""} from Trash.`);

      try {
        const res = await restoreFilesAction(idsToRestore);
        if (!res.success) throw new Error("Restore failed");
      } catch (err) {
        console.error("Failed to restore files:", err);
        // Rollback
        setAllFiles((prev) =>
          prev.map((f) =>
            idsToRestore.includes(f.id)
              ? { ...f, trashed: true, trashedAt: new Date().toISOString() }
              : f
          )
        );
        showToast("Failed to restore files.");
      } finally {
        removePendingFiles(idsToRestore);
      }
    },
    [selectedFileIds, showToast, addPendingFiles, removePendingFiles]
  );

  // 7. Permanently Delete Files
  const deleteSelectedFilesPermanently = useCallback(
    async (overrideIds?: string[]) => {
      const idsToDelete =
        Array.isArray(overrideIds) && overrideIds.length > 0
          ? [...overrideIds]
          : [...selectedFileIds];
      if (idsToDelete.length === 0) return;
      const count = idsToDelete.length;
      const previousFiles = allFiles;
      const videoIdsToDelete = allFiles
        .filter((f) => idsToDelete.includes(f.id))
        .map((f) => f.videoId)
        .filter((id): id is string => Boolean(id));

      addPendingFiles(idsToDelete);
      // Optimistic update (0ms)
      setAllFiles((prev) => prev.filter((f) => !idsToDelete.includes(f.id)));
      setSelectedFileIds((prev) =>
        prev.filter((id) => !idsToDelete.includes(id))
      );
      if (activePreviewFile && idsToDelete.includes(activePreviewFile.id)) {
        setSelectedPreviewFile(null);
      }
      showToast(`Permanently deleted ${count} item${count > 1 ? "s" : ""}.`);

      try {
        const res = await deletePermanentlyAction(idsToDelete, videoIdsToDelete);
        if (!res.success) throw new Error("Delete failed");
      } catch (err) {
        console.error("Failed to delete permanently:", err);
        setAllFiles(previousFiles);
        showToast("Failed to delete files.");
      } finally {
        removePendingFiles(idsToDelete);
      }
    },
    [selectedFileIds, allFiles, activePreviewFile, showToast, addPendingFiles, removePendingFiles]
  );

  // 8. Create Folder
  const createFolder = useCallback(
    async (name: string, color = "blue") => {
      const trimmed = name.trim() || "Untitled Folder";
      const tempId = `folder_${Date.now()}`;
      const now = new Date().toISOString();
      const optimisticFolder: DriveFolder = {
        id: tempId,
        name: trimmed,
        color: color || "blue",
        parentId: null,
        createdAt: now,
        updatedAt: now,
      };

      // Optimistic update (0ms)
      setFolders((prev) => [...prev, optimisticFolder]);
      showToast(`Folder "${trimmed}" created.`);

      try {
        const res = await createFolderAction(trimmed, color);
        if (res.success && res.folder) {
          setFolders((prev) =>
            prev.map((f) => (f.id === tempId ? res.folder! : f))
          );
          return true;
        }
        throw new Error("Folder creation failed");
      } catch (err) {
        console.error("Failed to create folder:", err);
        setFolders((prev) => prev.filter((f) => f.id !== tempId));
        showToast("Failed to create folder.");
        return false;
      }
    },
    [showToast]
  );

  // 9. Rename Folder
  const renameFolder = useCallback(
    async (id: string, newName: string) => {
      const trimmed = newName.trim();
      const previousFolders = folders;
      if (!trimmed) return false;

      addPendingFolders([id]);
      // Optimistic update (0ms)
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name: trimmed } : f))
      );
      showToast(`Folder renamed to "${trimmed}".`);

      try {
        const res = await renameFolderAction(id, trimmed);
        if (!res.success) throw new Error("Folder rename failed");
        return true;
      } catch (err) {
        console.error("Failed to rename folder:", err);
        setFolders(previousFolders);
        showToast("Failed to rename folder.");
        return false;
      } finally {
        removePendingFolders([id]);
      }
    },
    [folders, showToast, addPendingFolders, removePendingFolders]
  );

  // 10. Delete Folder
  const deleteFolder = useCallback(
    async (id: string) => {
      const previousFolders = folders;
      const previousFiles = allFiles;

      addPendingFolders([id]);
      // Optimistic update (0ms)
      setFolders((prev) => prev.filter((f) => f.id !== id));
      setAllFiles((prev) =>
        prev.map((f) => (f.folderId === id ? { ...f, folderId: null } : f))
      );
      if (currentFolderId === id) setCurrentFolderIdState(null);
      showToast("Folder deleted. Contents moved to My Drive.");

      try {
        const res = await deleteFolderAction(id);
        if (!res.success) throw new Error("Delete folder failed");
        return true;
      } catch (err) {
        console.error("Failed to delete folder:", err);
        setFolders(previousFolders);
        setAllFiles(previousFiles);
        showToast("Failed to delete folder.");
        return false;
      } finally {
        removePendingFolders([id]);
      }
    },
    [folders, allFiles, currentFolderId, showToast, addPendingFolders, removePendingFolders]
  );

  // 11. Import from YouTube
  const importFromYouTube = useCallback(
    async (
      url: string,
      folderId?: string | null,
      privacy?: "unlisted" | "private" | "public",
      customName?: string,
      tags?: string[]
    ) => {
      try {
        const res = await axios.post("/api/drive/import-youtube", {
          url,
          folderId: folderId || currentFolderId || null,
          privacy: privacy || "unlisted",
          customName,
          tags,
        });

        if (res.data?.success && res.data.file) {
          // Instantly inject newly imported file into memory (0ms)
          setAllFiles((prev) => [res.data.file, ...prev]);
          showToast(`"${res.data.file.name}" imported to Cloud Drive.`);
          return true;
        }
        return false;
      } catch (err) {
        const errorMsg =
          axios.isAxiosError(err) && err.response?.data?.error
            ? err.response.data.error
            : "Failed to import video";
        showToast(errorMsg);
        return false;
      }
    },
    [currentFolderId, showToast]
  );

  // 12. Chunk-based Video Upload
  const uploadVideoFile = useCallback(
    async (
      file: File | null,
      options: {
        title: string;
        folderId?: string | null;
        privacy?: "unlisted" | "private" | "public";
        tags?: string[];
        description?: string;
        duration?: string;
        durationSeconds?: number;
        resolution?: string;
      }
    ) => {
      const jobId = `job_${Date.now()}`;
      const fileName = options.title || file?.name || "Video.mp4";
      const fileSize = file ? file.size : 0;

      // Require a physical video file so every upload goes to YouTube
      if (!file || fileSize === 0) {
        showToast("Please select a valid video file to upload to YouTube.");
        return;
      }

      // Initialize upload job in dock
      const newJob: UploadJob = {
        id: jobId,
        fileName,
        fileSize,
        uploadedBytes: 0,
        currentChunk: 0,
        totalChunks: 1,
        progress: 0,
        speed: "0 MB/s",
        eta: "estimating...",
        status: "initializing",
        statusText: "Connecting to YouTube Data API v3...",
        losslessBitstream: true,
      };

      setActiveUploads((prev) => [newJob, ...prev]);

      // Start capturing a local preview frame in parallel with upload
      const localFramePromise = captureVideoFrameDataUrl(file);

      try {
        const initRes = await axios.post("/api/drive/upload/chunk", {
          action: "init",
          fileName,
          fileSize,
          mimeType: file.type || "video/mp4",
          metadata: {
            title: fileName,
            folderId: options.folderId || currentFolderId || null,
            privacy: options.privacy || "unlisted",
            tags: options.tags || [],
            description: options.description || "",
            duration: options.duration || "0:00",
            durationSeconds: options.durationSeconds || 0,
            resolution: options.resolution || "1080p 60fps",
          },
        });

        if (!initRes.data?.uploadId) {
          throw new Error(
            initRes.data?.error || "Could not initialize upload session"
          );
        }

        const uploadId = initRes.data.uploadId;
        const chunkSize = initRes.data.chunkSize || 5 * 1024 * 1024;
        const totalChunks = Math.ceil(fileSize / chunkSize);

        setActiveUploads((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  totalChunks,
                  status: "uploading",
                  statusText: `Uploading 0% to YouTube Cloud...`,
                }
              : j
          )
        );

        let uploadedBytes = 0;
        let lastTimestamp = Date.now();
        let lastBytes = 0;
        let completedFileResult: DriveFile | undefined;

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * chunkSize;
          const end = Math.min(start + chunkSize, fileSize);
          const chunkBlob = file.slice(start, end);

          const formData = new FormData();
          formData.append("uploadId", uploadId);
          formData.append("chunkIndex", chunkIndex.toString());
          formData.append("start", start.toString());
          formData.append("end", (end - 1).toString());
          formData.append("totalSize", fileSize.toString());
          formData.append("chunk", chunkBlob, file.name);

          const chunkRes = await axios.post(
            "/api/drive/upload/chunk",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          uploadedBytes = end;
          const now = Date.now();
          const timeDiff = (now - lastTimestamp) / 1000;
          const bytesDiff = uploadedBytes - lastBytes;
          const speedBps = timeDiff > 0 ? bytesDiff / timeDiff : 0;
          const speedMBps = (speedBps / (1024 * 1024)).toFixed(1);
          const remainingBytes = fileSize - uploadedBytes;
          const etaSecs =
            speedBps > 0 ? Math.ceil(remainingBytes / speedBps) : 0;
          const progressPercent = Math.min(
            100,
            Math.round((uploadedBytes / fileSize) * 100)
          );

          lastTimestamp = now;
          lastBytes = uploadedBytes;

          if (chunkRes.data?.status === "complete") {
            completedFileResult = chunkRes.data.file;
            break;
          }

          setActiveUploads((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    currentChunk: chunkIndex + 1,
                    uploadedBytes,
                    progress: progressPercent,
                    speed: `${speedMBps} MB/s`,
                    eta: etaSecs > 0 ? `${etaSecs}s left` : "finishing...",
                    statusText: `Uploading to YouTube (${progressPercent}%)...`,
                  }
                : j
            )
          );
        }

        if (completedFileResult) {
          const localThumb = await localFramePromise;
          if (localThumb) {
            completedFileResult = {
              ...completedFileResult,
              localThumbnailUrl: localThumb,
            };
          }
          // Immediately inject file into memory (0ms)
          setAllFiles((prev) => [completedFileResult!, ...prev]);
        }

        setActiveUploads((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  progress: 100,
                  speed: "0 MB/s",
                  eta: "Done",
                  status: "complete",
                  statusText: "Uploaded to YouTube Backend Cloud Storage!",
                  completedFile: completedFileResult,
                }
              : j
          )
        );
      } catch (err: unknown) {
        const errorCode = axios.isAxiosError(err)
          ? (err.response?.data?.code as string | undefined)
          : undefined;
        const requiresChannel =
          errorCode === "YOUTUBE_CHANNEL_REQUIRED" ||
          Boolean(
            axios.isAxiosError(err) &&
              err.response?.data?.requiresYouTubeChannel
          );

        if (requiresChannel) {
          setHasYouTubeChannel(false);
          console.warn("YouTube channel required before uploading:", err);
        } else if (errorCode === "YOUTUBE_AUTH_EXPIRED") {
          console.warn("YouTube auth expired:", err);
        } else {
          console.error("Upload error:", err);
        }

        const errorMsg =
          axios.isAxiosError(err) &&
          (err.response?.data?.message || err.response?.data?.error)
            ? (err.response.data.message || err.response.data.error)
            : err instanceof Error
            ? err.message
            : "Upload failed";

        setActiveUploads((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  status: "error",
                  statusText: requiresChannel
                    ? "YouTube channel required"
                    : "Upload error",
                  error: errorMsg,
                  errorCode: requiresChannel
                    ? "YOUTUBE_CHANNEL_REQUIRED"
                    : errorCode,
                }
              : j
          )
        );
        showToast(
          requiresChannel
            ? "Create a YouTube channel first before uploading videos."
            : "Upload failed: " + errorMsg
        );
      }
    },
    [currentFolderId, showToast]
  );

  const dismissUploadJob = useCallback((id: string) => {
    setActiveUploads((prev) => prev.filter((job) => job.id !== id));
  }, []);

  const contextValue = useMemo<DriveContextType>(
    () => ({
      allFiles,
      files,
      folders,
      currentFolderId,
      currentFolder,
      activeTab,
      searchQuery,
      privacyFilter,
      viewMode,
      sortBy,
      sortOrder,
      selectedFileIds,
      activePreviewFile,
      cinemaFile,
      storageStats,
      folderFileCounts,
      tabCounts,
      pendingFileIds,
      pendingFolderIds,
      isLoading,
      isLiveYouTubeSync,
      hasYouTubeChannel,
      isSyncing,
      activeUploads,
      isUploadModalOpen,
      isImportModalOpen,
      isNewFolderModalOpen,
      isMoveModalOpen,
      setIsUploadModalOpen,
      setIsImportModalOpen,
      setIsNewFolderModalOpen,
      setIsMoveModalOpen,
      refreshDrive,
      resetDriveState,
      setCurrentFolderId,
      setActiveTab,
      setSearchQuery,
      setPrivacyFilter,
      setViewMode,
      setSortBy,
      toggleSortOrder,
      toggleFileSelect,
      selectAllFiles,
      clearSelection,
      setActivePreviewFile,
      setCinemaFile,
      createFolder,
      renameFolder,
      deleteFolder,
      uploadVideoFile,
      importFromYouTube,
      toggleStar,
      renameFile,
      moveSelectedFiles,
      trashSelectedFiles,
      restoreSelectedFiles,
      deleteSelectedFilesPermanently,
      updateFilePrivacy,
      dismissUploadJob,
      toastMessage,
      showToast,
      clearToast,
    }),
    [
      allFiles,
      files,
      folders,
      currentFolderId,
      currentFolder,
      activeTab,
      searchQuery,
      privacyFilter,
      viewMode,
      sortBy,
      sortOrder,
      selectedFileIds,
      activePreviewFile,
      cinemaFile,
      storageStats,
      folderFileCounts,
      tabCounts,
      pendingFileIds,
      pendingFolderIds,
      isLoading,
      isLiveYouTubeSync,
      hasYouTubeChannel,
      isSyncing,
      activeUploads,
      isUploadModalOpen,
      isImportModalOpen,
      isNewFolderModalOpen,
      isMoveModalOpen,
      refreshDrive,
      resetDriveState,
      setCurrentFolderId,
      setActiveTab,
      toggleSortOrder,
      toggleFileSelect,
      selectAllFiles,
      clearSelection,
      setActivePreviewFile,
      createFolder,
      renameFolder,
      deleteFolder,
      uploadVideoFile,
      importFromYouTube,
      toggleStar,
      renameFile,
      moveSelectedFiles,
      trashSelectedFiles,
      restoreSelectedFiles,
      deleteSelectedFilesPermanently,
      updateFilePrivacy,
      dismissUploadJob,
      toastMessage,
      showToast,
      clearToast,
    ]
  );

  return (
    <DriveContext.Provider value={contextValue}>
      {children}
    </DriveContext.Provider>
  );
}

export function useDrive() {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error("useDrive must be used within a DriveProvider");
  }
  return context;
}
