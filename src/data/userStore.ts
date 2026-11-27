import { YouTubeVideoItem, RAW_MOCK_VIDEOS } from "@/data/mockVideos";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  fetchYouTubeVideosByIds,
  parseIsoDuration,
  YouTubeVideoResource,
} from "@/lib/youtubeSyncService";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  password?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiresAt?: number;
  googleScope?: string;
}

export interface HistoryItem {
  video: YouTubeVideoItem;
  watchedAt: string;
}

export interface UserScopedData {
  savedVideos: YouTubeVideoItem[];
  likedVideos: YouTubeVideoItem[];
  watchHistory: HistoryItem[];
}

export interface FullUserDataStore {
  users: AppUser[];
  userContent: Record<string, UserScopedData>;
}

// Pre-seeded demo users with distinct IDs
export const DEMO_USERS: AppUser[] = [
  {
    id: "usr_alex_dev",
    name: "Alex Rivera",
    email: "alex@ytdrive.dev",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    password: "password123",
  },
  {
    id: "usr_sarah_dev",
    name: "Sarah Chen",
    email: "sarah@ytdrive.dev",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    password: "password123",
  },
];

const INITIAL_DEMO_CONTENT: Record<string, UserScopedData> = {
  usr_alex_dev: {
    savedVideos: [RAW_MOCK_VIDEOS[0], RAW_MOCK_VIDEOS[1]].filter(Boolean),
    likedVideos: [RAW_MOCK_VIDEOS[0]].filter(Boolean),
    watchHistory: [
      {
        video: RAW_MOCK_VIDEOS[0],
        watchedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        video: RAW_MOCK_VIDEOS[1],
        watchedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ].filter((h) => Boolean(h.video)),
  },
  usr_sarah_dev: {
    savedVideos: [
      RAW_MOCK_VIDEOS[2] || RAW_MOCK_VIDEOS[0],
      RAW_MOCK_VIDEOS[3] || RAW_MOCK_VIDEOS[1],
    ].filter(Boolean),
    likedVideos: [RAW_MOCK_VIDEOS[2] || RAW_MOCK_VIDEOS[0]].filter(Boolean),
    watchHistory: [
      {
        video: RAW_MOCK_VIDEOS[2] || RAW_MOCK_VIDEOS[0],
        watchedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ].filter((h) => Boolean(h.video)),
  },
};

// ---------------------------------------------------------------------------
// In-Memory Volatile Store (RAM only, NEVER writes to any local file or disk)
// Stored on globalThis so dev route bundles share the same fallback state.
// ---------------------------------------------------------------------------
const globalForUserStore = globalThis as unknown as {
  inMemoryUserStore?: FullUserDataStore;
  userPrismaUnhealthyUntil?: number;
};

const inMemoryUserStore: FullUserDataStore =
  globalForUserStore.inMemoryUserStore || {
    users: [...DEMO_USERS],
    userContent: { ...INITIAL_DEMO_CONTENT },
  };
globalForUserStore.inMemoryUserStore = inMemoryUserStore;

// ---------------------------------------------------------------------------
// Prisma ORM Queries for Supabase PostgreSQL
// ---------------------------------------------------------------------------

const PRISMA_COOLDOWN_MS = 30 * 1000;

function isPrismaActive(): boolean {
  const unhealthyUntil = globalForUserStore.userPrismaUnhealthyUntil || 0;
  return Boolean(prisma) && Date.now() > unhealthyUntil;
}

function handlePrismaError(actionName: string, err: unknown): void {
  const errMsg = err instanceof Error ? err.message : String(err);
  const errCode = (err as { code?: string })?.code || "";
  if (
    errMsg.includes("ENOTFOUND") ||
    errMsg.includes("tenant") ||
    errMsg.includes("connect") ||
    errMsg.includes("P2039") ||
    errMsg.includes("XX000") ||
    errMsg.includes("ECONNREFUSED") ||
    errMsg.includes("timeout") ||
    errCode === "ECONNREFUSED" ||
    errCode === "P1001" ||
    errCode === "P1002"
  ) {
    globalForUserStore.userPrismaUnhealthyUntil = Date.now() + PRISMA_COOLDOWN_MS;
    console.warn(
      `[userStore] Supabase Prisma database issue (${errCode || errMsg.split("\n")[0] || "connection"}). Using RAM fallback.`
    );
  } else {
    console.warn(`Prisma ${actionName} error:`, err);
  }
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const normalized = email.toLowerCase().trim();

  if (isPrismaActive()) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: normalized },
      });

      if (user) {
        return {
          id: user.id,
          name: user.name || "User",
          email: user.email,
          image: user.image || undefined,
          password: user.password || undefined,
          googleAccessToken: user.googleAccessToken || undefined,
          googleRefreshToken: user.googleRefreshToken || undefined,
          googleTokenExpiresAt: user.googleTokenExpiresAt
            ? Number(user.googleTokenExpiresAt)
            : undefined,
          googleScope: user.googleScope || undefined,
        };
      }
    } catch (err) {
      handlePrismaError("getUserByEmail", err);
    }
  }

  return (
    inMemoryUserStore.users.find(
      (u) => u.email.toLowerCase().trim() === normalized
    ) || null
  );
}

