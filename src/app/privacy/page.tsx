import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import AnimatedStudioBackdrop from "@/components/ui/AnimatedStudioBackdrop";
import { ArrowLeft, ShieldCheck, Lock, Database, KeyRound, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | YT Drive",
  description:
    "Privacy Policy and Google API Services User Data disclosure for YT Drive.",
};

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@ytdrive.app";

export default function PrivacyPolicyPage() {
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
            href="/terms"
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
          >
            Terms of Service
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Google API Services User Data Policy Compliant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Privacy Policy for YT Drive
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] font-mono">
              Last updated: November 27, 2026
            </p>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              YT Drive (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the application&rdquo;) is a personal YouTube cloud vault that helps authenticated users upload, organize, and manage videos on their own YouTube channel. This Privacy Policy explains what information we access, how we use and store it, and how you can control or delete your data.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />
              <span>1. Information We Access via Google OAuth</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              When you choose &ldquo;Continue with Google&rdquo;, YT Drive requests only the permissions required to operate your personal YouTube Drive workspace:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              <li>
                <strong className="text-[var(--text-primary)]">Profile &amp; Identity (<code>openid</code>, <code>email</code>, <code>profile</code>):</strong>{" "}
                Used to identify your account, display your name, email address, and avatar in the workspace header, and isolate your personal folders and drive metadata from other users.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">YouTube Read Access (<code>youtube.readonly</code>):</strong>{" "}
                Used to verify whether your Google account has an active YouTube channel and to list and sync videos from your channel&apos;s uploads playlist into your YT Drive workspace.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">YouTube Upload Access (<code>youtube.upload</code>):</strong>{" "}
                Used to stream video files in resumable chunks directly to your YouTube channel when you upload a video through YT Drive.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">YouTube Management Access (<code>youtube</code>):</strong>{" "}
                Used strictly when you initiate actions in YT Drive to rename video titles, edit descriptions/tags, update privacy visibility (<code>Private</code>, <code>Unlisted</code>, or <code>Public</code>), or permanently delete a video you uploaded.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Database className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />
              <span>2. How We Store and Process Your Data</span>
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              <li>
                <strong className="text-[var(--text-primary)]">No server-side video file storage:</strong>{" "}
                Uploaded video files are streamed in chunks directly from your browser through our API route to Google&apos;s YouTube resumable upload servers. Video binaries are never stored on our server disk or database.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Workspace metadata &amp; OAuth tokens:</strong>{" "}
                We store your account profile (name, email, avatar URL), folder organization, video references (YouTube video ID, title, tags, folder assignment, starred/trashed state), and OAuth access/refresh tokens in our PostgreSQL database so your session stays synced without repeated login prompts.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Privacy-enhanced playback:</strong>{" "}
                Videos played inside the Cinema Player modal are embedded using <code>youtube-nocookie.com</code>.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />
              <span>3. Google API Services User Data Policy (Limited Use)</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              YT Drive&apos;s use and transfer to any other app of information received from Google APIs adheres strictly to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-brand)] underline underline-offset-2 hover:opacity-85"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              <li>We only use Google and YouTube user data to provide and improve user-facing YT Drive features visible in the interface.</li>
              <li>We do <strong>not</strong> sell your personal data or Google user data to third parties.</li>
              <li>We do <strong>not</strong> use Google user data for serving advertisements, profiling, or training AI/ML models.</li>
              <li>We do <strong>not</strong> transfer Google user data to third parties except as necessary to communicate with Google/YouTube APIs, operate our database hosting infrastructure, or comply with applicable law.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-[var(--accent-brand)]" aria-hidden="true" />
              <span>4. Revoking Access &amp; Data Deletion</span>
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              You remain in full control of your Google account and YouTube videos at all times:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[var(--text-secondary)] leading-relaxed">
              <li>
                You can revoke YT Drive&apos;s access to your Google account at any time from your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-brand)] underline underline-offset-2 hover:opacity-85"
                >
                  Google Account Permissions
                </a>{" "}
                page.
              </li>
              <li>
                You can delete folders, remove imported video links, or permanently delete videos directly within YT Drive or YouTube Studio.
              </li>
              <li>
                To request complete deletion of your stored YT Drive profile, folder structure, and OAuth token records from our database, contact us at{" "}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[var(--accent-brand)] underline underline-offset-2 hover:opacity-85"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </li>
            </ul>
          </section>

          <section className="space-y-2 pt-4 border-t border-[var(--border-hairline)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              5. Contact &amp; Related Policies
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              For privacy questions or data deletion requests, contact{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[var(--accent-brand)] underline underline-offset-2 hover:opacity-85"
              >
                {CONTACT_EMAIL}
              </a>
              . Please also review our{" "}
              <Link
                href="/terms"
                className="text-[var(--accent-brand)] underline underline-offset-2 hover:opacity-85"
              >
                Terms of Service
              </Link>{" "}
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
        </article>
      </main>

      <footer className="relative z-10 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]/70 backdrop-blur-md py-6 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <span>YT Drive • Personal YouTube Cloud Vault</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[var(--text-primary)] font-medium">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
