"use client";

import { useState, useId } from "react";
import { useDrive } from "@/context/DriveContext";
import ModalDialog from "@/components/ui/ModalDialog";
import { StudioSpinner } from "@/components/ui/Loaders";
import { formatBytes } from "@/utils/format";
import {
  X,
  Star,
  Copy,
  ExternalLink,
  Check,
  EyeOff,
  Lock,
  Globe,
} from "lucide-react";

export default function CinemaPlayerModal() {
  const {
    cinemaFile,
    setCinemaFile,
    toggleStar,
    updateFilePrivacy,
    pendingFileIds,
    showToast,
  } = useDrive();
  const [copiedLink, setCopiedLink] = useState(false);
  const [loadedVideoId, setLoadedVideoId] = useState<string | null>(null);
  const titleId = useId();

  const file = cinemaFile;
  const isUpdatingPrivacy = Boolean(file && pendingFileIds.includes(file.id));
  const embedKey = file?.videoId ? `${file.videoId}-${file.privacy}` : "";
  const isIframeLoaded = Boolean(embedKey && loadedVideoId === embedKey);

  const handleCopyLink = () => {
    if (navigator.clipboard && file?.youtubeUrl) {
      navigator.clipboard.writeText(file.youtubeUrl);
      setCopiedLink(true);
      showToast("YouTube Cloud link copied.");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <ModalDialog
      open={Boolean(file)}
      onClose={() => setCinemaFile(null)}
      ariaLabelledBy={titleId}
      lightDismiss={false}
      className="cinema-dialog"
    >
      {file && (
        <div className="w-full h-full flex flex-col bg-zinc-950/95 text-zinc-100 select-none">
          {/* Top Bar */}
          <div className="h-15 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between gap-4 bg-black/50 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3 min-w-0 max-w-2xl">
              <h1
                id={titleId}
                className="font-semibold text-sm text-white truncate"
                title={file.name}
              >
                {file.name}
              </h1>
              <div
                role="group"
                aria-label="Video visibility"
                className="hidden sm:inline-flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5 shrink-0"
              >
                {(
                  [
                    { id: "unlisted", label: "Unlisted", icon: EyeOff, activeColor: "text-amber-300" },
                    { id: "private", label: "Private", icon: Lock, activeColor: "text-zinc-200" },
                    { id: "public", label: "Public", icon: Globe, activeColor: "text-emerald-400" },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const active = file.privacy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isUpdatingPrivacy}
                      onClick={() => void updateFilePrivacy(file.id, opt.id)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-60 ${
                        active
                          ? "bg-white/15 text-white shadow-2xs"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Icon
                        className={`w-3 h-3 ${active ? opt.activeColor : ""}`}
                        aria-hidden="true"
                      />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
                {isUpdatingPrivacy && (
                  <span className="px-1.5 flex items-center">
                    <StudioSpinner
                      size={11}
                      thickness={1.5}
                      label="Updating visibility"
                      color="#ffffff"
                    />
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleStar(file.id)}
                aria-label={file.starred ? "Remove star" : "Star video"}
                aria-pressed={file.starred}
                className={`h-9 w-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  file.starred
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                    : "bg-white/5 text-zinc-300 border-white/10 hover:text-white hover:bg-white/10"
                }`}
              >
                <Star
                  className={`w-4 h-4 ${file.starred ? "fill-amber-400" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {file.youtubeUrl && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-zinc-200 font-medium transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span className="hidden md:inline">
                      {copiedLink ? "Copied" : "Copy Link"}
                    </span>
                  </button>

                  <a
                    href={file.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open on YouTube"
                    className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-200 flex items-center justify-center transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                </>
              )}

              <button
                type="button"
                autoFocus
                onClick={() => setCinemaFile(null)}
                aria-label="Close cinema player"
                className="h-9 w-9 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center ml-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Theater Container */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto studio-scroll">
            {file.videoId && file.privacy === "private" && (
              <div className="w-full max-w-5xl mb-3 px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-300 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-[11px] leading-snug">
                    YouTube restricts{" "}
                    <strong className="text-white">Private</strong> videos from
                    embedding. Switch to Unlisted to stream inline.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={file.youtubeUrl || `https://youtu.be/${file.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-[11px] transition-colors flex items-center gap-1.5"
                  >
                    <span>Play on YouTube</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    disabled={isUpdatingPrivacy}
                    onClick={() => void updateFilePrivacy(file.id, "unlisted")}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-[11px] transition-colors flex items-center gap-1.5 border border-amber-500/30 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPrivacy ? (
                      <>
                        <StudioSpinner
                          size={11}
                          thickness={1.5}
                          label="Setting Unlisted"
                          color="currentColor"
                        />
                        <span>Setting Unlisted...</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" aria-hidden="true" />
                        <span>Set Unlisted</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl relative">
              {file.videoId ? (
                <>
                  {!isIframeLoaded && (
                    <div className="absolute inset-0 z-10 bg-zinc-950 flex flex-col items-center justify-center gap-3">
                      <StudioSpinner
                        size={30}
                        thickness={2.5}
                        label="Loading theater stream"
                        color="#ffffff"
                        trackColor="rgba(255,255,255,0.2)"
                      />
                      <span className="text-xs font-mono text-zinc-400">
                        Loading theater stream...
                      </span>
                    </div>
                  )}
                  <iframe
                    key={embedKey}
                    src={`https://www.youtube-nocookie.com/embed/${file.videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title={file.name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setLoadedVideoId(embedKey)}
                    className="w-full h-full border-0"
                  />
                </>
              ) : file.fileUrl ? (
                <video
                  src={file.fileUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain bg-black"
                />
              ) : null}
            </div>
          </div>

          {/* Technical Ribbon */}
          <div className="h-12 border-t border-white/10 px-4 sm:px-6 flex items-center justify-between text-xs text-zinc-400 bg-black/50 shrink-0">
            <div className="flex items-center gap-3 sm:gap-4 font-mono tabular-nums text-[11px] truncate">
              <span>
                Size:{" "}
                <strong className="text-zinc-200 font-medium">
                  {formatBytes(file.size)}
                </strong>
              </span>
              <span aria-hidden="true">•</span>
              <span>
                Duration:{" "}
                <strong className="text-zinc-200 font-medium">
                  {file.duration}
                </strong>
              </span>
              <span className="hidden sm:inline" aria-hidden="true">
                •
              </span>
              <span className="hidden sm:inline">
                Stream:{" "}
                <strong className="text-zinc-200 font-medium">
                  {file.resolution || "1080p"}
                </strong>
              </span>
              {file.videoId && (
                <>
                  <span className="hidden md:inline" aria-hidden="true">
                    •
                  </span>
                  <span className="hidden md:inline">
                    ID:{" "}
                    <strong className="text-zinc-200 font-medium">
                      {file.videoId}
                    </strong>
                  </span>
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              {file.tags &&
                file.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-zinc-300"
                  >
                    #{t}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}
    </ModalDialog>
  );
}
