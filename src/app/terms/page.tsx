import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import AnimatedStudioBackdrop from "@/components/ui/AnimatedStudioBackdrop";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | YT Drive",
  description:
    "Terms of Service and YouTube API Services compliance notice for YT Drive.",
};

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@ytdrive.app";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen w-full bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col relative overflow-x-clip">
      <AnimatedStudioBackdrop variant="hero" />

      <header className="h-15 w-full border-b border-[var(--border-hairline)] bg-[var(--bg-surface)]/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-brand)]"
          >
            <Logo size="md" />
          </Link>
        </div>

        <nav aria-label="Legal navigation" className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/privacy"
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Privacy Policy
          </Link>
          <ThemeToggle />
          <Link
            href="/"
            className="h-9 px-3.5 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--bg-subtle)] border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to App</span>
          </Link>
        </nav>
      </header>

      <main className="flex-1 relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14">
        <article className="rounded-3xl bg-[var(--bg-surface)]/90 backdrop-blur-xl border border-[var(--border-hairline)] shadow-xl p-6 sm:p-10 space-y-8">
          <div className="space-y-3 border-b border-[var(--border-hairline)] pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-muted)] border border-[var(--border-hairline)] text-[var(--text-secondary)] text-xs font-medium">
              <FileText className="w-3.5 h-3.5 text-[var(--accent-brand)]" aria-hidden="true" />
              <span>Service Terms &amp; YouTube API Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Terms of Service for YT Drive
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-mono">
              Last updated: November 27, 2026
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              By accessing or using YT Drive, you agree to these Terms of Service. If you do not agree, please do not sign in or use the application.
            </p>
          </div>

          <section className="space-y-2.5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              1. YouTube Terms of Service &amp; Google Policies
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              YT Drive uses YouTube API Services to upload, organize, and manage videos on your YouTube channel. By using YT Drive, you agree to be bound by the{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-brand)] underline underline-offset-2 hover:opacity-85"
              >
                YouTube Terms of Service
              </a>{" "}
              and the{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-brand)] underline underline-offset-2 hover:opacity-85"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              2. Account Requirements &amp; User Content
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              <li>
                To upload or sync videos, you must sign in with a valid Google account that has an active YouTube channel.
              </li>
              <li>
                You retain full ownership of the videos you upload or organize. You are solely responsible for ensuring that your content complies with copyright law, YouTube Community Guidelines, and all applicable laws.
              </li>
              <li>
                You are responsible for choosing the visibility level (<code>Private</code>, <code>Unlisted</code>, or <code>Public</code>) of each video you upload or modify through YT Drive.
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              3. Acceptable Use &amp; API Quotas
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              You agree not to abuse, automate excessive requests against, or attempt to bypass security, authentication, or YouTube API quota limits in YT Drive. Because uploads and channel synchronization rely on YouTube Data API v3 quotas, daily upload or API availability may be temporarily limited by Google or YouTube service limits.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              4. Service Availability &amp; Disclaimer
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              YT Drive is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind. We do not guarantee uninterrupted access or permanent retention of workspace metadata, and we recommend keeping independent backups of important original media files.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              5. Termination &amp; Contact
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              You may stop using YT Drive at any time by signing out and revoking access in your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-brand)] underline underline-offset-2 hover:opacity-85"
              >
                Google Account Permissions
              </a>
              . Questions about these terms can be sent to{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[var(--accent-brand)] underline underline-offset-2 hover:opacity-85"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </article>
      </main>

      <footer className="relative z-10 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]/70 backdrop-blur-md py-6 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <span>YT Drive • Personal YouTube Cloud Vault</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[var(--text-primary)] font-medium">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
