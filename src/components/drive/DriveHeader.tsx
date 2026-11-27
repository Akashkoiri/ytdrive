"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useDrive, PrivacyFilter } from "@/context/DriveContext";
import { useAuthContent } from "@/context/AuthContentContext";
import {
  Search,
  HardDrive,
  User,
  LogOut,
  Check,
  SlidersHorizontal,
  X,
  RotateCw,
  Menu,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";
import { StudioSpinner } from "@/components/ui/Loaders";
import { formatBytes } from "@/utils/format";

interface DriveHeaderProps {
  onOpenMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export default function DriveHeader({
  onOpenMobileSidebar,
  isMobileSidebarOpen = false,
}: DriveHeaderProps) {
  const {
    searchQuery,
    setSearchQuery,
    privacyFilter,
    setPrivacyFilter,
    storageStats,
    isLiveYouTubeSync,
    isSyncing,
    refreshDrive,
  } = useDrive();

  const { user, isAuthenticated, logout, openAuthModal } = useAuthContent();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const storageRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const imageError = Boolean(user?.image && failedImageUrl === user.image);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
      if (storageRef.current && !storageRef.current.contains(e.target as Node)) {
        setIsStorageOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsFilterOpen(false);
        setIsStorageOpen(false);
        setIsAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const usedSizeFormatted = formatBytes(storageStats?.usedBytes || 0);
  const quotaPct =
    (storageStats?.usedBytes || 0) > 0
      ? Math.min(
          100,
          Math.max(
            3,
            Math.round(
              ((storageStats?.usedBytes || 0) / (100 * 1024 * 1024 * 1024)) * 100
            )
          )
        )
      : 0;

  return (
    <header className="h-15 w-full border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/85 backdrop-blur-xl px-3 sm:px-5 flex items-center justify-between gap-3 sticky top-0 z-30 select-none">
      {/* Left: Mobile Drawer Trigger + Brand Identity */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label={isMobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileSidebarOpen}
            className="lg:hidden h-9 w-9 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-muted)]/60 hover:bg-[var(--bg-muted)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        <Logo size="md" />

        {isLiveYouTubeSync && (
          <span
            className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
            title="YouTube Cloud Connected"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Synced</span>
          </span>
        )}
      </div>

      {/* Center: Semantic Search & Visibility Filter */}
      <search className="flex-1 max-w-xl">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative flex items-center w-full"
        >
          <Search
            className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="drive-search-input" className="visually-hidden">
            Search videos, folders, or tags
          </label>
          <input
            id="drive-search-input"
            ref={searchInputRef}
            type="search"
            name="q"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Search videos, folders, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="studio-input w-full h-9.5 pl-10 pr-20 border rounded-xl text-xs sm:text-sm transition-colors outline-none"
          />

          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-10 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ) : (
            <kbd
              aria-hidden="true"
              className="absolute right-11 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-hairline)] hidden sm:inline-block"
            >
              /
            </kbd>
          )}

          {/* Visibility Filter Popover */}
          <div className="absolute right-1.5" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-expanded={isFilterOpen}
              aria-label="Filter by visibility"
              className={`h-7 px-2 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                privacyFilter !== "all"
                  ? "bg-[var(--accent-brand)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              }`}
              title="Filter by visibility"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-10 w-48 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-1.5 z-50 text-xs">
                <div className="px-2.5 py-1.5 text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                  Visibility
                </div>
                {(["all", "unlisted", "private", "public"] as PrivacyFilter[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setPrivacyFilter(mode);
                        setIsFilterOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left capitalize transition-colors cursor-pointer ${
                        privacyFilter === mode
                          ? "bg-[var(--bg-muted)] text-[var(--text-primary)] font-semibold"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]/60 hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <span>{mode === "all" ? "All Videos" : mode}</span>
                      {privacyFilter === mode && (
                        <Check className="w-3.5 h-3.5 text-[var(--accent-brand)]" aria-hidden="true" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </form>
      </search>

      {/* Right User Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Sync Button */}
        <button
          type="button"
          onClick={() => refreshDrive(true)}
          disabled={isSyncing}
          aria-label="Sync with YouTube"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] hover:border-[var(--border-strong)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-60"
          title="Sync with YouTube"
        >
          {isSyncing ? (
            <StudioSpinner size={14} thickness={2} label="Syncing with YouTube" />
          ) : (
            <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {isSyncing ? "Syncing..." : "Sync"}
          </span>
        </button>

        {/* Theme Switcher */}
        <ThemeToggle />

        {/* Storage Quota Popover */}
        <div className="relative" ref={storageRef}>
          <button
            type="button"
            onClick={() => setIsStorageOpen(!isStorageOpen)}
            aria-expanded={isStorageOpen}
            aria-label="Storage details"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] hover:border-[var(--border-strong)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Storage details"
          >
            <HardDrive className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="font-mono tabular-nums font-medium">
              {usedSizeFormatted}
            </span>
          </button>

          {isStorageOpen && (
            <div className="absolute right-0 top-11 w-68 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-4 z-50 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-hairline)]">
                <span className="font-semibold text-[var(--text-primary)]">
                  Cloud Storage
                </span>
                <span className="text-[var(--text-muted)] text-[11px] font-mono tabular-nums">
                  {usedSizeFormatted} used
                </span>
              </div>
              <div className="pt-3 space-y-3">
                <div className="w-full bg-[var(--bg-muted)] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all"
                    style={{ width: `${quotaPct}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[var(--bg-canvas)] p-2 rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[var(--text-muted)] block text-[10px]">
                      Videos
                    </span>
                    <span className="text-[var(--text-primary)] font-semibold font-mono tabular-nums">
                      {storageStats?.totalFiles || 0}
                    </span>
                  </div>
                  <div className="bg-[var(--bg-canvas)] p-2 rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[var(--text-muted)] block text-[10px]">
                      Unlisted
                    </span>
                    <span className="text-[var(--text-primary)] font-semibold font-mono tabular-nums">
                      {storageStats?.unlistedCount || 0}
                    </span>
                  </div>
                  <div className="bg-[var(--bg-canvas)] p-2 rounded-xl border border-[var(--border-hairline)]">
                    <span className="text-[var(--text-muted)] block text-[10px]">
                      Private
                    </span>
                    <span className="text-[var(--text-primary)] font-semibold font-mono tabular-nums">
                      {storageStats?.privateCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div className="relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => {
              if (isAuthenticated) {
                setIsAccountOpen(!isAccountOpen);
              } else {
                openAuthModal();
              }
            }}
            aria-expanded={isAccountOpen}
            aria-label={isAuthenticated ? "Account menu" : "Sign in"}
            className="flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] hover:border-[var(--border-strong)] transition-colors cursor-pointer"
          >
            {user?.image && !imageError ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                width={26}
                height={26}
                loading="eager"
                className="w-6.5 h-6.5 rounded-lg object-cover ring-1 ring-[var(--border-hairline)]"
                referrerPolicy="no-referrer"
                onError={() => setFailedImageUrl(user?.image || null)}
                unoptimized
              />
            ) : (
              <div className="w-6.5 h-6.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-primary)] font-semibold text-xs">
                {user?.name?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() || (
                    <User className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                  )}
              </div>
            )}
            <span className="hidden md:inline text-xs font-medium text-[var(--text-primary)] max-w-28 truncate">
              {user?.name || (isAuthenticated ? "Account" : "Sign in")}
            </span>
          </button>

          {isAccountOpen && (
            <div className="absolute right-0 top-11 w-64 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-2 z-50 text-xs">
              <div className="px-3 py-2.5 border-b border-[var(--border-hairline)]">
                <p className="font-semibold text-[var(--text-primary)] truncate">
                  {user?.name || "Account"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                  {user?.email || "No email"}
                </p>
              </div>

              <div className="py-2 px-1 border-b border-[var(--border-hairline)]">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-2 mb-1.5">
                  Appearance
                </div>
                <ThemeToggle variant="segment" />
              </div>

              <div className="pt-1.5">
                <button
                  type="button"
                  disabled={isSigningOut}
                  onClick={async () => {
                    setIsSigningOut(true);
                    try {
                      await logout();
                    } finally {
                      setIsSigningOut(false);
                      setIsAccountOpen(false);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-medium disabled:opacity-60"
                >
                  {isSigningOut ? (
                    <StudioSpinner size={14} thickness={2} label="Signing out" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
