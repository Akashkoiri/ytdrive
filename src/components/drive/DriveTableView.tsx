"use client";

import { useId, useState } from "react";
import { useDrive } from "@/context/DriveContext";
import SmartThumbnail from "@/components/ui/SmartThumbnail";
import { StudioSpinner } from "@/components/ui/Loaders";
import { formatBytes, formatShortDate } from "@/utils/format";
import {
  Play,
  Star,
  EyeOff,
  Lock,
  Globe,
  Folder,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

export default function DriveTableView() {
  const {
    files,
    folders,
    selectedFileIds,
    toggleFileSelect,
    selectAllFiles,
    clearSelection,
    activePreviewFile,
    setActivePreviewFile,
    setCinemaFile,
    toggleStar,
    sortBy,
    sortOrder,
    setSortBy,
    toggleSortOrder,
    pendingFileIds,
    activeTab,
  } = useDrive();

  const captionId = useId();
  const [sortStatusText, setSortStatusText] = useState("");
  const isTrashView = activeTab === "trash";
  const allSelected =
    files.length > 0 && selectedFileIds.length === files.length;

  const handleHeaderSort = (field: "name" | "size" | "duration" | "date") => {
    const nextOrder =
      sortBy === field ? (sortOrder === "asc" ? "descending" : "ascending") : "descending";
    if (sortBy === field) {
      toggleSortOrder();
    } else {
      setSortBy(field);
    }
    setSortStatusText(`Sorted by ${field}, ${nextOrder}, ${files.length} rows`);
  };

  const getAriaSort = (
    field: "name" | "size" | "duration" | "date"
  ): "ascending" | "descending" | undefined => {
    if (sortBy !== field) return undefined;
    return sortOrder === "asc" ? "ascending" : "descending";
  };

  const renderSortIcon = (field: "name" | "size" | "duration" | "date") => {
    if (sortBy !== field) {
      return (
        <ArrowUpDown
          className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-50"
          aria-hidden="true"
        />
      );
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-[var(--accent-brand)]" aria-hidden="true" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[var(--accent-brand)]" aria-hidden="true" />
    );
  };

  return (
    <div className="w-full border border-[var(--border-hairline)] rounded-2xl overflow-hidden bg-[var(--bg-surface)] shadow-xs select-none">
      <div role="status" aria-live="polite" className="visually-hidden">
        {sortStatusText}
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-labelledby={captionId}
        className="drive-table-region studio-scroll"
      >
        <table className="w-full min-w-[640px] text-left text-xs text-[var(--text-primary)] border-collapse">
          <caption id={captionId} className="visually-hidden">
            Drive video files
          </caption>

          <thead className="sticky top-0 z-10 bg-[var(--bg-muted)]/95 backdrop-blur-md text-[var(--text-secondary)] border-b border-[var(--border-hairline)] font-semibold">
            <tr>
              <th scope="col" className="w-11 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  aria-label={allSelected ? "Deselect all videos" : "Select all videos"}
                  checked={allSelected}
                  onChange={() =>
                    allSelected ? clearSelection() : selectAllFiles()
                  }
                  className="w-4 h-4 rounded accent-[var(--accent-brand)] cursor-pointer align-middle"
                />
              </th>

              <th scope="col" aria-sort={getAriaSort("name")} className="p-0">
                <button
                  type="button"
                  onClick={() => handleHeaderSort("name")}
                  className="w-full min-h-9 px-4 py-3 flex items-center gap-1.5 text-left hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <span>Name</span>
                  {renderSortIcon("name")}
                </button>
              </th>

              <th scope="col" className="px-4 py-3 hidden md:table-cell">
                Location
              </th>

              <th
                scope="col"
                aria-sort={getAriaSort("size")}
                className="p-0 text-right"
              >
                <button
                  type="button"
                  onClick={() => handleHeaderSort("size")}
                  className="w-full min-h-9 px-4 py-3 flex items-center justify-end gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <span>Size</span>
                  {renderSortIcon("size")}
                </button>
              </th>

              <th
                scope="col"
                aria-sort={getAriaSort("duration")}
                className="p-0 text-right hidden sm:table-cell"
              >
                <button
                  type="button"
                  onClick={() => handleHeaderSort("duration")}
                  className="w-full min-h-9 px-4 py-3 flex items-center justify-end gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <span>Duration</span>
                  {renderSortIcon("duration")}
                </button>
              </th>

              <th scope="col" className="px-4 py-3 hidden lg:table-cell">
                Visibility
              </th>

              <th
                scope="col"
                aria-sort={getAriaSort("date")}
                className="p-0 hidden xl:table-cell"
              >
                <button
                  type="button"
                  onClick={() => handleHeaderSort("date")}
                  className="w-full min-h-9 px-4 py-3 flex items-center gap-1.5 text-left hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <span>Uploaded</span>
                  {renderSortIcon("date")}
                </button>
              </th>

              <th scope="col" className="w-12 px-3 py-3 text-center">
                <span className="visually-hidden">Star</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-hairline)]">
            {files.map((file, index) => {
              const isSelected = selectedFileIds.includes(file.id);
              const isInspected = activePreviewFile?.id === file.id;
              const isPending = pendingFileIds.includes(file.id);
              const folderObj = folders.find((f) => f.id === file.folderId);

              return (
                <tr
                  key={file.id}
                  onClick={() => setActivePreviewFile(file)}
                  onDoubleClick={() => setCinemaFile(file)}
                  className={`group cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-rose-500/10"
                      : isInspected
                      ? "bg-[var(--bg-muted)]"
                      : "hover:bg-[var(--bg-muted)]/55"
                  }`}
                >
                  <td
                    className="px-3 py-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select ${file.name}`}
                      checked={isSelected}
                      onChange={() => toggleFileSelect(file.id)}
                      className="w-4 h-4 rounded accent-[var(--accent-brand)] cursor-pointer align-middle"
                    />
                  </td>

                  <th scope="row" className="px-4 py-3 font-normal text-left">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={`Play ${file.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCinemaFile(file);
                        }}
                        className="relative w-14 h-8 rounded-lg overflow-hidden bg-zinc-950 shrink-0 border border-[var(--border-hairline)] cursor-pointer group/thumb"
                      >
                        <SmartThumbnail
                          src={file.thumbnailUrl}
                          fallbackSrc={file.localThumbnailUrl}
                          alt=""
                          sizes="56px"
                          priority={index < 2}
                          loading={index < 8 ? "eager" : "lazy"}
                          fallbackIconClassName="w-3.5 h-3.5"
                        />
                        {isPending ? (
                          <span className="absolute inset-0 bg-black/55 flex items-center justify-center">
                            <StudioSpinner
                              size={14}
                              thickness={2}
                              label={`Updating ${file.name}`}
                              color="#ffffff"
                            />
                          </span>
                        ) : (
                          <span className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within/thumb:opacity-100 transition-opacity">
                            <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" aria-hidden="true" />
                          </span>
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-semibold text-[var(--text-primary)] truncate max-w-xs sm:max-w-sm"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          {!isTrashView && file.starred && (
                            <Star
                              className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0"
                              aria-label="Starred"
                            />
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums block sm:hidden mt-0.5">
                          {formatBytes(file.size)} • {file.duration}
                        </span>
                      </div>
                    </div>
                  </th>

                  <td className="px-4 py-3 hidden md:table-cell text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1.5 truncate max-w-36">
                      <Folder className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {folderObj ? folderObj.name : "My Drive"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                    {formatBytes(file.size)}
                  </td>

                  <td className="px-4 py-3 text-right font-mono tabular-nums text-[var(--text-secondary)] hidden sm:table-cell">
                    {file.duration}
                  </td>

                  <td className="px-4 py-3 hidden lg:table-cell">
                    {file.privacy === "unlisted" && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-hairline)]">
                        <EyeOff className="w-3 h-3 text-amber-500" aria-hidden="true" />
                        <span>Unlisted</span>
                      </span>
                    )}
                    {file.privacy === "private" && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-hairline)]">
                        <Lock className="w-3 h-3 text-[var(--text-muted)]" aria-hidden="true" />
                        <span>Private</span>
                      </span>
                    )}
                    {file.privacy === "public" && (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-hairline)]">
                        <Globe className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                        <span>Public</span>
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-[var(--text-secondary)] hidden xl:table-cell font-mono tabular-nums">
                    {formatShortDate(file.createdAt)}
                  </td>

                  <td className="px-3 py-3 text-center">
                    {!isTrashView && (
                      <button
                        type="button"
                        aria-label={file.starred ? `Unstar ${file.name}` : `Star ${file.name}`}
                        aria-pressed={file.starred}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(file.id);
                        }}
                        className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-opacity cursor-pointer ${
                          file.starred
                            ? "text-amber-500 opacity-100"
                            : "text-[var(--text-muted)] hover:text-amber-500 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            file.starred ? "fill-amber-500" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
