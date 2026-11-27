"use client";

import { useDrive } from "@/context/DriveContext";
import { formatBytes, formatTotalDuration } from "@/utils/format";
import { StudioSpinner } from "@/components/ui/Loaders";
import {
  Cloud,
  UploadCloud,
  Link2,
  FolderPlus,
  EyeOff,
  Lock,
  Globe,
} from "lucide-react";

export default function DriveVaultSummary() {
  const {
    storageStats,
    isSyncing,
    setIsUploadModalOpen,
    setIsImportModalOpen,
    setIsNewFolderModalOpen,
  } = useDrive();

  const totalFiles = storageStats?.totalFiles || 0;
  const usedBytes = storageStats?.usedBytes || 0;
  const totalDuration = storageStats?.totalDurationSeconds || 0;

  return (
    <section
      aria-label="Vault overview"
      className="mb-6 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)]/85 backdrop-blur-xl p-4 sm:px-5 sm:py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs select-none"
    >
      {/* Left: Live Vault Stats */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/15 to-red-600/10 border border-rose-500/20 flex items-center justify-center text-[var(--accent-brand)] shrink-0">
            <Cloud className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Personal Cloud Vault
              </span>
              {isSyncing && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--accent-brand)]">
                  <StudioSpinner size={11} thickness={1.5} label="Syncing" />
                  <span>Syncing</span>
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-semibold text-[var(--text-primary)] font-mono tabular-nums mt-0.5">
              {formatBytes(usedBytes)}{" "}
              <span className="text-xs font-sans font-normal text-[var(--text-muted)]">
                across {totalFiles} video{totalFiles === 1 ? "" : "s"} •{" "}
                {formatTotalDuration(totalDuration)} runtime
              </span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-[var(--border-hairline)]" />

        {/* Visibility Breakdown Pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] font-mono tabular-nums">
            <EyeOff className="w-3 h-3 text-amber-500" aria-hidden="true" />
            <span>{storageStats?.unlistedCount || 0} Unlisted</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] font-mono tabular-nums">
            <Lock className="w-3 h-3 text-[var(--text-muted)]" aria-hidden="true" />
            <span>{storageStats?.privateCount || 0} Private</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] font-mono tabular-nums">
            <Globe className="w-3 h-3 text-emerald-500" aria-hidden="true" />
            <span>{storageStats?.publicCount || 0} Public</span>
          </span>
        </div>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-[var(--accent-cta-bg)] hover:opacity-90 text-[var(--accent-cta-fg)] font-semibold text-xs inline-flex items-center gap-1.5 transition-opacity cursor-pointer shadow-xs"
        >
          <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Upload</span>
        </button>

        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Link2 className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
          <span>Import URL</span>
        </button>

        <button
          type="button"
          onClick={() => setIsNewFolderModalOpen(true)}
          className="h-9 px-3.5 rounded-xl bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)] text-[var(--text-primary)] font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
          <span>New Folder</span>
        </button>
      </div>
    </section>
  );
}
