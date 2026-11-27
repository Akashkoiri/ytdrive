"use client";

import { useState, useId } from "react";
import { useDrive } from "@/context/DriveContext";
import ModalDialog from "@/components/ui/ModalDialog";
import { StudioSpinner } from "@/components/ui/Loaders";
import { X, FolderInput, HardDrive, Folder, Check } from "lucide-react";

export default function MoveFilesModal() {
  const {
    isMoveModalOpen,
    setIsMoveModalOpen,
    folders,
    selectedFileIds,
    moveSelectedFiles,
  } = useDrive();

  const [targetId, setTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleId = useId();

  const count = selectedFileIds.length;

  const handleMove = async () => {
    setIsSubmitting(true);
    try {
      await moveSelectedFiles(targetId);
      setIsMoveModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={isMoveModalOpen}
      onClose={() => setIsMoveModalOpen(false)}
      ariaLabelledBy={titleId}
      className="max-w-sm"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col text-xs text-[var(--text-primary)] select-none">
        <div className="px-5 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-500">
              <FolderInput className="w-4 h-4" aria-hidden="true" />
            </div>
            <h1 id={titleId} className="font-semibold text-sm text-[var(--text-primary)]">
              Move {count} item{count > 1 ? "s" : ""}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setIsMoveModalOpen(false)}
            aria-label="Close dialog"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <span className="text-xs text-[var(--text-secondary)] block">
            Choose destination folder:
          </span>

          <div
            role="radiogroup"
            aria-label="Destination folder"
            className="max-h-60 overflow-y-auto studio-scroll space-y-1 border border-[var(--border-hairline)] rounded-2xl p-1.5 bg-[var(--bg-canvas)]"
          >
            <button
              type="button"
              role="radio"
              aria-checked={targetId === null}
              autoFocus
              onClick={() => setTargetId(null)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                targetId === null
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-hairline)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                <span>My Drive (Root)</span>
              </div>
              {targetId === null && (
                <Check className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />
              )}
            </button>

            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                role="radio"
                aria-checked={targetId === folder.id}
                onClick={() => setTargetId(folder.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  targetId === folder.id
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border-hairline)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Folder className="w-4 h-4 text-sky-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{folder.name}</span>
                </div>
                {targetId === folder.id && (
                  <Check className="w-4 h-4 text-[var(--accent-brand)] shrink-0" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMoveModalOpen(false)}
              className="h-9 px-3.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleMove}
              className="h-9 px-4 rounded-xl bg-[var(--accent-cta-bg)] hover:opacity-90 text-[var(--accent-cta-fg)] font-semibold transition-opacity disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <StudioSpinner
                    size={14}
                    thickness={2}
                    label="Moving files"
                    color="currentColor"
                    trackColor="color-mix(in srgb, currentColor 25%, transparent)"
                  />
                  <span>Moving...</span>
                </>
              ) : (
                <span>Move Here</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalDialog>
  );
}
