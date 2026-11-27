import React from "react";

interface StudioSpinnerProps {
  size?: number;
  thickness?: number;
  label?: string;
  color?: string;
  trackColor?: string;
  className?: string;
}

/**
 * Accessible indeterminate spinner backed by a native <progress> element.
 */
export function StudioSpinner({
  size = 18,
  thickness = 2,
  label = "Loading",
  color,
  trackColor,
  className = "",
}: StudioSpinnerProps) {
  const style = {
    "--size": `${size}px`,
    "--thickness": `${thickness}px`,
    ...(color ? { "--spinner-color": color } : {}),
    ...(trackColor ? { "--track-color": trackColor } : {}),
  } as React.CSSProperties;

  return (
    <progress
      aria-label={label}
      className={`studio-spinner ${className}`}
      style={style}
    />
  );
}

interface StudioProgressBarProps {
  value?: number;
  max?: number;
  label?: string;
  fillColor?: string;
  trackColor?: string;
  height?: number;
  className?: string;
}

/**
 * Accessible determinate or indeterminate progress bar backed by native <progress>.
 * Omit `value` for an indeterminate sliding indicator.
 */
export function StudioProgressBar({
  value,
  max = 100,
  label = "Progress",
  fillColor,
  trackColor,
  height = 6,
  className = "",
}: StudioProgressBarProps) {
  const style = {
    height: `${height}px`,
    ...(fillColor ? { "--progress-bar-fill": fillColor } : {}),
    ...(trackColor ? { "--progress-bar-track": trackColor } : {}),
  } as React.CSSProperties;

  return (
    <progress
      aria-label={label}
      {...(value !== undefined ? { value, max } : {})}
      className={`studio-progress ${className}`}
      style={style}
    />
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`studio-skeleton rounded-xl ${className}`}
    />
  );
}

