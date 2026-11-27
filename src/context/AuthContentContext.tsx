"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { YouTubeVideoItem } from "@/data/mockVideos";

export interface HistoryItem {
  video: YouTubeVideoItem;
  watchedAt: string;
}

export interface UserProfile {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface AuthContentContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  savedVideos: YouTubeVideoItem[];
  likedVideos: YouTubeVideoItem[];
  watchHistory: HistoryItem[];
  isSaved: (video: YouTubeVideoItem) => boolean;
  isLiked: (video: YouTubeVideoItem) => boolean;
  toggleSave: (video: YouTubeVideoItem) => Promise<void>;
  toggleLike: (video: YouTubeVideoItem) => Promise<void>;
  addToHistory: (video: YouTubeVideoItem) => Promise<void>;
  clearHistory: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const AuthContentContext = createContext<AuthContentContextType | undefined>(
  undefined
);

// Fallback guest storage keys when unauthenticated
const GUEST_STORAGE_SAVED = "ytdrive_guest_saved_videos";
const GUEST_STORAGE_LIKED = "ytdrive_guest_liked_videos";
const GUEST_STORAGE_HISTORY = "ytdrive_guest_history";

const emptySubscribe = () => () => {};

export function AuthContentProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isAuthenticated =
    isHydrated && status === "authenticated" && Boolean(session?.user);

  const [savedVideos, setSavedVideos] = useState<YouTubeVideoItem[]>([]);
  const [likedVideos, setLikedVideos] = useState<YouTubeVideoItem[]>([]);
  const [watchHistory, setWatchHistory] = useState<HistoryItem[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);



