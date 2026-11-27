"use client";

import { useState, useRef, useEffect } from "react";
import { useDrive } from "@/context/DriveContext";
import { DriveFolder } from "@/types/drive";
import { StudioSpinner } from "@/components/ui/Loaders";
import {
  Folder,
  MoreVertical,
  Edit2,
  Trash2,
  FolderOpen,
  Plus,
} from "lucide-react";

export default function DriveFolderSection() {
  const {
    folders,
    folderFileCounts,
    pendingFolderIds,
    setCurrentFolderId,
    setIsNewFolderModalOpen,
    renameFolder,
    deleteFolder,
  } = useDrive();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const colorStyles: Record<
    string,
    { iconColor: string; bgBadge: string; borderTint: string }
  > = {
    blue: {
      iconColor: "text-sky-500",
      bgBadge: "bg-sky-500/10",
      borderTint: "border-sky-500/20",
    },
    emerald: {
      iconColor: "text-emerald-500",
      bgBadge: "bg-emerald-500/10",
      borderTint: "border-emerald-500/20",
    },
    purple: {
      iconColor: "text-violet-500",
      bgBadge: "bg-violet-500/10",
      borderTint: "border-violet-500/20",
    },
    amber: {
      iconColor: "text-amber-500",
      bgBadge: "bg-amber-500/10",
      borderTint: "border-amber-500/20",
    },
    rose: {
      iconColor: "text-rose-500",
      bgBadge: "bg-rose-500/10",
      borderTint: "border-rose-500/20",
    },
    zinc: {
      iconColor: "text-slate-500 dark:text-slate-400",
      bgBadge: "bg-[var(--bg-muted)]",
      borderTint: "border-[var(--border-hairline)]",
    },
  };

  const handleStartRename = (folder: DriveFolder) => {
    setRenamingFolderId(folder.id);
    setRenameValue(folder.name);
    setActiveMenuId(null);
  };

  const handleSaveRename = (folderId: string) => {
    if (renameValue.trim()) {
      renameFolder(folderId, renameValue.trim());
    }
    setRenamingFolderId(null);
  };

  if (folders.length === 0) return null;

  return (
    <section aria-label="Folders" className="mb-8 select-none">
      <div className="flex items-center justify-between mb-3.5 px-0.5">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          Folders{" "}
          <span className="font-mono text-[11px] ml-1 tabular-nums">
            ({folders.length})
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setIsNewFolderModalOpen(true)}
          className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>New folder</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {folders.map((folder) => {
          const count = folderFileCounts.get(folder.id) || 0;
          const isPending = pendingFolderIds.includes(folder.id);
          const styling =
            colorStyles[folder.color || "blue"] || colorStyles.blue;
          const isMenuOpen = activeMenuId === folder.id;

          return (
            <div
              key={folder.id}
              onClick={() => !isPending && setCurrentFolderId(folder.id)}
              className={`studio-interactive-card group relative bg-[var(--bg-surface)]/85 hover:bg-[var(--bg-elevated)] backdrop-blur-md border border-[var(--border-hairline)] hover:border-[var(--border-strong)] rounded-2xl p-4 cursor-pointer shadow-xs hover:shadow-md ${
                isPending ? "opacity-70 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`p-2.5 rounded-xl border ${styling.bgBadge} ${styling.borderTint} ${styling.iconColor}`}
                >
                  {isPending ? (
                    <StudioSpinner size={20} thickness={2} label="Updating folder" />
                  ) : (
                    <Folder className="w-5 h-5 fill-current/15" aria-hidden="true" />
                  )}
                </div>

                {/* 3-Dots Context Menu */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label={`Actions for folder ${folder.name}`}
                    aria-expanded={isMenuOpen}
                    onClick={() =>
                      setActiveMenuId(isMenuOpen ? null : folder.id)
                    }
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" aria-hidden="true" />
                  </button>

                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 w-44 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-1.5 z-50 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentFolderId(folder.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer font-medium"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                        <span>Open folder</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRename(folder)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[var(--text-primary)] hover:bg-[var(--bg-muted)] cursor-pointer font-medium"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                        <span>Rename</span>
                      </button>
                      <div className="border-t border-[var(--border-hairline)] my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          deleteFolder(folder.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Delete folder</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3.5">
                {renamingFolderId === folder.id ? (
                  <input
                    type="text"
                    aria-label="Folder name"
                    value={renameValue}
                    autoFocus
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRename(folder.id);
                      if (e.key === "Escape") setRenamingFolderId(null);
                    }}
                    onBlur={() => handleSaveRename(folder.id)}
                    className="studio-input w-full px-2 py-1 border border-[var(--accent-brand)] rounded-lg text-xs outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3
                    className="text-sm font-semibold text-[var(--text-primary)] truncate"
                    title={folder.name}
                  >
                    {folder.name}
                  </h3>
                )}
                <p className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums mt-0.5">
                  {count} video{count === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
