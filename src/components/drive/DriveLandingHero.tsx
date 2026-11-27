"use client";

import { useState } from "react";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import AnimatedStudioBackdrop from "@/components/ui/AnimatedStudioBackdrop";
import { StudioSpinner, StudioProgressBar } from "@/components/ui/Loaders";
import {
  UploadCloud,
  ShieldCheck,
  FolderKanban,
  Play,
  LogOut,
  EyeOff,
  Lock,
  Globe,
  Folder,
  Link2,
  CheckCircle2,
  Star,
  Film,
  ArrowUpRight,
  Radio,
  Search,
} from "lucide-react";

interface DriveLandingHeroProps {
  missingPermissions: boolean;
  userEmail?: string | null;
  isConnecting: boolean;
  onConnectGoogle: () => void;
  onSignOut: () => Promise<void>;
  onOpenAuthModal: () => void;
}

type PreviewScene = "vault" | "cinema" | "upload";

interface PreviewClip {
  id: string;
  title: string;
  folder: string;
  meta: string;
  duration: string;
  elapsed: string;
  resolution: string;
  privacy: "Unlisted" | "Private";
  gradient: string;
  starred: boolean;
}

const PREVIEW_FOLDERS = [
  {
    name: "Raw B-Roll",
    count: "14 clips",
    dot: "bg-sky-400",
    tint: "bg-sky-500/10 border-sky-500/25 text-sky-500",
  },
  {
    name: "Client Edits",
    count: "8 clips",
    dot: "bg-emerald-400",
    tint: "bg-emerald-500/10 border-emerald-500/25 text-emerald-500",
  },
  {
    name: "Archive 4K",
    count: "21 clips",
    dot: "bg-rose-400",
    tint: "bg-rose-500/10 border-rose-500/25 text-rose-500",
  },
] as const;

const PREVIEW_CLIPS: PreviewClip[] = [
  {
    id: "launch",
    title: "Product_Launch_Master_4K.mp4",
    folder: "Client Edits",
    meta: "1.4 GB • 4K60 • 2h ago",
    duration: "14:22",
    elapsed: "06:18",
    resolution: "4K 60fps",
    privacy: "Unlisted",
    gradient: "from-rose-600/40 via-zinc-900 to-zinc-950",
    starred: true,
  },
  {
    id: "review",
    title: "Design_Review_Sync_04.mov",
    folder: "Raw B-Roll",
    meta: "420 MB • 1080p • Yesterday",
    duration: "08:45",
    elapsed: "03:12",
    resolution: "1080p HDR",
    privacy: "Private",
    gradient: "from-sky-600/35 via-slate-900 to-zinc-950",
    starred: false,
  },
];