  // Fetch user-scoped content whenever authenticated session changes
  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      setIsLoadingContent(true);
      if (isAuthenticated && session?.user?.id) {
        try {
          const res = await axios.get("/api/user/content");
          if (isMounted && res.data?.authenticated) {
            setSavedVideos(res.data.savedVideos || []);
            setLikedVideos(res.data.likedVideos || []);
            setWatchHistory(res.data.watchHistory || []);
          }
        } catch (err) {
          console.warn("Could not load user-scoped content:", err);
        }
      } else if (status === "unauthenticated") {
        // Load from guest local storage
        if (typeof window !== "undefined") {
          try {
            const rawSaved = localStorage.getItem(GUEST_STORAGE_SAVED);
            const rawLiked = localStorage.getItem(GUEST_STORAGE_LIKED);
            const rawHistory = localStorage.getItem(GUEST_STORAGE_HISTORY);
            if (isMounted) {
              setSavedVideos(rawSaved ? JSON.parse(rawSaved) : []);
              setLikedVideos(rawLiked ? JSON.parse(rawLiked) : []);
              setWatchHistory(rawHistory ? JSON.parse(rawHistory) : []);
            }
          } catch {
            if (isMounted) {
              setSavedVideos([]);
              setLikedVideos([]);
              setWatchHistory([]);
            }
          }
        }
      }
      if (isMounted) {
        setIsLoadingContent(false);
      }
    }

    if (status !== "loading") {
      loadContent();
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, session?.user?.id, status]);



  const isSaved = useCallback(
    (video: YouTubeVideoItem) => {
      const rawId = video.id.videoId.split("_p")[0];
      return savedVideos.some((v) => v.id.videoId.split("_p")[0] === rawId);
    },
    [savedVideos]
  );

  const isLiked = useCallback(
    (video: YouTubeVideoItem) => {
      const rawId = video.id.videoId.split("_p")[0];
      return likedVideos.some((v) => v.id.videoId.split("_p")[0] === rawId);
    },
    [likedVideos]
  );

  const toggleSave = useCallback(
    async (video: YouTubeVideoItem) => {
      const rawId = video.id.videoId.split("_p")[0];
      const exists = savedVideos.some((v) => v.id.videoId.split("_p")[0] === rawId);

      if (isAuthenticated) {
        const updated = exists
          ? savedVideos.filter((v) => v.id.videoId.split("_p")[0] !== rawId)
          : [video, ...savedVideos];
        setSavedVideos(updated);
        showToast(
          exists
            ? "Removed from your Drive Library"
            : `Saved to ${session?.user?.name || "User"}'s Drive Library`
        );

        try {
          const res = await axios.post("/api/user/content", {
            action: "toggle_save",
            video,
          });
          if (res.data?.savedVideos) {
            setSavedVideos(res.data.savedVideos);
          }
        } catch (err) {
          console.error("Failed to persist save to user library:", err);
          setSavedVideos(savedVideos);
          showToast("Failed to update saved videos");
        }
      } else {
        const updated = exists
          ? savedVideos.filter((v) => v.id.videoId.split("_p")[0] !== rawId)
          : [video, ...savedVideos];
        setSavedVideos(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem(GUEST_STORAGE_SAVED, JSON.stringify(updated));
        }
        showToast(
          exists
            ? "Removed from saved videos"
            : "Saved locally. Sign in to sync across devices!"
        );
      }
    },
    [isAuthenticated, savedVideos, session?.user?.name, showToast]
  );

  const toggleLike = useCallback(
    async (video: YouTubeVideoItem) => {
      const rawId = video.id.videoId.split("_p")[0];
      const exists = likedVideos.some((v) => v.id.videoId.split("_p")[0] === rawId);

      if (isAuthenticated) {
        const updated = exists
          ? likedVideos.filter((v) => v.id.videoId.split("_p")[0] !== rawId)
          : [video, ...likedVideos];
        setLikedVideos(updated);
        showToast(
          exists ? "Removed from Liked Videos" : "Added to your Liked Videos"
        );

        try {
          const res = await axios.post("/api/user/content", {
            action: "toggle_like",
            video,
          });
          if (res.data?.likedVideos) {
            setLikedVideos(res.data.likedVideos);
          }
        } catch (err) {
          console.error("Failed to persist like:", err);
          setLikedVideos(likedVideos);
        }
      } else {
        const updated = exists
          ? likedVideos.filter((v) => v.id.videoId.split("_p")[0] !== rawId)
          : [video, ...likedVideos];
        setLikedVideos(updated);
        if (typeof window !== "undefined") {
          localStorage.setItem(GUEST_STORAGE_LIKED, JSON.stringify(updated));
        }
        showToast(
          exists ? "Removed from Liked Videos" : "Liked! Sign in to keep synced."
        );
      }
    },
    [isAuthenticated, likedVideos, showToast]
  );

  const addToHistory = useCallback(
    async (video: YouTubeVideoItem) => {
      if (!video?.id?.videoId) return;
      const rawId = video.id.videoId.split("_p")[0];
      const newItem: HistoryItem = { video, watchedAt: new Date().toISOString() };

      setWatchHistory((prev) => {
        if (prev.length > 0 && prev[0].video.id.videoId.split("_p")[0] === rawId) {
          return prev;
        }
        const filtered = prev.filter(
          (h) => h.video.id.videoId.split("_p")[0] !== rawId
        );
        const updated = [newItem, ...filtered];
        if (typeof window !== "undefined" && !isAuthenticated) {
          try {
            localStorage.setItem(GUEST_STORAGE_HISTORY, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });

      if (isAuthenticated) {
        try {
          await axios.post("/api/user/content", {
            action: "add_history",
            video,
          });
        } catch (err) {
          console.warn("Failed to update user watch history:", err);
        }
      }
    },
    [isAuthenticated]
  );

  const clearHistory = useCallback(async () => {
    setWatchHistory([]);
    if (isAuthenticated) {
      try {
        await axios.post("/api/user/content", {
          action: "clear_history",
        });
        showToast("Watch history cleared");
      } catch (err) {
        console.warn("Failed to clear watch history:", err);
      }
    } else if (typeof window !== "undefined") {
      localStorage.removeItem(GUEST_STORAGE_HISTORY);
      showToast("Guest watch history cleared");
    }
  }, [isAuthenticated, showToast]);

  const logout = useCallback(async () => {
    try {
      showToast("Signing out...");

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ytdrive:logout"));
      }

      setSavedVideos([]);
      setLikedVideos([]);
      setWatchHistory([]);

      await signOut({ redirect: false });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ytdrive:logged-out"));
      }

      router.refresh();
      showToast("Signed out. Switched to Guest mode.");
    } catch (err) {
      console.error("Sign out error:", err);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ytdrive:logged-out"));
      }
    }
  }, [showToast, router]);

  const currentUser: UserProfile | null =
    isAuthenticated && session?.user
      ? {
          id: (session.user as { id?: string }).id || "usr_current",
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }
      : null;

  return (
    <AuthContentContext.Provider
      value={{
        user: currentUser,
        isAuthenticated,
        isLoading: status === "loading" || isLoadingContent,
        savedVideos,
        likedVideos,
        watchHistory,
        isSaved,
        isLiked,
        toggleSave,
        toggleLike,
        addToHistory,
        clearHistory,
        logout,
        isAuthModalOpen,
        openAuthModal: () => {
          if (!isAuthenticated) {
            setIsAuthModalOpen(true);
          }
        },
        closeAuthModal: () => setIsAuthModalOpen(false),
        toastMessage,
        showToast,
        clearToast,
      }}
    >
      {children}
    </AuthContentContext.Provider>
  );
}

export function useAuthContent() {
  const context = useContext(AuthContentContext);
  if (!context) {
    throw new Error("useAuthContent must be used within an AuthContentProvider");
  }
  return context;
}
