"use client";

import { useState, useRef, useEffect } from "react";
import { useDrive, SortOption } from "@/context/DriveContext";
import { StudioSpinner } from "@/components/ui/Loaders";
import {
  ChevronRight,
  HardDrive,
  Folder,
  Star,
  Trash2,
  Share2,
  Clock,
  FolderInput,
  RotateCcw,
  X,
  Copy,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronDown,
  Check,
} from "lucide-react";

export default function DriveBreadcrumbs() {
  const {
    activeTab,
    currentFolderId,
    setCurrentFolderId,
    currentFolder,
    selectedFileIds,
    clearSelection,
    selectAllFiles,
    files,
    trashSelectedFiles,
    restoreSelectedFiles,
    deleteSelectedFilesPermanently,
    setIsMoveModalOpen,
    showToast,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    pendingFileIds,
  } = useDrive();

  const isBulkPending = selectedFileIds.some((id) => pendingFileIds.includes(id));

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsSortOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isTrashView = activeTab === "trash";
  const selectionCount = selectedFileIds.length;

  const getTabMeta = () => {
    switch (activeTab) {
      case "recent":
        return {
          label: "Recent",
          icon: <Clock className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />,
        };
      case "starred":
        return {
          label: "Starred",
          icon: <Star className="w-4 h-4 text-amber-500" aria-hidden="true" />,
        };
      case "shared":
        return {
          label: "Shared",
          icon: <Share2 className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />,
        };
      case "trash":
        return {
          label: "Trash",
          icon: <Trash2 className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />,
        };
      default:
        return {
          label: "My Drive",
          icon: <HardDrive className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />,
        };
    }
  };

  const copySelectedLinks = () => {
    const selectedFiles = files.filter((f) => selectedFileIds.includes(f.id));
    const urls = selectedFiles
      .map((f) => f.youtubeUrl || f.fileUrl)
      .filter(Boolean)
      .join("\n");
    if (navigator.clipboard && urls) {
      navigator.clipboard.writeText(urls);
      showToast(
        `Copied ${selectedFiles.length} link${
          selectedFiles.length > 1 ? "s" : ""
        } to clipboard.`
      );
    }
  };

  return (
    <div className="min-h-12 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/65 backdrop-blur-md px-4 sm:px-6 lg:px-7 py-2 flex items-center justify-between gap-3 text-xs select-none relative z-20">
      {selectionCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Clear selection"
              className="h-7 w-7 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="font-semibold text-[var(--text-primary)] font-mono tabular-nums">
              {selectionCount} selected
            </span>
            <button
              type="button"
              onClick={selectAllFiles}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-medium underline underline-offset-2 cursor-pointer ml-1"
            >
              Select all ({files.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {!isTrashView ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-medium text-xs transition-colors cursor-pointer"
                >
                  <FolderInput className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                  <span>Move</span>
                </button>
                <button
                  type="button"
                  onClick={copySelectedLinks}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-medium text-xs transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                  <span>Copy links</span>
                </button>
                <button
                  type="button"
                  disabled={isBulkPending}
                  onClick={() => void trashSelectedFiles()}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium text-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isBulkPending ? (
                    <StudioSpinner size={13} thickness={2} label="Moving to trash" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>Trash</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isBulkPending}
                  onClick={() => void restoreSelectedFiles()}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] text-[var(--text-primary)] font-medium text-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isBulkPending ? (
                    <StudioSpinner size={13} thickness={2} label="Restoring" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  )}
                  <span>Restore</span>
                </button>
                <button
                  type="button"
                  disabled={isBulkPending}
                  onClick={() => void deleteSelectedFilesPermanently()}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium text-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isBulkPending ? (
                    <StudioSpinner size={13} thickness={2} label="Deleting" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>Delete permanently</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Breadcrumbs Trail */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[var(--text-secondary)] min-w-0"
          >
            {activeTab === "my-drive" ? (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentFolderId(null)}
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                    currentFolderId === null
                      ? "text-[var(--text-primary)] font-semibold"
                      : "hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)]"
                  }`}
                >
                  <HardDrive
                    className={`w-4 h-4 ${
                      currentFolderId === null
                        ? "text-[var(--accent-brand)]"
                        : "text-[var(--text-muted)]"
                    }`}
                    aria-hidden="true"
                  />
                  <span>My Drive</span>
                </button>

                {currentFolder && (
                  <>
                    <ChevronRight
                      className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[var(--text-primary)] font-semibold truncate">
                      <Folder
                        className="w-4 h-4 text-[var(--accent-brand)] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">{currentFolder.name}</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 px-1 py-1 text-[var(--text-primary)] font-semibold">
                {getTabMeta().icon}
                <span>{getTabMeta().label}</span>
              </div>
            )}
          </nav>

          {/* Right Controls: View Mode & Sort */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Layout view"
              className="flex items-center bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded-xl p-0.5"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                aria-label="Grid view"
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-hairline)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-pressed={viewMode === "table"}
                aria-label="Table view"
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-hairline)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
                title="Table view"
              >
                <List className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative" ref={sortRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                aria-expanded={isSortOpen}
                aria-label="Sort videos"
                className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] text-xs text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
                title="Sort options"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                <span className="capitalize text-xs">{sortBy}</span>
                <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" aria-hidden="true" />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-9.5 w-44 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-1.5 z-50 text-xs">
                  <div className="px-2.5 py-1.5 text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Sort by
                  </div>
                  {(["date", "name", "size", "duration"] as SortOption[]).map(
                    (option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSortBy(option);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left capitalize transition-colors cursor-pointer ${
                          sortBy === option
                            ? "bg-[var(--bg-muted)] text-[var(--text-primary)] font-semibold"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span>{option}</span>
                        {sortBy === option && (
                          <Check className="w-3.5 h-3.5 text-[var(--accent-brand)]" aria-hidden="true" />
                        )}
                      </button>
                    )
                  )}

                  <div className="border-t border-[var(--border-hairline)] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      toggleSortOrder();
                      setIsSortOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]/60 cursor-pointer text-xs font-medium"
                  >
                    <span>
                      {sortOrder === "asc" ? "Ascending ↑" : "Descending ↓"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