export default function DriveLandingHero({
  missingPermissions,
  userEmail,
  isConnecting,
  onConnectGoogle,
  onSignOut,
  onOpenAuthModal,
}: DriveLandingHeroProps) {
  const [activeScene, setActiveScene] = useState<PreviewScene>("vault");
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  const [selectedClipId, setSelectedClipId] = useState<string>(PREVIEW_CLIPS[0].id);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const selectedClip =
    PREVIEW_CLIPS.find((c) => c.id === selectedClipId) || PREVIEW_CLIPS[0];

  const handleSignOutClick = async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col relative overflow-x-clip select-none">
      {/* Living Cinema Studio Backdrop */}
      <AnimatedStudioBackdrop variant="hero" />

      {/* Translucent Glass Top Bar */}
      <header className="h-15 w-full border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/75 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <span className="hidden md:inline-flex items-center gap-1.5 pl-2.5 border-l border-[var(--border-hairline)] text-[11px] font-mono text-[var(--text-muted)]">
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-[var(--accent-brand)] animate-pulse"
            />
            <span>STUDIO DECK</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!missingPermissions ? (
            <button
              type="button"
              onClick={onOpenAuthModal}
              disabled={isConnecting}
              className="studio-btn h-9 px-3.5 rounded-xl bg-[var(--accent-cta-bg)] hover:opacity-90 text-[var(--accent-cta-fg)] font-semibold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-sm"
            >
              {isConnecting ? (
                <>
                  <StudioSpinner
                    size={14}
                    thickness={2}
                    label="Connecting"
                    color="currentColor"
                    trackColor="color-mix(in srgb, currentColor 25%, transparent)"
                  />
                  <span>Connecting...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSignOutClick}
              disabled={isSigningOut}
              className="studio-btn h-9 px-3.5 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-medium text-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSigningOut ? (
                <StudioSpinner size={14} thickness={2} label="Signing out" />
              ) : (
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Hero & Interactive Cinema Console */}
      <main className="flex-1 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-16 lg:pt-16 lg:pb-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Editorial Studio Copy & CTA */}
            <div className="lg:col-span-6 space-y-6">
              {/* Hardware-style Live Telemetry Strip */}
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)]/80 backdrop-blur-md border border-[var(--border-hairline)] shadow-xs">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--accent-brand)]">
                  <Radio className="w-3 h-3" aria-hidden="true" />
                  <span>Vault Live</span>
                </span>
                <span className="w-px h-3 bg-[var(--border-strong)]" aria-hidden="true" />
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  YouTube-Backed Media Drive
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl lg:text-[2.9rem] font-bold tracking-tight text-[var(--text-primary)] leading-[1.08]">
                  {missingPermissions ? (
                    "Grant YouTube Upload Access"
                  ) : (
                    <>
                      Your Private Video Vault,{" "}
                      <span className="studio-hero-accent">Without Limits.</span>
                    </>
                  )}
                </h1>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-xl">
                  {missingPermissions
                    ? `Signed in as ${userEmail || "your Google account"}, but YouTube Data permissions are missing. Reconnect Google and allow YouTube access to sync folders, upload videos, and stream inside your private vault.`
                    : "Turn your YouTube channel into a fast, zero-bloat cloud drive. Stream high-bitrate footage directly via resumable chunks, organize in color-coded collections, and play ad-free in Cinema Mode."}
                </p>
              </div>

              {/* Primary CTA Stack */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onConnectGoogle}
                  disabled={isConnecting}
                  className="studio-btn h-11.5 px-5.5 rounded-xl bg-[var(--accent-cta-bg)] hover:opacity-92 text-[var(--accent-cta-fg)] font-semibold text-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 shadow-[0_8px_28px_-6px_rgba(225,29,72,0.35),0_2px_8px_rgba(0,0,0,0.18)]"
                >
                  {isConnecting ? (
                    <>
                      <StudioSpinner
                        size={16}
                        thickness={2}
                        label="Connecting Google"
                        color="currentColor"
                        trackColor="color-mix(in srgb, currentColor 25%, transparent)"
                      />
                      <span>Connecting Google...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 shrink-0"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>
                        {missingPermissions
                          ? "Reconnect with YouTube Access"
                          : "Continue with Google"}
                      </span>
                      <ArrowUpRight className="w-4 h-4 opacity-70" aria-hidden="true" />
                    </>
                  )}
                </button>

                {missingPermissions && (
                  <button
                    type="button"
                    onClick={handleSignOutClick}
                    disabled={isSigningOut}
                    className="studio-btn h-11.5 px-4 rounded-xl bg-[var(--bg-surface)]/85 hover:bg-[var(--bg-muted)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 backdrop-blur-md"
                  >
                    {isSigningOut ? (
                      <StudioSpinner
                        size={14}
                        thickness={2}
                        label="Signing out"
                      />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                  </button>
                )}
              </div>

              {/* Hardware Telemetry Bar */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[var(--border-hairline)] max-w-lg">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Auth Scope
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                    Channel OAuth
                  </div>
                </div>
                <div className="border-l border-[var(--border-hairline)] pl-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Ingestion
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                    Resumable Chunks
                  </div>
                </div>
                <div className="border-l border-[var(--border-hairline)] pl-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                    Footprint
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                    0 MB Local Bloat
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Cinema Studio Deck */}
            <div className="lg:col-span-6">
              <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-white/25 via-white/10 to-transparent dark:from-white/20 dark:via-white/5 dark:to-transparent shadow-[0_24px_70px_-16px_rgba(0,0,0,0.45)]">
                <div className="rounded-[calc(1.5rem-1px)] bg-[var(--bg-surface)]/90 backdrop-blur-2xl overflow-hidden border border-[var(--border-hairline)]">
                  {/* Studio Deck Header */}
                  <div className="px-4 py-3 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/65 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[var(--accent-brand)]/12 border border-[var(--accent-brand)]/25 flex items-center justify-center text-[var(--accent-brand)]">
                        <Film className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="text-[11px] font-mono font-semibold text-[var(--text-primary)] leading-none">
                          VAULT CONSOLE
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5 leading-none">
                          4K60 • NO-COOKIE STREAM
                        </div>
                      </div>
                    </div>

                    <div
                      role="tablist"
                      aria-label="Preview workspace modes"
                      className="flex items-center gap-1 bg-[var(--bg-muted)]/90 p-0.5 rounded-xl border border-[var(--border-hairline)] text-[11px]"
                    >
                      {(
                        [
                          { id: "vault", label: "Drive Vault" },
                          { id: "cinema", label: "Cinema" },
                          { id: "upload", label: "Live Upload" },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={activeScene === tab.id}
                          onClick={() => setActiveScene(tab.id)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                            activeScene === tab.id
                              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-hairline)]"
                              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deck Stage */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {activeScene === "vault" && (
                      <>
                        {/* Interactive Folders Row */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            <span>Collections</span>
                            <button
                              type="button"
                              onClick={() => setSelectedFolder("All")}
                              className="font-mono hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            >
                              {selectedFolder === "All"
                                ? "3 folders"
                                : `Filter: ${selectedFolder} (Reset)`}
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2.5">
                            {PREVIEW_FOLDERS.map((f) => {
                              const isActive = selectedFolder === f.name;
                              return (
                                <button
                                  key={f.name}
                                  type="button"
                                  onClick={() =>
                                    setSelectedFolder((prev) =>
                                      prev === f.name ? "All" : f.name
                                    )
                                  }
                                  className={`studio-interactive-card text-left p-2.5 rounded-xl border space-y-2 cursor-pointer ${
                                    isActive
                                      ? "bg-[var(--bg-elevated)] border-[var(--accent-brand)]/60 ring-1 ring-[var(--accent-brand)]/25 shadow-sm"
                                      : "bg-[var(--bg-canvas)]/80 border-[var(--border-hairline)] hover:border-[var(--border-strong)]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div
                                      className={`w-7 h-7 rounded-lg border flex items-center justify-center ${f.tint}`}
                                    >
                                      <Folder className="w-3.5 h-3.5" aria-hidden="true" />
                                    </div>
                                    <span
                                      aria-hidden="true"
                                      className={`w-1.5 h-1.5 rounded-full ${f.dot}`}
                                    />
                                  </div>
                                  <div>
                                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                      {f.name}
                                    </div>
                                    <div className="text-[10px] font-mono text-[var(--text-muted)]">
                                      {f.count}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interactive Video Clips */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                            <span>Recent Vault Media</span>
                            <span className="font-mono text-[10px]">
                              Click clip to play
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {PREVIEW_CLIPS.filter(
                              (c) =>
                                selectedFolder === "All" ||
                                c.folder === selectedFolder ||
                                selectedFolder === "Archive 4K"
                            ).map((v) => {
                              const PrivacyIcon =
                                v.privacy === "Unlisted" ? EyeOff : Lock;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedClipId(v.id);
                                    setActiveScene("cinema");
                                  }}
                                  className="studio-interactive-card group text-left rounded-2xl border border-[var(--border-hairline)] hover:border-[var(--border-strong)] bg-[var(--bg-canvas)]/90 overflow-hidden cursor-pointer shadow-xs hover:shadow-lg"
                                >
                                  <div
                                    className={`relative aspect-video bg-gradient-to-br ${v.gradient} flex items-center justify-center overflow-hidden`}
                                  >
                                    <span className="w-9 h-9 rounded-full bg-black/65 border border-white/25 text-white flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
                                      <Play
                                        className="w-3.5 h-3.5 fill-white ml-0.5"
                                        aria-hidden="true"
                                      />
                                    </span>
                                    {v.starred && (
                                      <Star
                                        className="w-3.5 h-3.5 text-amber-400 fill-amber-400 absolute top-2 right-2"
                                        aria-hidden="true"
                                      />
                                    )}
                                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/75 text-zinc-200 border border-white/10">
                                        <PrivacyIcon
                                          className={`w-2.5 h-2.5 ${
                                            v.privacy === "Unlisted"
                                              ? "text-amber-300"
                                              : "text-zinc-300"
                                          }`}
                                          aria-hidden="true"
                                        />
                                        <span>{v.privacy}</span>
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-white">
                                        {v.duration}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-2.5">
                                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                      {v.title}
                                    </div>
                                    <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                                      {v.meta}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {activeScene === "cinema" && (
                      <div className="space-y-3">
                        <div className="aspect-video w-full rounded-2xl bg-gradient-to-br from-zinc-900 via-black to-rose-950/50 border border-white/12 relative flex flex-col items-center justify-center p-4 text-center overflow-hidden">
                          {/* Subtle Moving Timeline Scan Glow */}
                          <div
                            aria-hidden="true"
                            className="studio-timeline-sweep absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-rose-500/15 to-transparent pointer-events-none"
                          />

                          {/* Animated Equalizer Bars */}
                          <div
                            aria-hidden="true"
                            className="flex items-end gap-1 h-5 mb-2.5"
                          >
                            {[0, 1, 2, 3, 4].map((bar) => (
                              <span
                                key={bar}
                                className="studio-eq-bar w-1 h-full rounded-full bg-rose-400/80"
                                style={{ animationDelay: `${bar * 170}ms` }}
                              />
                            ))}
                          </div>

                          <div className="w-12 h-12 rounded-full bg-[var(--accent-brand)] text-white flex items-center justify-center shadow-[0_0_28px_rgba(244,63,94,0.45)] mb-2">
                            <Play
                              className="w-5 h-5 fill-white ml-0.5"
                              aria-hidden="true"
                            />
                          </div>
                          <div className="text-xs font-semibold text-white truncate max-w-[90%]">
                            {selectedClip.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            youtube-nocookie.com • Adaptive {selectedClip.resolution}
                          </div>

                          {/* Simulated Player Scrubber */}
                          <div className="absolute bottom-2.5 left-3 right-3 space-y-1.5">
                            <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
                              <div className="h-full w-[44%] rounded-full bg-gradient-to-r from-rose-500 to-amber-400" />
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10">
                                <Globe
                                  className="w-2.5 h-2.5 text-emerald-400"
                                  aria-hidden="true"
                                />
                                <span>Privacy-Enhanced Embed</span>
                              </span>
                              <span>
                                {selectedClip.elapsed} / {selectedClip.duration}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                          <div className="p-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
                            <span className="text-[var(--text-muted)] block text-[10px]">
                              Resolution
                            </span>
                            <span className="font-mono font-semibold">
                              {selectedClip.resolution}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
                            <span className="text-[var(--text-muted)] block text-[10px]">
                              Visibility
                            </span>
                            <span className="font-semibold">
                              {selectedClip.privacy}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
                            <span className="text-[var(--text-muted)] block text-[10px]">
                              Share Link
                            </span>
                            <span className="font-semibold text-emerald-500">
                              1-Click Copy
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeScene === "upload" && (
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <StudioSpinner
                                size={16}
                                thickness={2}
                                label="Uploading sample"
                              />
                              <span className="text-xs font-semibold truncate">
                                Keynote_Export_HDR.mp4
                              </span>
                            </div>
                            <span className="font-mono text-xs font-semibold text-[var(--accent-brand)] tabular-nums">
                              74%
                            </span>
                          </div>
                          <StudioProgressBar
                            value={74}
                            max={100}
                            label="Sample upload progress"
                          />
                          {/* Mini Chunk Packet Indicators */}
                          <div className="flex items-center gap-1 pt-0.5" aria-hidden="true">
                            {Array.from({ length: 10 }).map((_, idx) => (
                              <span
                                key={idx}
                                className={`h-1.5 flex-1 rounded-full ${
                                  idx < 7
                                    ? "bg-emerald-500/85"
                                    : idx === 7
                                    ? "bg-[var(--accent-brand)] animate-pulse"
                                    : "bg-[var(--bg-muted)]"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                            <span>Chunk 08/10 • 28.4 MB/s</span>
                            <span>11s left</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle2
                                className="w-4 h-4 text-emerald-500 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="text-xs font-semibold truncate">
                                Demo_Walkthrough_v2.mp4
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              Synced
                            </span>
                          </div>
                          <StudioProgressBar
                            value={100}
                            max={100}
                            fillColor="#10b981"
                            label="Completed upload"
                          />
                          <div className="text-[10px] font-mono text-[var(--text-muted)]">
                            Stored as Unlisted in Client Edits folder
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Asymmetric Studio Bento Grid */}
          <section
            aria-label="Key features"
            className="mt-16 lg:mt-22 grid grid-cols-1 md:grid-cols-12 gap-4"
          >
            {/* Card 1: Featured Pipeline Card */}
            <div className="studio-interactive-card md:col-span-12 lg:col-span-5 p-5 rounded-2xl bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-[var(--border-hairline)] hover:border-[var(--border-strong)] flex flex-col justify-between gap-4 shadow-xs hover:shadow-xl">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-[var(--accent-brand)]">
                    <UploadCloud className="w-4.5 h-4.5" aria-hidden="true" />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-muted)]">
                    8 MB Chunks
                  </span>
                </div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Resumable Chunked Upload
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Drop massive 4K exports onto the window for fault-tolerant chunk streaming straight into your YouTube channel.
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-hairline)] font-mono text-[10px] text-[var(--text-muted)]">
                <span className="px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-primary)]">
                  File Drop
                </span>
                <span aria-hidden="true">→</span>
                <span className="px-2 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
                  Chunk Stream
                </span>
                <span aria-hidden="true">→</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                  YT Vault
                </span>
              </div>
            </div>

            {/* Card 2: Smart Collections & Instant Search */}
            <div className="studio-interactive-card md:col-span-6 lg:col-span-4 p-5 rounded-2xl bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-[var(--border-hairline)] hover:border-[var(--border-strong)] flex flex-col justify-between gap-4 shadow-xs hover:shadow-xl">
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-500">
                  <FolderKanban className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Color-Coded Collections
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Organize footage into folders with tags, batch moves, trash recovery, and keyboard-first search.
                </p>
              </div>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[11px] text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <Search className="w-3 h-3" aria-hidden="true" />
                  <span>Filter clips &amp; tags...</span>
                </span>
                <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-muted)] border border-[var(--border-hairline)]">
                  /
                </kbd>
              </div>
            </div>

            {/* Card 3: Granular Visibility */}
            <div className="studio-interactive-card md:col-span-6 lg:col-span-3 p-5 rounded-2xl bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-[var(--border-hairline)] hover:border-[var(--border-strong)] flex flex-col justify-between gap-4 shadow-xs hover:shadow-xl">
              <div className="space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  Granular Visibility
                </h2>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Keep dailies Private, share Unlisted review links, or publish live.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                  <EyeOff className="w-2.5 h-2.5 text-amber-500" aria-hidden="true" />
                  Unlisted
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                  <Lock className="w-2.5 h-2.5 text-[var(--text-muted)]" aria-hidden="true" />
                  Private
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                  <Globe className="w-2.5 h-2.5 text-emerald-500" aria-hidden="true" />
                  Public
                </span>
              </div>
            </div>

            {/* Card 4: Wide Theater & URL Import Pair */}
            <div className="studio-interactive-card md:col-span-6 lg:col-span-6 p-5 rounded-2xl bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-[var(--border-hairline)] hover:border-[var(--border-strong)] flex items-center justify-between gap-4 shadow-xs hover:shadow-xl">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500">
                    <Play className="w-4 h-4 fill-current ml-0.5" aria-hidden="true" />
                  </span>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                    Ad-Free Theater Cinema Player
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-md">
                  Stream clips in a distraction-free theater modal powered by privacy-enhanced embeds with instant metadata inspection.
                </p>
              </div>
              <span className="hidden sm:inline-flex shrink-0 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-muted)]">
                youtube-nocookie
              </span>
            </div>

            <div className="studio-interactive-card md:col-span-6 lg:col-span-6 p-5 rounded-2xl bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-[var(--border-hairline)] hover:border-[var(--border-strong)] flex items-center justify-between gap-4 shadow-xs hover:shadow-xl">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-500">
                    <Link2 className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                    Instant YouTube URL Indexing
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-md">
                  Paste any existing YouTube link to catalog it straight into your folder tree alongside your uploaded vault videos.
                </p>
              </div>
              <span className="hidden sm:inline-flex shrink-0 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-muted)]">
                1-Click Sync
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
