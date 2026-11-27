import { auth } from "@/auth";
import { getUnifiedUserDrive } from "@/lib/driveServer";
import DriveMain from "@/components/drive/DriveMain";
import { StudioSpinner } from "@/components/ui/Loaders";
import { Suspense } from "react";
import { DriveTab } from "@/context/DriveContext";

interface PageProps {
  searchParams: Promise<{ view?: string; folderId?: string }>;
}

async function DriveServerContent({ searchParams }: PageProps) {
  const { view, folderId } = await searchParams;
  const session = await auth();
  const sessionRecord = session as unknown as Record<string, unknown> | null;
  const hasYouTubeAccess = Boolean(sessionRecord?.hasYouTubeAccess);
  const isAuthenticated = Boolean(session?.user);

  const initialData =
    isAuthenticated && hasYouTubeAccess
      ? await getUnifiedUserDrive(session?.user?.id, session)
      : {
          userId: session?.user?.id || "guest",
          files: [],
          folders: [],
          stats: null,
          source: "local_cache",
          hasYouTubeChannel: true,
        };

  return (
    <DriveMain
      initialData={initialData}
      initialTab={(view as DriveTab) || "my-drive"}
      initialFolderId={folderId || null}
      initialAuth={{
        isAuthenticated,
        hasYouTubeAccess,
        userEmail: session?.user?.email ?? null,
      }}
    />
  );
}

export default function Home({ searchParams }: PageProps) {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Suspense
        fallback={
          <div className="w-full min-h-screen flex items-center justify-center bg-[var(--bg-canvas)]">
            <div className="flex flex-col items-center gap-3">
              <StudioSpinner size={28} thickness={2.5} label="Loading YT Drive" />
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Loading YT Drive...
              </span>
            </div>
          </div>
        }
      >
        <DriveServerContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
