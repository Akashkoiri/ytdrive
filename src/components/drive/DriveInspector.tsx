"use client";

import { useState } from "react";
import { useDrive } from "@/context/DriveContext";
import { StudioSpinner } from "@/components/ui/Loaders";
import { formatBytes, formatShortDate } from "@/utils/format";
import {
  X,
  Star,
  Copy,
  ExternalLink,
  Trash2,
  Maximize2,
  Check,
  EyeOff,
  Lock,
  Globe,
  FileVideo,
  Edit2,
  Download,
  RotateCcw,
} from "lucide-react";

export default function DriveInspector() {
  const {
    activePreviewFile,
    setActivePreviewFile,
    setCinemaFile,
    folders,
    toggleStar,
    renameFile,
    updateFilePrivacy,
    trashSelectedFiles,
    restoreSelectedFiles,
    deleteSelectedFilesPermanently,
    pendingFileIds,
    activeTab,
    showToast,
  } = useDrive();

  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [titleValue, setTitleValue] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [loadedVideoId, setLoadedVideoId] = useState<string | null>(null);

  if (!activePreviewFile) return null;

  const file = activePreviewFile;
  const isEditingTitle = editingFileId === file.id;
  const isPending = pendingFileIds.includes(file.id);
  const isTrashView = activeTab === "trash";
  const currentFolder = folders.find((f) => f.id === file.folderId);
  const isIframeLoaded = Boolean(file.videoId && loadedVideoId === file.videoId);

  const handleStartRename = () => {
    setTitleValue(file.name);
    setEditingFileId(file.id);
  };

  const handleSaveRename = () => {
    if (titleValue.trim() && titleValue.trim() !== file.name) {
      renameFile(file.id, titleValue.trim());
    }
    setEditingFileId(null);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard && file.youtubeUrl) {
      navigator.clipboard.writeText(file.youtubeUrl);
      setCopiedLink(true);
      showToast("YouTube link copied to clipboard.");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyVideoId = () => {
    if (navigator.clipboard && file.videoId) {
      navigator.clipboard.writeText(file.videoId);
      setCopiedId(true);
      showToast("YouTube Video ID copied.");
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const inspectorBody = (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="h-12 border-b border-[var(--border-hairline)] px-4 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          File Inspector
        </span>
        <button
          type="button"
          onClick={() => setActivePreviewFile(null)}
          aria-label="Close inspector"
          className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-5 text-xs">
        {/* Video Preview */}
        <div className="space-y-2.5">
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-[var(--border-hairline)] shadow-md">
            {file.videoId ? (
              <>
                {!isIframeLoaded && (
                  <div className="absolute inset-0 z-10 studio-skeleton bg-zinc-950 flex flex-col items-center justify-center gap-2">
                    <StudioSpinner
                      size={22}
                      thickness={2.5}
                      label="Loading video preview"
                      color="#ffffff"
                      trackColor="rgba(255,255,255,0.2)"
                    />
                    <span className="text-[10px] font-mono text-zinc-400">
                      Loading preview...
                    </span>
                  </div>
                )}
                <iframe
                  key={file.videoId}
                  src={`https://www.youtube-nocookie.com/embed/${file.videoId}?rel=0&modestbranding=1`}
                  title={`Preview of ${file.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setLoadedVideoId(file.videoId || null)}
                  className="w-full h-full border-0"
                />
              </>
            ) : file.fileUrl ? (
              <video
                src={file.fileUrl}
                controls
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <FileVideo className="w-8 h-8" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCinemaFile(file)}
              className="h-9 bg-[var(--accent-cta-bg)] hover:opacity-90 text-[var(--accent-cta-fg)] rounded-xl flex items-center justify-center gap-1.5 font-semibold transition-opacity cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Cinema</span>
            </button>

            {file.fileUrl ? (
              <a
                href={file.fileUrl}
                download={file.name}
                className="h-9 bg-[var(--bg-muted)] hover:bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-[var(--text-primary)] rounded-xl flex items-center justify-center gap-1.5 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                <span>Download</span>
              </a>
            ) : (
              <a
                href={file.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="h-9 bg-[var(--bg-muted)] hover:bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-[var(--text-primary)] rounded-xl flex items-center justify-center gap-1.5 font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                <span>YouTube</span>
              </a>
            )}
          </div>
        </div>

        {/* Editable Name */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              File Name
            </span>
            {!isTrashView && !isEditingTitle && (
              <button
                type="button"
                onClick={handleStartRename}
                aria-label="Rename file"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {isEditingTitle ? (
            <input
              type="text"
              aria-label="Edit file name"
              value={titleValue}
              autoFocus
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename();
                if (e.key === "Escape") setEditingFileId(null);
              }}
              onBlur={handleSaveRename}
              className="studio-input w-full px-3 py-1.5 border border-[var(--accent-brand)] rounded-xl text-xs outline-none"
            />
          ) : (
            <h2 className="font-semibold text-sm text-[var(--text-primary)] break-words leading-snug">
              {file.name}
            </h2>
          )}
        </div>

        {/* Properties List */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
            Properties
          </span>
          <dl className="divide-y divide-[var(--border-hairline)] rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5">
            <div className="py-2.5 flex items-center justify-between">
              <dt className="text-[var(--text-secondary)]">Size</dt>
              <dd className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                {formatBytes(file.size)}
              </dd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <dt className="text-[var(--text-secondary)]">Duration</dt>
              <dd className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                {file.duration}
              </dd>
            </div>
            {file.resolution && (
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-[var(--text-secondary)]">Resolution</dt>
                <dd className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                  {file.resolution}
                </dd>
              </div>
            )}
            <div className="py-2.5 flex items-center justify-between gap-2">
              <dt className="text-[var(--text-secondary)] shrink-0">Visibility</dt>
              <dd className="flex items-center gap-1.5">
                {isPending && (
                  <StudioSpinner size={12} thickness={1.5} label="Updating visibility" />
                )}
                {!isTrashView ? (
                  <div
                    role="group"
                    aria-label="File visibility"
                    className="inline-flex items-center gap-0.5 bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-lg p-0.5"
                  >
                    {(
                      [
                        { id: "unlisted", label: "Unlisted", icon: EyeOff },
                        { id: "private", label: "Private", icon: Lock },
                        { id: "public", label: "Public", icon: Globe },
                      ] as const
                    ).map((opt) => {
                      const Icon = opt.icon;
                      const active = file.privacy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isPending}
                          onClick={() => void updateFilePrivacy(file.id, opt.id)}
                          aria-pressed={active}
                          title={`Set ${opt.label}`}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-60 ${
                            active
                              ? "bg-[var(--bg-muted)] text-[var(--text-primary)] shadow-2xs"
                              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          <Icon className="w-3 h-3" aria-hidden="true" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="capitalize font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                    {file.privacy === "unlisted" && (
                      <EyeOff className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                    )}
                    {file.privacy === "private" && (
                      <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                    )}
                    {file.privacy === "public" && (
                      <Globe className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                    )}
                    <span>{file.privacy}</span>
                  </span>
                )}
              </dd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <dt className="text-[var(--text-secondary)]">Location</dt>
              <dd className="font-medium text-[var(--text-primary)] truncate max-w-[140px] text-right">
                {currentFolder ? currentFolder.name : "My Drive"}
              </dd>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <dt className="text-[var(--text-secondary)]">Uploaded</dt>
              <dd className="font-mono tabular-nums text-[var(--text-primary)]">
                {formatShortDate(file.createdAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* YouTube Video ID & Link */}
        {file.videoId && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              YouTube Reference
            </span>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Video ID
                  </span>
                  <span className="font-mono text-xs font-medium text-[var(--text-primary)]">
                    {file.videoId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyVideoId}
                  aria-label="Copy YouTube Video ID"
                  className="h-7 w-7 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-muted)] cursor-pointer transition-colors"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 h-9 px-3 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                  )}
                  <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
                </button>

                <a
                  href={file.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open video on YouTube"
                  className="h-9 w-9 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-[var(--text-primary)] flex items-center justify-center transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
              Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {file.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-hairline)] text-[11px] font-medium text-[var(--text-secondary)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {file.description && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
              Description
            </span>
            <p className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {file.description}
            </p>
          </div>
        )}

        {/* Quick Footer Actions */}
        <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2">
          {!isTrashView ? (
            <>
              <button
                type="button"
                onClick={() => toggleStar(file.id)}
                className={`flex-1 h-9 rounded-xl border font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  file.starred
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-[var(--bg-muted)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-strong)]"
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${file.starred ? "fill-amber-500" : ""}`}
                  aria-hidden="true"
                />
                <span>{file.starred ? "Starred" : "Star"}</span>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  void trashSelectedFiles([file.id]);
                }}
                aria-label="Move to trash"
                className="h-9 px-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                title="Move to trash"
              >
                {isPending ? (
                  <StudioSpinner size={14} thickness={2} label="Moving to trash" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  void restoreSelectedFiles([file.id]);
                }}
                className="flex-1 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isPending ? (
                  <StudioSpinner size={14} thickness={2} label="Restoring" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Restore</span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  void deleteSelectedFilesPermanently([file.id]);
                }}
                className="flex-1 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isPending ? (
                  <StudioSpinner size={14} thickness={2} label="Deleting" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Delete Forever</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Docked Inspector */}
      <aside
        aria-label="File details"
        className="hidden xl:flex w-84 border-l border-[var(--border-hairline)] flex-col shrink-0 select-none h-[calc(100vh-3.75rem)] sticky top-15 z-20"
      >
        {inspectorBody}
      </aside>

      {/* Tablet / Mobile Slide-Over Inspector */}
      <div className="fixed inset-0 z-40 xl:hidden flex justify-end">
        <div
          onClick={() => setActivePreviewFile(null)}
          aria-hidden="true"
          className="fixed inset-0 bg-black/55 backdrop-blur-xs"
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="File details"
          className="relative w-88 max-w-[92vw] h-full border-l border-[var(--border-strong)] shadow-2xl z-10 flex flex-col select-none"
        >
          {inspectorBody}
        </aside>
      </div>
    </>
  );
}