export async function getUserById(id: string): Promise<AppUser | null> {
  if (isPrismaActive()) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (user) {
        return {
          id: user.id,
          name: user.name || "User",
          email: user.email,
          image: user.image || undefined,
          password: user.password || undefined,
          googleAccessToken: user.googleAccessToken || undefined,
          googleRefreshToken: user.googleRefreshToken || undefined,
          googleTokenExpiresAt: user.googleTokenExpiresAt
            ? Number(user.googleTokenExpiresAt)
            : undefined,
          googleScope: user.googleScope || undefined,
        };
      }
    } catch (err) {
      handlePrismaError("getUserById", err);
    }
  }

  return inMemoryUserStore.users.find((u) => u.id === id) || null;
}

export async function registerOrGetOAuthUser(user: {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): Promise<AppUser> {
  const email = (user.email || "").toLowerCase().trim();
  const userId = user.id || `usr_oauth_${Date.now()}`;

  if (isPrismaActive()) {
    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            { id: userId },
          ],
        },
      });

      if (existing) {
        return {
          id: existing.id,
          name: existing.name || user.name || "OAuth User",
          email: existing.email,
          image: existing.image || user.image || undefined,
          googleAccessToken: existing.googleAccessToken || undefined,
          googleRefreshToken: existing.googleRefreshToken || undefined,
          googleTokenExpiresAt: existing.googleTokenExpiresAt
            ? Number(existing.googleTokenExpiresAt)
            : undefined,
          googleScope: existing.googleScope || undefined,
        };
      }

      const created = await prisma.user.create({
        data: {
          id: userId,
          name: user.name || "OAuth User",
          email: email || `${userId}@oauth.local`,
          image: user.image || undefined,
        },
      });

      return {
        id: created.id,
        name: created.name || "OAuth User",
        email: created.email,
        image: created.image || undefined,
      };
    } catch (err) {
      handlePrismaError("registerOrGetOAuthUser", err);
    }
  }

  // RAM fallback
  const existing = inMemoryUserStore.users.find(
    (u) =>
      (email && u.email.toLowerCase().trim() === email) ||
      (user.id && u.id === user.id)
  );

  if (existing) {
    if (user.name) existing.name = user.name;
    if (user.image) existing.image = user.image;
    return existing;
  }

  const newUser: AppUser = {
    id: userId,
    name: user.name || "OAuth User",
    email: email || `${userId}@oauth.local`,
    image: user.image || undefined,
  };

  inMemoryUserStore.users.push(newUser);
  if (!inMemoryUserStore.userContent[userId]) {
    inMemoryUserStore.userContent[userId] = {
      savedVideos: [],
      likedVideos: [],
      watchHistory: [],
    };
  }
  return newUser;
}

