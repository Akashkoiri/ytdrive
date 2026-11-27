"use client";

import { useState, useId } from "react";
import { signIn, signOut } from "next-auth/react";
import { X, ShieldCheck } from "lucide-react";
import { useAuthContent } from "@/context/AuthContentContext";
import Logo from "@/components/Logo";
import ModalDialog from "@/components/ui/ModalDialog";
import { StudioSpinner } from "@/components/ui/Loaders";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, isAuthenticated } =
    useAuthContent();

  const [isLoading, setIsLoading] = useState(false);
  const titleId = useId();

  const isOpen = isAuthModalOpen && !isAuthenticated;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
    } catch {
      // Continue even if signOut fails
    }
    const callbackUrl =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/";
    await signIn("google", { callbackUrl });
  };

  return (
    <ModalDialog
      open={isOpen}
      onClose={closeAuthModal}
      ariaLabelledBy={titleId}
      className="max-w-md"
    >
      <div className="relative w-full bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[var(--text-primary)] select-none">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-muted)] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo showText={false} size="lg" />
          <h1
            id={titleId}
            className="mt-4 text-lg font-semibold text-[var(--text-primary)] tracking-tight"
          >
            Connect your Google account
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed max-w-xs">
            Sign in with Google and allow YouTube permissions to upload videos directly to your YouTube vault.
          </p>
        </div>

        <div className="mb-5 p-3.5 rounded-2xl bg-[var(--bg-muted)]/70 border border-[var(--border-hairline)] flex items-start gap-2.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            Uploaded videos are stored directly in your connected YouTube channel with your chosen visibility (Unlisted, Private, or Public).
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          autoFocus
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-xl bg-[var(--accent-cta-bg)] hover:opacity-90 text-xs font-semibold text-[var(--accent-cta-fg)] transition-opacity cursor-pointer disabled:opacity-60 shadow-sm"
        >
          {isLoading ? (
            <>
              <StudioSpinner
                size={16}
                thickness={2}
                label="Connecting to Google"
                color="currentColor"
                trackColor="color-mix(in srgb, currentColor 25%, transparent)"
              />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </div>
    </ModalDialog>
  );
}
