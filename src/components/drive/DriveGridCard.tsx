"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useDrive } from "@/context/DriveContext";
import { DriveFile } from "@/types/drive";
import SmartThumbnail from "@/components/ui/SmartThumbnail";
import { StudioSpinner } from "@/components/ui/Loaders";
import { formatBytes, formatRelativeTime } from "@/utils/format";
import {
  Play,
  Star,
  MoreVertical,
  EyeOff,
  Lock,
  Globe,
  Copy,
  ExternalLink,
  Trash2,
  FolderInput,
  Maximize2,
  Check,
  RotateCcw,
} from "lucide-react";

interface DriveGridCardProps {
  file: DriveFile;
  index?: number;
  priority?: boolean;
}

const DriveGridCard = React.memo(function DriveGridCard({
  file,
  index,
  priority,
}: DriveGridCardProps) {
  const isLcpPriority = Boolean(priority || (typeof index === "number" && index < 2));
  const isAboveTheFold = isLcpPriority || (typeof index === "number" && index < 6);
  const isBelowFoldPerf = typeof index === "number" && index >= 8;

  const {
    selectedFileIds,
    toggleFileSelect,
    activePreviewFile,
    setActivePreviewFile,
    setCinemaFile,
    toggleStar,
    trashSelectedFiles,
    restoreSelectedFiles,
    deleteSelectedFilesPermanently,
    setIsMoveModalOpen,
    pendingFileIds,
    activeTab,
    showToast,
  } = useDrive();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedFileIds.includes(file.id);
  const isInspected = activePreviewFile?.id === file.id;
  const isPending = pendingFileIds.includes(file.id);
  const isTrashView = activeTab === "trash";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeAgo = useMemo(
    () => formatRelativeTime(file.createdAt),
    [file.createdAt]
  );

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard && file.youtubeUrl) {
      navigator.clipboard.writeText(file.youtubeUrl);
      showToast("YouTube Cloud Link copied to clipboard.");
    }
    setIsMenuOpen(false);
  };

  const renderPrivacyPill = () => {
    if (file.privacy === "unlisted") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-200 border border-white/15">
          <EyeOff className="w-2.5 h-2.5 text-amber-300" aria-hidden="true" />
          <span>Unlisted</span>
        </span>
      );
    }
    if (file.privacy === "private") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-200 border border-white/15">
          <Lock className="w-2.5 h-2.5 text-zinc-300" aria-hidden="true" />
          <span>Private</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-200 border border-white/15">
        <Globe className="w-2.5 h-2.5 text-emerald-300" aria-hidden="true" />
        <span>Public</span>
      </span>
    );
  };

  return (
    <article
      onClick={() => setActivePreviewFile(file)}
      onDoubleClick={() => setCinemaFile(file)}
      className={`studio-interactive-card group relative bg-[var(--bg-surface)]/90 hover:bg-[var(--bg-elevated)] backdrop-blur-md border rounded-2xl overflow-hidden cursor-pointer select-none flex flex-col shadow-xs hover:shadow-lg ${
        isBelowFoldPerf ? "drive-card-perf" : ""
      } ${
        isSelected
          ? "border-[var(--accent-brand)] ring-2 ring-[var(--accent-brand)]/25"
          : isInspected
          ? "border-[var(--border-strong)] ring-1 ring-[var(--border-strong)]"
          : "border-[var(--border-hairline)] hover:border-[var(--border-strong)]"
      }`}
    >
      {/* Thumbnail Aspect Container */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
        <SmartThumbnail
          src={file.thumbnailUrl}
          fallbackSrc={file.localThumbnailUrl}
          alt={file.name}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={isLcpPriority}
          loading={isAboveTheFold ? "eager" : "lazy"}
          className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />

        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/35 pointer-events-none" />

        {/* Pending Action Spinner Overlay */}
        {isPending && (
          <div className="absolute inset-0 z-20 bg-black/45 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
            <StudioSpinner
              size={22}
              thickness={2.5}
              label={`Updating ${file.name}`}
              color="#ffffff"
              trackColor="rgba(255,255,255,0.25)"
            />
          </div>
        )}

        {/* Selection Checkbox Button (24px+ target) */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Select ${file.name}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFileSelect(file.id);
          }}
          className={`absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
            isSelected
              ? "bg-[var(--accent-brand)] border-[var(--accent-brand)] text-white opacity-100 shadow-sm"
              : "border-white/50 bg-black/55 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 hover:border-white"
          }`}
        >
          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />}
        </button>

        {/* Star Button (top-right, 24px+ target) */}
        {!isTrashView && (
          <button
            type="button"
            aria-label={file.starred ? `Unstar ${file.name}` : `Star ${file.name}`}
            aria-pressed={file.starred}
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(file.id);
            }}
            className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-lg bg-black/55 backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
              file.starred
                ? "text-amber-400 opacity-100"
                : "text-zinc-300 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100"
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${file.starred ? "fill-amber-400" : ""}`}
              aria-hidden="true"
            />
          </button>
        )}

        {/* Center Play Trigger */}
        <button
          type="button"
          aria-label={`Play ${file.name} in cinema player`}
          onClick={(e) => {
            e.stopPropagation();
            setCinemaFile(file);
          }}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
        >
          <span className="w-11 h-11 rounded-full bg-black/65 backdrop-blur-md text-white border border-white/25 flex items-center justify-center shadow-xl transform group-hover:scale-100 scale-90 transition-transform">
            <Play className="w-4 h-4 fill-white ml-0.5" aria-hidden="true" />
          </span>
        </button>

        {/* Bottom Badges */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {renderPrivacyPill()}

          <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white font-medium border border-white/15">
            {file.duration}
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-3.5 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-semibold text-[var(--text-primary)] truncate"
            title={file.name}
          >
            {file.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
            <span>{formatBytes(file.size)}</span>
            <span aria-hidden="true">•</span>
            <span>{file.resolution || "1080p"}</span>
            <span aria-hidden="true">•</span>
            <span className="truncate">{timeAgo}</span>
          </div>
        </div>

        {/* 3-Dots Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            aria-label={`More actions for ${file.name}`}
            aria-expanded={isMenuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" aria-hidden="true" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 bottom-8 w-48 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-1.5 z-50 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setCinemaFile(file);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer font-medium"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[var(--accent-brand)]" aria-hidden="true" />
                <span>Cinema Player</span>
              </button>

              {file.youtubeUrl && (
                <>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer font-medium"
                  >
                    <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                    <span>Copy YouTube Link</span>
                  </button>

                  <a
                    href={file.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[var(--text-primary)] hover:bg-[var(--bg-muted)] font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                    <span>Open in YouTube</span>
                  </a>
                </>
              )}

              {!isTrashView && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSelected) {
                        toggleFileSelect(file.id);
                      }
                      setIsMoveModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer font-medium"
                  >
                    <FolderInput className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                    <span>Move to Folder</span>
                  </button>

                  <div className="border-t border-[var(--border-hairline)] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      void trashSelectedFiles([file.id]);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Move to Trash</span>
                  </button>
                </>
              )}

              {isTrashView && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      void restoreSelectedFiles([file.id]);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteSelectedFilesPermanently([file.id]);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delete Forever</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

export default DriveGridCard;