export async function saveUserOAuthTokens(
  userId: string,
  tokens: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    scope?: string;
  }
): Promise<void> {
  const normalizedId = (userId || "").toLowerCase().trim();
  const updateData: {
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleTokenExpiresAt?: bigint;
    googleScope?: string;
  } = {};

  if (tokens.accessToken !== undefined) updateData.googleAccessToken = tokens.accessToken;
  if (tokens.refreshToken !== undefined) updateData.googleRefreshToken = tokens.refreshToken;
  if (tokens.expiresAt !== undefined)
    updateData.googleTokenExpiresAt = BigInt(tokens.expiresAt);
  if (tokens.scope !== undefined) updateData.googleScope = tokens.scope;

  if (isPrismaActive()) {
    try {
      const updated = await prisma.user.updateMany({
        where: {
          OR: [
            { id: userId },
            { email: normalizedId },
          ],
        },
        data: updateData,
      });

      if (updated.count === 0 && userId) {
        // Create profile row in Supabase
        await prisma.user.create({
          data: {
            id: userId,
            email: normalizedId.includes("@")
              ? normalizedId
              : `${userId}@oauth.local`,
            name: "Google Account User",
            googleAccessToken: tokens.accessToken || null,
            googleRefreshToken: tokens.refreshToken || null,
            googleTokenExpiresAt: tokens.expiresAt
              ? BigInt(tokens.expiresAt)
              : null,
            googleScope: tokens.scope || null,
          },
        }).catch(() => {});
      }
    } catch (err) {
      handlePrismaError("saveUserOAuthTokens", err);
    }
  }

  // Update in-memory user
  let user = inMemoryUserStore.users.find(
    (u) =>
      u.id === userId ||
      (u.email && u.email.toLowerCase().trim() === normalizedId)
  );

  if (!user) {
    user = {
      id: userId,
      name: "Google Account User",
      email: normalizedId.includes("@") ? normalizedId : `${userId}@oauth.local`,
    };
    inMemoryUserStore.users.push(user);
    if (!inMemoryUserStore.userContent[userId]) {
      inMemoryUserStore.userContent[userId] = {
        savedVideos: [],
        likedVideos: [],
        watchHistory: [],
      };
    }
  }

  if (tokens.accessToken) user.googleAccessToken = tokens.accessToken;
  if (tokens.refreshToken) user.googleRefreshToken = tokens.refreshToken;
  if (tokens.expiresAt) user.googleTokenExpiresAt = tokens.expiresAt;
  if (tokens.scope) user.googleScope = tokens.scope;
}

export async function getUserOAuthTokens(userId: string): Promise<{
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  scope?: string;
} | null> {
  const normalizedId = (userId || "").toLowerCase().trim();

  if (isPrismaActive()) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userId },
            { email: normalizedId },
          ],
        },
        select: {
          googleAccessToken: true,
          googleRefreshToken: true,
          googleTokenExpiresAt: true,
          googleScope: true,
        },
      });

      if (user && (user.googleAccessToken || user.googleRefreshToken)) {
        return {
          accessToken: user.googleAccessToken || undefined,
          refreshToken: user.googleRefreshToken || undefined,
          expiresAt: user.googleTokenExpiresAt
            ? Number(user.googleTokenExpiresAt)
            : undefined,
          scope: user.googleScope || undefined,
        };
      }
    } catch (err) {
      handlePrismaError("getUserOAuthTokens", err);
    }
  }

  const user = inMemoryUserStore.users.find(
    (u) =>
      u.id === userId ||
      (u.email && u.email.toLowerCase().trim() === normalizedId)
  );
  if (!user) return null;
  return {
    accessToken: user.googleAccessToken,
    refreshToken: user.googleRefreshToken,
    expiresAt: user.googleTokenExpiresAt,
    scope: user.googleScope,
  };
}

