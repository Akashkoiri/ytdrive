import { Play } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Logo({
  className = "",
  showText = true,
  size = "md",
}: LogoProps) {
  const boxSizes = {
    sm: "w-7 h-7 rounded-lg",
    md: "w-8 h-8 rounded-xl",
    lg: "w-10 h-10 rounded-xl",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      title="YT Drive"
    >
      <div
        className={`${boxSizes[size]} bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-sm shadow-rose-500/25 ring-1 ring-white/15 shrink-0`}
      >
        <Play
          className={`${iconSizes[size]} text-white fill-white ml-0.5`}
          aria-hidden="true"
        />
      </div>

      {showText && (
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-semibold ${textSizes[size]} tracking-tight text-[var(--text-primary)]`}
          >
            YT Drive
          </span>
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-hairline)]">
            Vault
          </span>
        </div>
      )}
    </div>
  );
}
