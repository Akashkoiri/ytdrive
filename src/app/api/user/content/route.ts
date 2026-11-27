import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getUserScopedData,
  toggleUserSavedVideo,
  toggleUserLikedVideo,
  addUserWatchHistory,
  clearUserWatchHistory,
} from "@/data/userStore";
import { YouTubeVideoItem } from "@/data/mockVideos";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({
      authenticated: false,
      userId: null,
      user: null,
      savedVideos: [],
      likedVideos: [],
      watchHistory: [],
    });
  }

  const userId = session.user.id;
  const data = await getUserScopedData(userId);

  return NextResponse.json({
    authenticated: true,
    userId,
    user: session.user,
    savedVideos: data.savedVideos,
    likedVideos: data.likedVideos,
    watchHistory: data.watchHistory,
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required to modify your user library." },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    const body = await request.json();
    const { action, video } = body as {
      action: "toggle_save" | "toggle_like" | "add_history" | "clear_history";
      video?: YouTubeVideoItem;
    };

    if (action === "toggle_save" && video) {
      const result = await toggleUserSavedVideo(userId, video);
      return NextResponse.json({
        success: true,
        action,
        isSaved: result.isSaved,
        savedVideos: result.savedVideos,
      });
    }

    if (action === "toggle_like" && video) {
      const result = await toggleUserLikedVideo(userId, video);
      return NextResponse.json({
        success: true,
        action,
        isLiked: result.isLiked,
        likedVideos: result.likedVideos,
      });
    }

    if (action === "add_history" && video) {
      const result = await addUserWatchHistory(userId, video);
      return NextResponse.json({
        success: true,
        action,
        watchHistory: result.watchHistory,
      });
    }

    if (action === "clear_history") {
      const result = await clearUserWatchHistory(userId);
      return NextResponse.json({
        success: true,
        action,
        watchHistory: result.watchHistory,
      });
    }

    return NextResponse.json(
      { error: "Invalid action or missing video payload." },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("Error processing user content modification:", err);
    return NextResponse.json(
      { error: "Failed to update content." },
      { status: 500 }
    );
  }
}