export function DriveContentSkeleton({
  showSummary = true,
  showFolders = true,
}: {
  showSummary?: boolean;
  showFolders?: boolean;
}) {
  return (
    <div
      aria-label="Loading vault contents"
      className="flex-1 flex flex-col space-y-7 select-none"
    >
      {/* Vault Summary Strip Skeleton */}
      {showSummary && (
        <div className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-10 h-10 rounded-xl" />
              <div className="space-y-1.5">
                <SkeletonBlock className="w-24 h-3" />
                <SkeletonBlock className="w-36 h-4" />
              </div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-[var(--border-hairline)]" />
            <div className="flex items-center gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <SkeletonBlock className="w-14 h-2.5" />
                  <SkeletonBlock className="w-10 h-4" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="w-28 h-9 rounded-xl" />
            <SkeletonBlock className="w-28 h-9 rounded-xl" />
            <SkeletonBlock className="w-24 h-9 rounded-xl hidden sm:block" />
          </div>
        </div>
      )}

      {/* Folders Section Skeleton */}
      {showFolders && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-0.5">
            <SkeletonBlock className="w-24 h-3.5" />
            <SkeletonBlock className="w-24 h-6 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3.5"
              >
                <div className="flex items-start justify-between">
                  <SkeletonBlock className="w-10 h-10 rounded-xl" />
                  <SkeletonBlock className="w-5 h-5 rounded-md" />
                </div>
                <div className="space-y-1.5">
                  <SkeletonBlock className="w-3/4 h-4" />
                  <SkeletonBlock className="w-1/2 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos Grid Skeleton */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-0.5">
          <SkeletonBlock className="w-24 h-3.5" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] overflow-hidden"
            >
              <SkeletonBlock className="aspect-video w-full rounded-none" />
              <div className="p-3.5 space-y-2">
                <SkeletonBlock className="w-4/5 h-4" />
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="w-12 h-3" />
                  <SkeletonBlock className="w-10 h-3" />
                  <SkeletonBlock className="w-14 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DriveWorkspaceSkeleton() {
  return (
    <div
      aria-label="Initializing YT Drive Vault"
      className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col select-none"
    >
      {/* Top Header Skeleton */}
      <div className="h-15 w-full border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/85 px-3 sm:px-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <SkeletonBlock className="w-8 h-8 rounded-xl" />
          <SkeletonBlock className="w-24 h-4 hidden sm:block" />
        </div>
        <SkeletonBlock className="flex-1 max-w-xl h-9.5 rounded-xl" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="w-18 h-9 rounded-xl hidden sm:block" />
          <SkeletonBlock className="w-9 h-9 rounded-xl" />
          <SkeletonBlock className="w-20 h-9 rounded-xl hidden md:block" />
          <SkeletonBlock className="w-24 h-9 rounded-xl" />
        </div>
      </div>

      {/* Main Split Body Skeleton */}
      <div className="flex-1 flex w-full">
        {/* Sidebar Skeleton */}
        <aside className="hidden lg:flex w-62 border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] flex-col shrink-0 p-3.5 space-y-4">
          <SkeletonBlock className="w-full h-10 rounded-xl" />
          <div className="space-y-2 pt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} className="w-full h-9 rounded-xl" />
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-[var(--border-hairline)]">
            <SkeletonBlock className="w-full h-20 rounded-2xl" />
          </div>
        </aside>

        {/* Main Explorer Skeleton */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Breadcrumbs Skeleton */}
          <div className="min-h-12 border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/65 px-4 sm:px-6 lg:px-7 py-2 flex items-center justify-between">
            <SkeletonBlock className="w-28 h-6 rounded-lg" />
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-16 h-8 rounded-xl" />
              <SkeletonBlock className="w-22 h-8 rounded-xl" />
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-7 flex-1 flex flex-col max-w-[1600px] w-full mx-auto">
            <DriveContentSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}

export function WatchPageSkeleton() {
  return (
    <div
      aria-label="Loading video stream"
      className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col select-none"
    >
      {/* Navbar Skeleton */}
      <div className="h-15 w-full border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/85 px-3 sm:px-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <SkeletonBlock className="w-9 h-9 rounded-xl" />
          <SkeletonBlock className="w-24 h-4 hidden sm:block" />
        </div>
        <SkeletonBlock className="flex-1 max-w-xl h-9.5 rounded-xl" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="w-9 h-9 rounded-xl" />
          <SkeletonBlock className="w-20 h-9 rounded-xl hidden sm:block" />
          <SkeletonBlock className="w-9 h-9 rounded-xl" />
        </div>
      </div>

      <main className="flex-1 max-w-[1680px] w-full mx-auto px-4 sm:px-6 pt-4 pb-10">
        <SkeletonBlock className="w-28 h-7 rounded-xl mb-3" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 space-y-5">
            <SkeletonBlock className="aspect-video w-full rounded-3xl" />
            <SkeletonBlock className="w-3/4 h-7 rounded-xl" />
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="w-10 h-10 rounded-xl" />
                <div className="space-y-1.5">
                  <SkeletonBlock className="w-32 h-3.5" />
                  <SkeletonBlock className="w-20 h-3" />
                </div>
                <SkeletonBlock className="w-24 h-9 rounded-xl ml-2" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonBlock className="w-28 h-9 rounded-xl" />
                <SkeletonBlock className="w-20 h-9 rounded-xl" />
                <SkeletonBlock className="w-20 h-9 rounded-xl" />
              </div>
            </div>
            <SkeletonBlock className="w-full h-24 rounded-2xl" />
          </div>

          <aside className="lg:col-span-4 space-y-3.5">
            <SkeletonBlock className="w-20 h-3.5" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <SkeletonBlock className="w-40 aspect-video rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <SkeletonBlock className="w-full h-3.5" />
                    <SkeletonBlock className="w-2/3 h-3" />
                    <SkeletonBlock className="w-1/2 h-2.5" />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
