"use client";

import { useState, useRef, useEffect } from "react";
import { useDrive } from "@/context/DriveContext";
import { formatBytes } from "@/utils/format";
import { SkeletonBlock } from "@/components/ui/Loaders";
import {
  Plus,
  HardDrive,
  Clock,
  Star,
  Share2,
  Trash2,
  Upload,
  Link2,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Cloud,
  X,
} from "lucide-react";

interface DriveSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function DriveSidebar({
  isMobileOpen = false,
  onCloseMobile,
}: DriveSidebarProps) {
  const {
    activeTab,
    setActiveTab,
    currentFolderId,
    setCurrentFolderId,
    folders,
    folderFileCounts,
    tabCounts,
    isLoading,
    storageStats,
    setIsUploadModalOpen,
    setIsImportModalOpen,
    setIsNewFolderModalOpen,
  } = useDrive();

  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const newMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const usedSize = formatBytes(storageStats?.usedBytes || 0);
  const quotaPct =
    (storageStats?.usedBytes || 0) > 0
      ? Math.min(
          100,
          Math.max(
            3,
            Math.round(
              ((storageStats?.usedBytes || 0) / (100 * 1024 * 1024 * 1024)) * 100
            )
          )
        )
      : 0;

  const starredCount = tabCounts.starred;
  const trashCount = tabCounts.trash;
  const sharedCount = tabCounts.shared;

  const colorMap: Record<string, string> = {
    blue: "bg-sky-500",
    emerald: "bg-emerald-500",
    purple: "bg-violet-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    zinc: "bg-slate-400",
  };

  const navigateAndCloseMobile = (fn: () => void) => {
    fn();
    onCloseMobile?.();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Mobile Header inside Drawer */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1 lg:hidden">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Navigation
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Primary Action Button: + New */}
      <div className="p-3.5" ref={newMenuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            aria-expanded={isNewMenuOpen}
            className="w-full h-10 bg-[var(--accent-cta-bg)] hover:opacity-90 text-[var(--accent-cta-fg)] rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            <span>New</span>
          </button>

          {isNewMenuOpen && (
            <div className="absolute left-0 top-12 w-full min-w-52 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(true);
                  setIsNewMenuOpen(false);
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer font-medium"
              >
                <Upload className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />
                <span>Upload video</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(true);
                  setIsNewMenuOpen(false);
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer font-medium"
              >
                <Link2 className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                <span>Save from YouTube URL</span>
              </button>

              <div className="border-t border-[var(--border-hairline)] my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsNewFolderModalOpen(true);
                  setIsNewMenuOpen(false);
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer font-medium"
              >
                <FolderPlus className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                <span>New folder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Tree */}
      <nav
        aria-label="Drive sections"
        className="flex-1 px-3 space-y-1 overflow-y-auto studio-scroll"
      >
        {/* My Drive (Root) */}
        <div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                navigateAndCloseMobile(() => {
                  setActiveTab("my-drive");
                  setCurrentFolderId(null);
                })
              }
              className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                activeTab === "my-drive" && currentFolderId === null
                  ? "bg-[var(--bg-muted)] text-[var(--text-primary)] font-semibold"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
              }`}
            >
              <HardDrive
                className={`w-4 h-4 shrink-0 ${
                  activeTab === "my-drive" && currentFolderId === null
                    ? "text-[var(--accent-brand)]"
                    : "text-[var(--text-muted)]"
                }`}
                aria-hidden="true"
              />
              <span>My Drive</span>
            </button>

            {folders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
                aria-expanded={isFoldersExpanded}
                aria-label={isFoldersExpanded ? "Collapse folders" : "Expand folders"}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] rounded-lg cursor-pointer transition-colors"
              >
                {isFoldersExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            )}
          </div>

          {/* Collapsible Folders Sub-tree */}
          {isFoldersExpanded && isLoading && folders.length === 0 && (
            <div className="pl-3 pr-1 py-1.5 space-y-1.5 border-l border-[var(--border-hairline)] ml-4.5 mt-0.5">
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} className="h-6 w-full rounded-lg" />
              ))}
            </div>
          )}

          {isFoldersExpanded && folders.length > 0 && (
            <div className="pl-3 pr-1 py-1 space-y-0.5 border-l border-[var(--border-hairline)] ml-4.5 mt-0.5">
              {folders.map((folder) => {
                const folderFilesCount = folderFileCounts.get(folder.id) || 0;
                const isSelected =
                  activeTab === "my-drive" && currentFolderId === folder.id;

                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() =>
                      navigateAndCloseMobile(() => {
                        setActiveTab("my-drive");
                        setCurrentFolderId(folder.id);
                      })
                    }
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[var(--bg-muted)] text-[var(--text-primary)] font-semibold"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          colorMap[folder.color || "blue"] || colorMap.blue
                        }`}
                      />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    {folderFilesCount > 0 && (
                      <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] ml-2">
                        {folderFilesCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent */}
        <button
          type="button"
          onClick={() => navigateAndCloseMobile(() => setActiveTab("recent"))}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
            activeTab === "recent"
              ? "bg-[var(--bg-muted)] text-[var(--text-primary)] font-semibold"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Clock
              className={`w-4 h-4 shrink-0 ${
                activeTab === "recent"
                  ? "text-[var(--accent-brand)]"
                  : "text-[var(--text-muted)]"
              }`}
              aria-hidden="true"
            />
            <span>Recent</span>
          </div>
        </button>

        {/* Starred */}
        <button
          type="button"
          onClick={() => navigateAndCloseMobile(() => setActiveTab("starred"))}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
            activeTab === "starred"
              ? "bg-[var(--bg-muted)] text-[var(--text-primary)] font-semibold"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Star
              className={`w-4 h-4 shrink-0 ${
                activeTab === "starred"
                  ? "text-amber-500"
                  : "text-[var(--text-muted)]"
              }`}
              aria-hidden="true"
            />
            <span>Starred</span>
          </div>
          {starredCount > 0 && (
            <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
              {starredCount}
            </span>
          )}
        </button>

        {/* Shared */}
        <button
          type="button"
          onClick={() => navigateAndCloseMobile(() => setActiveTab("shared"))}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
            activeTab === "shared"
              ? "bg-[var(--bg-muted)] text-[var(--text-primary)] font-semibold"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Share2
              className={`w-4 h-4 shrink-0 ${
                activeTab === "shared"
                  ? "text-[var(--accent-brand)]"
                  : "text-[var(--text-muted)]"
              }`}
              aria-hidden="true"
            />
            <span>Shared</span>
          </div>
          {sharedCount > 0 && (
            <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
              {sharedCount}
            </span>
          )}
        </button>

        {/* Trash */}
        <button
          type="button"
          onClick={() => navigateAndCloseMobile(() => setActiveTab("trash"))}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
            activeTab === "trash"
              ? "bg-[var(--bg-muted)] text-[var(--text-primary)] font-semibold"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Trash2
              className={`w-4 h-4 shrink-0 ${
                activeTab === "trash"
                  ? "text-[var(--accent-brand)]"
                  : "text-[var(--text-muted)]"
              }`}
              aria-hidden="true"
            />
            <span>Trash</span>
          </div>
          {trashCount > 0 && (
            <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
              {trashCount}
            </span>
          )}
        </button>
      </nav>

      {/* Storage Capacity Card */}
      <div className="p-3.5 border-t border-[var(--border-hairline)]">
        <div className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-[var(--text-secondary)]">
              <Cloud className="w-3.5 h-3.5 text-[var(--accent-brand)]" aria-hidden="true" />
              <span>Cloud Vault</span>
            </span>
            <span className="font-mono tabular-nums text-[var(--text-muted)]">
              {usedSize}
            </span>
          </div>
          <div className="w-full bg-[var(--bg-muted)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${quotaPct}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            {storageStats?.totalFiles || 0} active video
            {(storageStats?.totalFiles || 0) === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Docked Rail */}
      <aside className="hidden lg:flex w-62 border-r border-[var(--border-hairline)] bg-[var(--bg-surface)]/80 backdrop-blur-xl flex-col shrink-0 select-none h-[calc(100vh-3.75rem)] sticky top-15">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={onCloseMobile}
            aria-hidden="true"
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Drive navigation"
            className="relative w-72 max-w-[82vw] h-full bg-[var(--bg-surface)] border-r border-[var(--border-strong)] shadow-2xl z-10 flex flex-col select-none"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