export async function registerUser(
  name: string,
  email: string,
  password?: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const normalized = email.toLowerCase().trim();
  const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUser: AppUser = {
    id: newId,
    name: name.trim(),
    email: normalized,
    password: password || "password123",
    image: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      name
    )}`,
  };

  if (isPrismaActive()) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: normalized },
      });

      if (existing) {
        return { success: false, error: "A user with this email already exists." };
      }

      const created = await prisma.user.create({
        data: {
          id: newId,
          name: name.trim(),
          email: normalized,
          password: password || "password123",
          image: newUser.image,
        },
      });

      return {
        success: true,
        user: {
          id: created.id,
          name: created.name || name,
          email: created.email,
        },
      };
    } catch (err: unknown) {
      handlePrismaError("registerUser", err);
    }
  }

  // RAM fallback
  if (
    inMemoryUserStore.users.some(
      (u) => u.email.toLowerCase().trim() === normalized
    )
  ) {
    return { success: false, error: "A user with this email already exists." };
  }

  inMemoryUserStore.users.push(newUser);
  inMemoryUserStore.userContent[newId] = {
    savedVideos: [],
    likedVideos: [],
    watchHistory: [],
  };

  return { success: true, user: newUser };
}

// ---------------------------------------------------------------------------
// Prisma ORM Content Queries (Saved, Liked, History) -> Supabase
// ---------------------------------------------------------------------------

export async function getUserScopedData(userId: string): Promise<UserScopedData> {
  if (isPrismaActive()) {
    try {
      const [saved, liked, history] = await Promise.all([
        prisma.savedVideo.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.likedVideo.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.watchHistory.findMany({
          where: { userId },
          orderBy: { watchedAt: "desc" },
        }),
      ]);

      // Collect video IDs to fetch fresh authoritative metadata directly from YouTube
      const allVideoIds = Array.from(
        new Set([
          ...saved.map((r) => r.videoId),
          ...liked.map((r) => r.videoId),
          ...history.map((r) => r.videoId),
        ])
      );

      let ytFreshMap = new Map<string, YouTubeVideoResource>();
      if (allVideoIds.length > 0) {
        try {
          ytFreshMap = await fetchYouTubeVideosByIds(allVideoIds);
        } catch {
          // Graceful fallback to cached videoData
        }
      }

      const hydrateWithLiveYouTube = (item: YouTubeVideoItem): YouTubeVideoItem => {
        if (!item || !item.id) return item;
        const rawId = item.id.videoId?.split("_p")[0];
        const fresh = rawId ? ytFreshMap.get(rawId) : undefined;
        if (!fresh) return item;

        const durationStr = fresh.contentDetails?.duration
          ? parseIsoDuration(fresh.contentDetails.duration).formatted
          : item.duration;

        const viewsFormatted = fresh.statistics?.viewCount
          ? `${Number(fresh.statistics.viewCount).toLocaleString()} views`
          : item.views;

        return {
          ...item,
          snippet: {
            ...item.snippet,
            title: fresh.snippet?.title || item.snippet.title,
            description: fresh.snippet?.description || item.snippet.description,
            channelTitle: fresh.snippet?.channelTitle || item.snippet.channelTitle,
            thumbnails:
              (fresh.snippet?.thumbnails as unknown as typeof item.snippet.thumbnails) ||
              item.snippet.thumbnails,
          },
          duration: durationStr,
          views: viewsFormatted,
          likeCount: fresh.statistics?.likeCount || item.likeCount,
          likesCountNum: fresh.statistics?.likeCount
            ? parseInt(fresh.statistics.likeCount, 10)
            : item.likesCountNum,
        };
      };

      const savedVideos: YouTubeVideoItem[] = saved.map((row) =>
        hydrateWithLiveYouTube(row.videoData as unknown as YouTubeVideoItem)
      );
      const likedVideos: YouTubeVideoItem[] = liked.map((row) =>
        hydrateWithLiveYouTube(row.videoData as unknown as YouTubeVideoItem)
      );
      const watchHistory: HistoryItem[] = history.map((row) => ({
        video: hydrateWithLiveYouTube(row.videoData as unknown as YouTubeVideoItem),
        watchedAt: row.watchedAt.toISOString(),
      }));

      return { savedVideos, likedVideos, watchHistory };
    } catch (err) {
      handlePrismaError("getUserScopedData", err);
    }
  }

  // RAM fallback
  if (!inMemoryUserStore.userContent[userId]) {
    inMemoryUserStore.userContent[userId] = {
      savedVideos: [],
      likedVideos: [],
      watchHistory: [],
    };
  }
  return inMemoryUserStore.userContent[userId];
}

export async function toggleUserSavedVideo(
  userId: string,
  video: YouTubeVideoItem
): Promise<{ isSaved: boolean; savedVideos: YouTubeVideoItem[] }> {
  const rawId = video.id.videoId.split("_p")[0];

  if (isPrismaActive()) {
    try {
      const existing = await prisma.savedVideo.findUnique({
        where: {
          unique_user_saved_video: {
            userId,
            videoId: rawId,
          },
        },
      });

      let isSaved = false;
      if (existing) {
        await prisma.savedVideo.delete({
          where: { id: existing.id },
        });
        isSaved = false;
      } else {
        await prisma.savedVideo.create({
          data: {
            userId,
            videoId: rawId,
            videoData: video as unknown as Prisma.InputJsonValue,
          },
        });
        isSaved = true;
      }

      const refreshed = await prisma.savedVideo.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const savedVideos = refreshed.map(
        (r) => r.videoData as unknown as YouTubeVideoItem
      );
      return { isSaved, savedVideos };
    } catch (err) {
      handlePrismaError("toggleUserSavedVideo", err);
    }
  }

  // RAM fallback
  const data = inMemoryUserStore.userContent[userId] || {
    savedVideos: [],
    likedVideos: [],
    watchHistory: [],
  };

  const existsIndex = data.savedVideos.findIndex(
    (v) => v.id.videoId.split("_p")[0] === rawId
  );

  let isSaved = false;
  if (existsIndex > -1) {
    data.savedVideos.splice(existsIndex, 1);
    isSaved = false;
  } else {
    data.savedVideos.unshift(video);
    isSaved = true;
  }

  inMemoryUserStore.userContent[userId] = data;
  return { isSaved, savedVideos: data.savedVideos };
}

export async function toggleUserLikedVideo(
  userId: string,
  video: YouTubeVideoItem
): Promise<{ isLiked: boolean; likedVideos: YouTubeVideoItem[] }> {
  const rawId = video.id.videoId.split("_p")[0];

  if (isPrismaActive()) {
    try {
      const existing = await prisma.likedVideo.findUnique({
        where: {
          unique_user_liked_video: {
            userId,
            videoId: rawId,
          },
        },
      });

      let isLiked = false;
      if (existing) {
        await prisma.likedVideo.delete({
          where: { id: existing.id },
        });
        isLiked = false;
      } else {
        await prisma.likedVideo.create({
          data: {
            userId,
            videoId: rawId,
            videoData: video as unknown as Prisma.InputJsonValue,
          },
        });
        isLiked = true;
      }

      const refreshed = await prisma.likedVideo.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      const likedVideos = refreshed.map(
        (r) => r.videoData as unknown as YouTubeVideoItem
      );
      return { isLiked, likedVideos };
    } catch (err) {
      handlePrismaError("toggleUserLikedVideo", err);
    }
  }

  // RAM fallback
  const data = inMemoryUserStore.userContent[userId] || {
    savedVideos: [],
    likedVideos: [],
    watchHistory: [],
  };

  const existsIndex = data.likedVideos.findIndex(
    (v) => v.id.videoId.split("_p")[0] === rawId
  );

  let isLiked = false;
  if (existsIndex > -1) {
    data.likedVideos.splice(existsIndex, 1);
    isLiked = false;
  } else {
    data.likedVideos.unshift(video);
    isLiked = true;
  }

  inMemoryUserStore.userContent[userId] = data;
  return { isLiked, likedVideos: data.likedVideos };
}

export async function addUserWatchHistory(
  userId: string,
  video: YouTubeVideoItem
): Promise<{ watchHistory: HistoryItem[] }> {
  const rawId = video.id.videoId.split("_p")[0];

  if (isPrismaActive()) {
    try {
      await prisma.watchHistory.deleteMany({
        where: {
          userId,
          videoId: rawId,
        },
      });

      await prisma.watchHistory.create({
        data: {
          userId,
          videoId: rawId,
          videoData: video as unknown as Prisma.InputJsonValue,
          watchedAt: new Date(),
        },
      });

      const refreshed = await prisma.watchHistory.findMany({
        where: { userId },
        orderBy: { watchedAt: "desc" },
        take: 50,
      });

      const watchHistory = refreshed.map((r) => ({
        video: r.videoData as unknown as YouTubeVideoItem,
        watchedAt: r.watchedAt.toISOString(),
      }));

      return { watchHistory };
    } catch (err) {
      handlePrismaError("addUserWatchHistory", err);
    }
  }

  // RAM fallback
  const data = inMemoryUserStore.userContent[userId] || {
    savedVideos: [],
    likedVideos: [],
    watchHistory: [],
  };

  data.watchHistory = data.watchHistory.filter(
    (h) => h.video.id.videoId.split("_p")[0] !== rawId
  );

  data.watchHistory.unshift({
    video,
    watchedAt: new Date().toISOString(),
  });

  if (data.watchHistory.length > 50) {
    data.watchHistory = data.watchHistory.slice(0, 50);
  }

  inMemoryUserStore.userContent[userId] = data;
  return { watchHistory: data.watchHistory };
}

export async function clearUserWatchHistory(
  userId: string
): Promise<{ watchHistory: HistoryItem[] }> {
  if (isPrismaActive()) {
    try {
      await prisma.watchHistory.deleteMany({
        where: { userId },
      });
      return { watchHistory: [] };
    } catch (err) {
      handlePrismaError("clearUserWatchHistory", err);
    }
  }

  // RAM fallback
  if (inMemoryUserStore.userContent[userId]) {
    inMemoryUserStore.userContent[userId].watchHistory = [];
  }
  return { watchHistory: [] };
}
