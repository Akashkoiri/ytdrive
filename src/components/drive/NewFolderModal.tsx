"use client";

import React, { useState, useId } from "react";
import { useDrive } from "@/context/DriveContext";
import ModalDialog from "@/components/ui/ModalDialog";
import { StudioSpinner } from "@/components/ui/Loaders";
import { X, FolderPlus } from "lucide-react";

export default function NewFolderModal() {
  const { isNewFolderModalOpen, setIsNewFolderModalOpen, createFolder } =
    useDrive();
  const [folderName, setFolderName] = useState("");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleId = useId();
  const inputId = useId();

  const colors = [
    { id: "blue", label: "Sky Blue", class: "bg-sky-500" },
    { id: "emerald", label: "Emerald", class: "bg-emerald-500" },
    { id: "purple", label: "Violet", class: "bg-violet-500" },
    { id: "amber", label: "Amber", class: "bg-amber-500" },
    { id: "rose", label: "Rose", class: "bg-rose-500" },
    { id: "zinc", label: "Slate", class: "bg-slate-400" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await createFolder(folderName.trim(), selectedColor);
      if (success) {
        setIsNewFolderModalOpen(false);
        setFolderName("");
        setSelectedColor("blue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalDialog
      open={isNewFolderModalOpen}
      onClose={() => setIsNewFolderModalOpen(false)}
      ariaLabelledBy={titleId}
      className="max-w-sm"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl w-full shadow-2xl overflow-hidden flex flex-col text-xs text-[var(--text-primary)] select-none">
        <div className="px-5 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
              <FolderPlus className="w-4 h-4" aria-hidden="true" />
            </div>
            <h1 id={titleId} className="font-semibold text-sm text-[var(--text-primary)]">
              Create New Folder
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setIsNewFolderModalOpen(false)}
            aria-label="Close dialog"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor={inputId}
              className="text-xs font-medium text-[var(--text-secondary)] block"
            >
              Folder Name <span className="text-[var(--accent-brand)]">*</span>
            </label>
            <input
              id={inputId}
              name="folderName"
              type="text"
              required
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Work Screencasts"
              className="studio-input w-full h-9.5 px-3 border rounded-xl text-xs outline-none transition-colors"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-[var(--text-secondary)]">
              Accent Color
            </legend>
            <div className="flex items-center gap-2.5 pt-0.5">
              {colors.map((c) => {
                const radioId = `${titleId}-col-${c.id}`;
                const isSelected = selectedColor === c.id;
                return (
                  <label
                    key={c.id}
                    htmlFor={radioId}
                    title={c.label}
                    className={`w-7 h-7 rounded-full ${c.class} cursor-pointer transition-transform flex items-center justify-center ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] ring-[var(--text-primary)] scale-110"
                        : "opacity-75 hover:opacity-100"
                    }`}
                  >
                    <input
                      id={radioId}
                      type="radio"
                      name="folderColor"
                      value={c.id}
                      checked={isSelected}
                      onChange={() => setSelectedColor(c.id)}
                      aria-label={c.label}
                      className="visually-hidden"
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewFolderModalOpen(false)}
              className="h-9 px-3.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !folderName.trim()}
              className="h-9 px-4 rounded-xl bg-[var(--accent-cta-bg)] hover:opacity-90 text-[var(--accent-cta-fg)] font-semibold transition-opacity disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <StudioSpinner
                    size={14}
                    thickness={2}
                    label="Creating folder"
                    color="currentColor"
                    trackColor="color-mix(in srgb, currentColor 25%, transparent)"
                  />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Folder</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalDialog>
  );
}
