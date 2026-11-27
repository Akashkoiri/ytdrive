"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  DriveProvider,
  useDrive,
  InitialDriveData,
  DriveTab,
} from "@/context/DriveContext";
import DriveHeader from "@/components/drive/DriveHeader";
import DriveSidebar from "@/components/drive/DriveSidebar";
import DriveBreadcrumbs from "@/components/drive/DriveBreadcrumbs";
import DriveFolderSection from "@/components/drive/DriveFolderSection";
import DriveGridCard from "@/components/drive/DriveGridCard";
import DriveTableView from "@/components/drive/DriveTableView";
import DriveInspector from "@/components/drive/DriveInspector";
import DriveUploadDock from "@/components/drive/DriveUploadDock";
import DriveLandingHero from "@/components/drive/DriveLandingHero";
import DriveVaultSummary from "@/components/drive/DriveVaultSummary";
import AnimatedStudioBackdrop from "@/components/ui/AnimatedStudioBackdrop";
import {
  DriveContentSkeleton,
  StudioProgressBar,
} from "@/components/ui/Loaders";
import { useAuthContent } from "@/context/AuthContentContext";
import Toast from "@/components/Toast";
import {
  UploadCloud,
  FileVideo,
  Link2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// Dynamic Code-Splitting for Heavy Modals (Loaded only when needed)
const UploadModal = dynamic(
  () => import("@/components/drive/UploadModal"),
  { ssr: false }
);
const ImportYouTubeModal = dynamic(
  () => import("@/components/drive/ImportYouTubeModal"),
  { ssr: false }
);
const NewFolderModal = dynamic(
  () => import("@/components/drive/NewFolderModal"),
  { ssr: false }
);
const MoveFilesModal = dynamic(
  () => import("@/components/drive/MoveFilesModal"),
  { ssr: false }
);
const CinemaPlayerModal = dynamic(
  () => import("@/components/drive/CinemaPlayerModal"),
  { ssr: false }
);
const AuthModal = dynamic(() => import("@/components/AuthModal"), {
  ssr: false,
});

interface InitialAuthState {
  isAuthenticated: boolean;
  hasYouTubeAccess: boolean;
  userEmail?: string | null;
}

interface DriveMainProps {
  initialData?: InitialDriveData;
  initialTab?: DriveTab;
  initialFolderId?: string | null;
  initialAuth?: InitialAuthState;
}

const emptySubscribe = () => () => {};

function DriveWorkspace({ initialAuth }: { initialAuth?: InitialAuthState }) {
  const { data: session, status } = useSession();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const useLiveSession = isHydrated && status !== "loading";
  const sessionRecord = session as unknown as Record<string, unknown> | null;
  const resolvedAuthenticated = useLiveSession
    ? status === "authenticated" && Boolean(session?.user)
    : Boolean(initialAuth?.isAuthenticated);
  const hasYouTubeAccess = useLiveSession
    ? Boolean(sessionRecord?.hasYouTubeAccess)
    : Boolean(initialAuth?.hasYouTubeAccess);
  const resolvedEmail = useLiveSession
    ? session?.user?.email
    : initialAuth?.userEmail;
  const isGoogleConnected = resolvedAuthenticated && hasYouTubeAccess;

  const {
    files,
    folders,
    currentFolderId,
    activeTab,
    searchQuery,
    viewMode,
    isLoading,
    hasYouTubeChannel,
    isSyncing,
    refreshDrive,
    isUploadModalOpen,
    isImportModalOpen,
    isNewFolderModalOpen,
    isMoveModalOpen,
    cinemaFile,
    setIsUploadModalOpen,
    setIsImportModalOpen,
    activePreviewFile,
    toastMessage,
    clearToast,
    uploadVideoFile,
    showToast,
  } = useDrive();

  const { openAuthModal } = useAuthContent();

  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on Escape
  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileSidebarOpen]);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      if (status === "authenticated") {
        await signOut({ redirect: false });
      }
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/";
      await signIn("google", { callbackUrl });
    } catch {
      setIsConnectingGoogle(false);
      showToast("Could not start Google sign-in. Please try again.");
    }
  };

  // Global drag and drop handler onto the window
  const handleWindowDragOver = (e: React.DragEvent) => {
    if (!isGoogleConnected) return;
    e.preventDefault();
    if (!isWindowDragging) setIsWindowDragging(true);
  };

  const handleWindowDragLeave = (e: React.DragEvent) => {
    if (!isGoogleConnected) return;
    if (e.relatedTarget === null) {
      setIsWindowDragging(false);
    }
  };

  const handleWindowDrop = (e: React.DragEvent) => {
    if (!isGoogleConnected) return;
    e.preventDefault();
    setIsWindowDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (
        file.type.startsWith("video/") ||
        /\.(mp4|mov|webm|mkv)$/i.test(file.name)
      ) {
        void uploadVideoFile(file, {
          title: file.name,
          folderId: currentFolderId,
          privacy: "unlisted",
        });
      } else {
        showToast("Please drop video files (MP4, MOV, WebM, MKV).");
      }
    }
  };

  const isMyDriveRoot = activeTab === "my-drive" && currentFolderId === null;
  const showInitialLoading =
    isLoading && files.length === 0 && folders.length === 0;

  if (!useLiveSession && !initialAuth) {
    return (
      <div className="min-h-screen w-full bg-[var(--bg-canvas)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <StudioProgressBar height={3} label="Checking connection" className="w-36" />
          <span className="text-xs font-mono text-[var(--text-muted)]">
            Checking session...
          </span>
        </div>
      </div>
    );
  }

  if (!isGoogleConnected) {
    const missingPermissions = resolvedAuthenticated && !hasYouTubeAccess;
    return (
      <>
        <DriveLandingHero
          missingPermissions={missingPermissions}
          userEmail={resolvedEmail}
          isConnecting={isConnectingGoogle}
          onConnectGoogle={handleConnectGoogle}
          onSignOut={async () => {
            await signOut({ redirect: false });
          }}
          onOpenAuthModal={openAuthModal}
        />
        <AuthModal />
        {toastMessage && <Toast message={toastMessage} onClose={clearToast} />}
      </>
    );
  }

  return (
    <div
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
      onDrop={handleWindowDrop}
      className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col relative overflow-x-clip selection:bg-rose-500/25"
    >
      {/* Subtle Ambient Studio Backdrop */}
      <AnimatedStudioBackdrop variant="workspace" />

      {/* Top Command Header */}
      <DriveHeader
        onOpenMobileSidebar={() => setIsMobileSidebarOpen((v) => !v)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex w-full relative z-10">
        {/* Left Navigation Rail / Mobile Drawer */}
        <DriveSidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Central File & Folder Explorer */}
        <main className="flex-1 flex flex-col min-w-0 relative">
          {/* Background Sync Indeterminate Progress Bar */}
          {isSyncing && !showInitialLoading && (
            <div className="w-full">
              <StudioProgressBar
                height={2}
                label="Syncing YouTube Cloud Drive"
                className="rounded-none"
              />
            </div>
          )}

          {/* Breadcrumbs and Batch Action Toolbar */}
          <DriveBreadcrumbs />

          {!hasYouTubeChannel && (
            <div className="px-4 sm:px-6 lg:px-7 pt-4 max-w-[1600px] w-full mx-auto">
              <div className="p-3.5 sm:px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-2.5">
                  <AlertTriangle
                    className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="font-semibold text-[var(--text-primary)]">
                      No YouTube channel found
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {" "}
                      — First create a YouTube channel for{" "}
                      <span className="font-medium text-[var(--text-primary)]">
                        {resolvedEmail || "this Google account"}
                      </span>{" "}
                      before uploading videos.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://www.youtube.com/create_channel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-[11px] inline-flex items-center gap-1.5 transition-colors"
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
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-7 flex-1 flex flex-col max-w-[1600px] w-full mx-auto">
            {showInitialLoading ? (
              <DriveContentSkeleton
                showSummary={isMyDriveRoot}
                showFolders={isMyDriveRoot}
              />
            ) : (
              <>
                {/* Vault Overview & Quick Actions on My Drive Root */}
                {isMyDriveRoot && !searchQuery.trim() && <DriveVaultSummary />}

                {/* Folders Section */}
                {isMyDriveRoot && <DriveFolderSection />}

                {/* Video Files Section */}
                <section className="flex-1 flex flex-col" aria-label="Videos">
                  {files.length > 0 && (
                    <div className="flex items-center justify-between mb-3.5 px-0.5">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        Videos{" "}
                        <span className="font-mono text-[11px] ml-1 tabular-nums">
                          ({files.length})
                        </span>
                      </h2>
                    </div>
                  )}

                  {files.length > 0 ? (
                    viewMode === "grid" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                        {files.map((file, idx) => (
                          <DriveGridCard
                            key={file.id}
                            file={file}
                            index={idx}
                          />
                        ))}
                      </div>
                    ) : (
                      <DriveTableView />
                    )
                  ) : (
                    /* Clean Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center select-none">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] flex items-center justify-center text-[var(--text-muted)] mb-4 shadow-sm">
                        <FileVideo className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <h2 className="text-base font-semibold text-[var(--text-primary)] tracking-tight">
                        {activeTab === "trash"
                          ? "Trash is empty"
                          : activeTab === "starred"
                          ? "No starred videos yet"
                          : activeTab === "shared"
                          ? "No shared videos yet"
                          : activeTab === "recent"
                          ? "No recent activity"
                          : "This folder is empty"}
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-sm mt-1.5 mb-6 leading-relaxed">
                        {activeTab === "trash"
                          ? "Videos moved to Trash will appear here until you restore or permanently delete them."
                          : "Drop a video file anywhere on this window, upload from your device, or save a YouTube URL."}
                      </p>

                      {activeTab !== "trash" && (
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setIsUploadModalOpen(true)}
                            className="h-9 px-4 rounded-xl bg-[var(--accent-cta-bg)] hover:opacity-90 text-[var(--accent-cta-fg)] font-semibold text-xs flex items-center gap-2 transition-opacity cursor-pointer shadow-xs"
                          >
                            <UploadCloud className="w-4 h-4" aria-hidden="true" />
                            <span>Upload video</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="h-9 px-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-muted)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-medium text-xs flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Link2 className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
                            <span>Save from URL</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>

        {/* Right Details Inspector Panel */}
        {activePreviewFile && <DriveInspector />}
      </div>

      {/* Floating Bottom-Right Upload Progress Dock */}
      <DriveUploadDock />

      {/* Full-Window Drag and Drop Backdrop Overlay */}
      {isWindowDragging && (
        <div className="fixed inset-0 bg-[var(--bg-canvas)]/85 backdrop-blur-md z-50 flex items-center justify-center pointer-events-none p-6">
          <div className="w-full h-full rounded-3xl border-2 border-dashed border-[var(--accent-brand)] bg-rose-500/5 flex flex-col items-center justify-center gap-3.5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-[var(--accent-brand)] shadow-xl">
              <UploadCloud className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              Drop video to upload
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Streams directly into your YouTube Cloud Vault
            </p>
          </div>
        </div>
      )}

      {/* Modals Suite */}
      {isUploadModalOpen && <UploadModal />}
      {isImportModalOpen && <ImportYouTubeModal />}
      {isNewFolderModalOpen && <NewFolderModal />}
      {isMoveModalOpen && <MoveFilesModal />}
      {cinemaFile && <CinemaPlayerModal />}
      <AuthModal />

      {/* System Toast Notification */}
      {toastMessage && <Toast message={toastMessage} onClose={clearToast} />}
    </div>
  );
}

export default function DriveMain({
  initialData,
  initialTab,
  initialFolderId,
  initialAuth,
}: DriveMainProps) {
  return (
    <DriveProvider
      initialData={initialData}
      initialTab={initialTab}
      initialFolderId={initialFolderId}
    >
      <DriveWorkspace initialAuth={initialAuth} />
    </DriveProvider>
  );
}
