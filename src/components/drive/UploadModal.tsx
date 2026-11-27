"use client";

import React, { useState, useRef, useId } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useDrive } from "@/context/DriveContext";
import ModalDialog from "@/components/ui/ModalDialog";
import { StudioSpinner } from "@/components/ui/Loaders";
import {
  X,
  Upload,
  FileVideo,
  EyeOff,
  Lock,
  Globe,
  AlertCircle,
  Check,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export default function UploadModal() {
  const { data: session } = useSession();
  const sessionRecord = session as unknown as Record<string, unknown> | null;
  const hasYouTubeAccess = Boolean(sessionRecord?.hasYouTubeAccess);
  const userEmail = session?.user?.email;

  const {
    isUploadModalOpen,
    setIsUploadModalOpen,
    folders,
    currentFolderId,
    uploadVideoFile,
    hasYouTubeChannel,
    refreshDrive,
    isSyncing,
    showToast,
  } = useDrive();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState<string>(currentFolderId || "root");
  const [privacy, setPrivacy] = useState<"unlisted" | "private" | "public">(
    "unlisted"
  );
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [resolution, setResolution] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingMetadata, setIsReadingMetadata] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const videoTitleInputId = useId();
  const folderSelectId = useId();
  const tagsInputId = useId();
  const descInputId = useId();

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    setIsReadingMetadata(true);
    setVideoDuration("");
    setResolution("");
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    setTitle(cleanName);

    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const secs = Math.round(video.duration);
      setDurationSeconds(secs);
      const mins = Math.floor(secs / 60);
      const remSecs = secs % 60;
      setVideoDuration(`${mins}:${remSecs.toString().padStart(2, "0")}`);

      const h = video.videoHeight || 1080;
      if (h >= 2160) {
        setResolution("4K");
      } else if (h >= 1440) {
        setResolution("1440p");
      } else if (h >= 1080) {
        setResolution("1080p");
      } else if (h >= 720) {
        setResolution("720p");
      } else if (h > 0) {
        setResolution(`${h}p`);
      } else {
        setResolution("1080p");
      }
      setIsReadingMetadata(false);
    };
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      setIsReadingMetadata(false);
    };
    video.src = URL.createObjectURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (
        file.type.startsWith("video/") ||
        /\.(mp4|mov|webm|mkv)$/i.test(file.name)
      ) {
        handleFileSelection(file);
      } else {
        showToast("Please select a video file (MP4, MOV, WebM, MKV).");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!hasYouTubeAccess) {
      showToast(
        "Please connect your Google account with YouTube permissions to upload."
      );
      return;
    }

    if (!hasYouTubeChannel) {
      showToast(
        "Please create a YouTube channel first before uploading videos."
      );
      return;
    }

    if (!selectedFile || selectedFile.size === 0) {
      showToast("Please select a video file to upload to your YouTube account.");
      return;
    }

    if (!title.trim()) {
      showToast("Please enter a video title.");
      return;
    }

    setIsSubmitting(true);

    const fileToUpload = selectedFile;
    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : ["Drive"];

    const uploadOptions = {
      title:
        title.endsWith(".mp4") ||
        title.endsWith(".mov") ||
        title.endsWith(".webm") ||
        title.endsWith(".mkv")
          ? title
          : `${title}.mp4`,
      folderId: folderId === "root" ? null : folderId,
      privacy,
      tags,
      description,
      duration: videoDuration,
      durationSeconds,
      resolution,
    };

    setSelectedFile(null);
    setTitle("");
    setTagsInput("");
    setDescription("");
    setIsSubmitting(false);
    setIsUploadModalOpen(false);

    void uploadVideoFile(fileToUpload, uploadOptions);
  };

  return (
    <ModalDialog
      open={isUploadModalOpen}
      onClose={() => setIsUploadModalOpen(false)}
      ariaLabelledBy={titleId}
      className="max-w-[420px]"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col text-xs text-[var(--text-primary)] select-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div>
            <h1 id={titleId} className="font-semibold text-sm text-[var(--text-primary)]">
              Upload video
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Streams directly to your connected YouTube channel
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(false)}
            aria-label="Close upload dialog"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[80dvh] overflow-y-auto studio-scroll"
        >
          {/* YouTube Channel Banner */}
          {hasYouTubeAccess ? (
            hasYouTubeChannel ? (
              <div className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-secondary)]">
                  Channel:{" "}
                  <span className="text-[var(--text-primary)] font-semibold">
                    {userEmail || "Connected"}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Ready</span>
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-semibold text-[11px] text-[var(--text-primary)]">
                      YouTube channel not created yet
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      First create a YouTube channel for{" "}
                      <span className="font-medium text-[var(--text-primary)]">
                        {userEmail || "this Google account"}
                      </span>{" "}
                      before uploading videos.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.youtube.com/create_channel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-[11px] inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Create YouTube Channel</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => void refreshDrive(true)}
                    className="h-8 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border-strong)] text-[11px] font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`}
                      aria-hidden="true"
                    />
                    <span>Recheck</span>
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Connect your Google account with YouTube permissions to enable direct video uploads.
                </p>
              </div>
              <button
                type="button"
                disabled={isConnectingGoogle}
                onClick={async () => {
                  setIsConnectingGoogle(true);
                  try {
                    if (session?.user) {
                      await signOut({ redirect: false });
                    }
                    await signIn("google", {
                      callbackUrl:
                        typeof window !== "undefined"
                          ? window.location.pathname + window.location.search
                          : "/",
                    });
                  } catch {
                    setIsConnectingGoogle(false);
                  }
                }}
                className="w-full h-8 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border-strong)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isConnectingGoogle ? (
                  <>
                    <StudioSpinner size={13} thickness={2} label="Connecting Google" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <span>Connect Google Account</span>
                )}
              </button>
            </div>
          )}

          {/* Dropzone */}
          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                isDragging
                  ? "border-[var(--accent-brand)] bg-rose-500/5"
                  : "border-[var(--border-strong)] hover:border-[var(--accent-brand)]/60 bg-[var(--bg-canvas)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mkv"
                aria-label="Choose video file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
                className="visually-hidden"
              />
              <button
                type="button"
                autoFocus
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-muted)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--accent-brand)] mb-2.5">
                  <Upload className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="font-semibold text-xs text-[var(--text-primary)]">
                  Drop video here, or browse
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  MP4, WebM, MOV, or MKV
                </p>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 truncate">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[var(--accent-brand)] shrink-0">
                  <FileVideo className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="truncate">
                  <span className="font-semibold text-xs text-[var(--text-primary)] block truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums inline-flex items-center gap-1.5">
                    <span>{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</span>
                    {isReadingMetadata ? (
                      <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                        <StudioSpinner size={11} thickness={1.5} label="Reading video metadata" />
                        <span>Inspecting...</span>
                      </span>
                    ) : (
                      <>
                        {videoDuration ? <span>• {videoDuration}</span> : null}
                        {resolution ? <span>• {resolution}</span> : null}
                      </>
                    )}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                aria-label="Remove selected file"
                className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1.5">
            <label
              htmlFor={videoTitleInputId}
              className="text-xs font-medium text-[var(--text-secondary)] block"
            >
              Title <span className="text-[var(--accent-brand)]">*</span>
            </label>
            <input
              id={videoTitleInputId}
              name="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title"
              className="studio-input w-full h-9.5 px-3 border rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          {/* Destination Folder */}
          <div className="space-y-1.5">
            <label
              htmlFor={folderSelectId}
              className="text-xs font-medium text-[var(--text-secondary)] block"
            >
              Folder
            </label>
            <select
              id={folderSelectId}
              name="folderId"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="studio-input w-full h-9.5 px-3 border rounded-xl text-xs outline-none transition-colors cursor-pointer"
            >
              <option value="root">My Drive (Root)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility Radio Fieldset */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-[var(--text-secondary)]">
              Visibility
            </legend>
            <div className="grid grid-cols-3 gap-1.5 bg-[var(--bg-canvas)] p-1 rounded-xl border border-[var(--border-hairline)]">
              {(
                [
                  { id: "unlisted", label: "Unlisted", icon: EyeOff },
                  { id: "private", label: "Private", icon: Lock },
                  { id: "public", label: "Public", icon: Globe },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const isSelected = privacy === opt.id;
                const radioId = `${titleId}-vis-${opt.id}`;
                return (
                  <label
                    key={opt.id}
                    htmlFor={radioId}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-hairline)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <input
                      id={radioId}
                      type="radio"
                      name="privacy"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => setPrivacy(opt.id)}
                      className="visually-hidden"
                    />
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {privacy === "unlisted"
                ? "Anyone with the link can view."
                : privacy === "private"
                ? "Only you can view."
                : "Publicly visible on YouTube."}
            </p>
          </fieldset>

          {/* Tags */}
          <div className="space-y-1.5">
            <label
              htmlFor={tagsInputId}
              className="text-xs font-medium text-[var(--text-secondary)] block"
            >
              Tags <span className="text-[var(--text-muted)]">(comma separated)</span>
            </label>
            <input
              id={tagsInputId}
              name="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Travel, Edit, Master"
              className="studio-input w-full h-9.5 px-3 border rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor={descInputId}
              className="text-xs font-medium text-[var(--text-secondary)] block"
            >
              Description <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <textarea
              id={descInputId}
              name="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add optional notes..."
              className="studio-input w-full px-3 py-2 border rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="h-9 px-3.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile || !hasYouTubeAccess || !hasYouTubeChannel}
              className="h-9 px-4 rounded-xl bg-[var(--accent-cta-bg)] hover:opacity-90 text-[var(--accent-cta-fg)] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <StudioSpinner
                    size={14}
                    thickness={2}
                    label="Uploading"
                    color="currentColor"
                    trackColor="color-mix(in srgb, currentColor 25%, transparent)"
                  />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalDialog>
  );
}
