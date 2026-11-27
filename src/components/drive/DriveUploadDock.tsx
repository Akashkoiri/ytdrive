"use client";

import { useState } from "react";
import { useDrive } from "@/context/DriveContext";
import { StudioSpinner, StudioProgressBar } from "@/components/ui/Loaders";
import { formatBytes } from "@/utils/format";
import {
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
} from "lucide-react";

export default function DriveUploadDock() {
  const { activeUploads, dismissUploadJob, setActivePreviewFile } = useDrive();
  const [isMinimized, setIsMinimized] = useState(false);

  if (activeUploads.length === 0) return null;

  const inProgressCount = activeUploads.filter(
    (job) =>
      job.status === "uploading" ||
      job.status === "transcoding" ||
      job.status === "syncing" ||
      job.status === "initializing"
  ).length;

  const headerTitle =
    inProgressCount > 0
      ? `Uploading ${inProgressCount} file${inProgressCount > 1 ? "s" : ""}`
      : `${activeUploads.length} upload${activeUploads.length > 1 ? "s" : ""} complete`;

  return (
    <section
      aria-label="Upload progress"
      className="fixed bottom-4 right-4 w-92 max-w-[calc(100vw-2rem)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl shadow-2xl z-40 overflow-hidden text-xs select-none"
    >
      {/* Dock Header */}
      <div className="h-11 bg-[var(--bg-surface)] px-4 flex items-center justify-between border-b border-[var(--border-hairline)]">
        <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold truncate">
          {inProgressCount > 0 ? (
            <StudioSpinner size={16} thickness={2} label="Upload in progress" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">{headerTitle}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            aria-expanded={!isMinimized}
            aria-label={isMinimized ? "Expand upload dock" : "Minimize upload dock"}
            className="h-7 w-7 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              activeUploads.forEach((j) => dismissUploadJob(j.id));
            }}
            aria-label="Dismiss all uploads"
            className="h-7 w-7 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Dock Body */}
      {!isMinimized && (
        <div className="max-h-72 overflow-y-auto studio-scroll divide-y divide-[var(--border-hairline)] p-3.5 space-y-3">
          {activeUploads.map((job) => (
            <div key={job.id} className="pt-3 first:pt-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span
                    className="font-semibold text-[var(--text-primary)] truncate block text-xs"
                    title={job.fileName}
                  >
                    {job.fileName}
                  </span>

                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] font-mono tabular-nums mt-0.5">
                    <span>
                      {job.uploadedBytes !== undefined &&
                      job.status === "uploading"
                        ? `${formatBytes(job.uploadedBytes)} / ${formatBytes(job.fileSize)}`
                        : formatBytes(job.fileSize)}
                    </span>
                    {job.speed && job.status === "uploading" && (
                      <span>• {job.speed}</span>
                    )}
                    {job.eta && job.status === "uploading" && (
                      <span>• {job.eta}</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {job.status === "complete" && (
                    <>
                      {job.completedFile?.youtubeUrl && (
                        <a
                          href={job.completedFile.youtubeUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open on YouTube"
                          className="h-6 w-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-muted)] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                      {job.completedFile && (
                        <button
                          type="button"
                          onClick={() => setActivePreviewFile(job.completedFile!)}
                          aria-label="Inspect uploaded file"
                          className="h-6 w-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                    </>
                  )}
                  {job.status === "error" && (
                    <AlertCircle className="w-4 h-4 text-rose-500" aria-hidden="true" />
                  )}
                  {job.status !== "complete" && job.status !== "error" && (
                    <span className="font-mono tabular-nums text-[11px] font-medium text-[var(--text-secondary)]">
                      {job.progress}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => dismissUploadJob(job.id)}
                    aria-label={`Dismiss ${job.fileName}`}
                    className="h-6 w-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <StudioProgressBar
                value={
                  job.status === "initializing" ||
                  job.status === "transcoding" ||
                  job.status === "syncing"
                    ? undefined
                    : job.progress
                }
                max={100}
                height={6}
                label={`Upload progress for ${job.fileName}`}
                fillColor={
                  job.status === "complete"
                    ? "#10b981"
                    : job.status === "error"
                    ? "#f43f5e"
                    : undefined
                }
              />

              {(job.error || job.statusText) && (
                <div className="space-y-1.5">
                  <div
                    className={`text-[10px] ${
                      job.status === "error"
                        ? "text-rose-600 dark:text-rose-400 whitespace-normal leading-relaxed"
                        : "text-[var(--text-muted)] truncate"
                    }`}
                    title={job.error || job.statusText}
                  >
                    {job.error || job.statusText}
                  </div>
                  {job.errorCode === "YOUTUBE_CHANNEL_REQUIRED" && (
                    <a
                      href="https://www.youtube.com/create_channel"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <span>Create YouTube Channel</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
