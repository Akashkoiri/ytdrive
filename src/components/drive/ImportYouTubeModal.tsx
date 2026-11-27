"use client";

import React, { useState, useId } from "react";
import { useDrive } from "@/context/DriveContext";
import ModalDialog from "@/components/ui/ModalDialog";
import SmartThumbnail from "@/components/ui/SmartThumbnail";
import { StudioSpinner } from "@/components/ui/Loaders";
import {
  X,
  Link2,
  EyeOff,
  Lock,
  Globe,
} from "lucide-react";

export default function ImportYouTubeModal() {
  const {
    isImportModalOpen,
    setIsImportModalOpen,
    folders,
    currentFolderId,
    importFromYouTube,
  } = useDrive();

  const [url, setUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [folderId, setFolderId] = useState<string>(currentFolderId || "root");
  const [privacy, setPrivacy] = useState<"unlisted" | "private" | "public">(
    "unlisted"
  );
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleId = useId();
  const urlInputId = useId();
  const customNameId = useId();
  const folderSelectId = useId();
  const tagsInputId = useId();

  const extractVideoId = (input: string) => {
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const previewId = extractVideoId(url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        ? tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : ["Drive"];

      const success = await importFromYouTube(
        url.trim(),
        folderId === "root" ? null : folderId,
        privacy,
        customName.trim() || undefined,
        tags
      );

      if (success) {
        setIsImportModalOpen(false);
        setUrl("");
        setCustomName("");
        setTagsInput("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={isImportModalOpen}
      onClose={() => setIsImportModalOpen(false)}
      ariaLabelledBy={titleId}
      className="max-w-[420px]"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col text-xs text-[var(--text-primary)] select-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div>
            <h1 id={titleId} className="font-semibold text-sm text-[var(--text-primary)]">
              Save from YouTube URL
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Add any YouTube video directly to your vault
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(false)}
            aria-label="Close dialog"
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
          <div className="space-y-1.5">
            <label
              htmlFor={urlInputId}
              className="text-xs font-medium text-[var(--text-secondary)] block"
            >
              YouTube link or Video ID <span className="text-[var(--accent-brand)]">*</span>
            </label>
            <input
              id={urlInputId}
              name="youtubeUrl"
              type="text"
              required
              autoFocus
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or youtu.be/..."
              className="studio-input w-full h-9.5 px-3 border rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          {previewId && (
            <div className="p-3 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-center gap-3">
              <div className="relative w-21 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-hairline)] bg-zinc-950">
                <SmartThumbnail
                  src={`https://i.ytimg.com/vi/${previewId}/mqdefault.jpg`}
                  alt="Video thumbnail preview"
                  sizes="84px"
                  fallbackIconClassName="w-4 h-4"
                />
              </div>
              <div className="truncate flex-1">
                <span className="font-mono text-xs font-semibold text-[var(--text-primary)] truncate block">
                  {previewId}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block truncate mt-0.5">
                  Ready to link and import
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor={customNameId}
              className="text-xs font-medium text-[var(--text-secondary)] block"
            >
              Title <span className="text-[var(--text-muted)]">(optional)</span>
            </label>
            <input
              id={customNameId}
              name="customName"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Auto-detected from YouTube if empty"
              className="studio-input w-full h-9.5 px-3 border rounded-xl text-xs outline-none transition-colors"
            />
          </div>

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
                const radioId = `${titleId}-imp-vis-${opt.id}`;
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
                      name="importPrivacy"
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
          </fieldset>

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
              placeholder="e.g. Tutorial, Reference"
              className="studio-input w-full h-9.5 px-3 border rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="h-9 px-3.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="h-9 px-4 rounded-xl bg-[var(--accent-cta-bg)] hover:opacity-90 text-[var(--accent-cta-fg)] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <StudioSpinner
                    size={14}
                    thickness={2}
                    label="Saving video"
                    color="currentColor"
                    trackColor="color-mix(in srgb, currentColor 25%, transparent)"
                  />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Save video</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalDialog>
  );
}
