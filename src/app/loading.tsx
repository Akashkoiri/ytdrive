import { StudioSpinner } from "@/components/ui/Loaders";

export default function Loading() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="flex flex-col items-center gap-3">
        <StudioSpinner size={28} thickness={2.5} label="Loading YT Drive" />
        <span className="text-xs font-mono text-[var(--text-muted)]">
          Loading YT Drive...
        </span>
      </div>
    </div>
  );
}
