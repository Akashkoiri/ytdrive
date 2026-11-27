# YT Drive

**YT Drive** is a personal YouTube Cloud Vault built with Next.js that turns your YouTube channel into an organized, drive-style video workspace. Upload videos directly to YouTube using chunked resumable streaming, organize clips into color-coded folders, manage visibility (`unlisted`, `private`, `public`), import existing YouTube links, and stream in a distraction-free cinema player.

---

## Features

- **Direct Resumable YouTube Uploads**
  - Streams video chunks (5 MB chunks aligned to YouTube's 256 KB requirement) directly from the client through `/api/drive/upload/chunk` to the YouTube Data API v3 without writing video files to server disk.
  - Supports workspace drag-and-drop uploads, automatic client-side duration/resolution extraction, and a live upload dock showing progress, transfer speed, and ETA.
- **Live YouTube Channel Sync**
  - Connects via Google OAuth (`youtube.upload`, `youtube.readonly`, `youtube` scopes) and syncs your channel's uploads with a 60-second in-memory cache to stay within YouTube API quota limits.
  - Automatically refreshes expired Google OAuth access tokens via stored refresh tokens.
- **Import from YouTube URL**
  - Save any YouTube video (`watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, or raw 11-character video ID) into a folder with optional metadata enrichment via `NEXT_YOUTUBE_API_KEY`.
- **Drive-Style File & Folder Management**
  - Create, rename, and delete color-coded folders (`blue`, `emerald`, `amber`, `purple`, `rose`, `zinc`).
  - Star favorites, move files between folders, rename videos (syncing titles back to YouTube), update YouTube privacy status (`unlisted`, `private`, `public`), trash/restore files, or permanently delete them from both Drive and YouTube.
- **Workspace Views, Search & Cinema Player**
  - Switch between **Grid** and **Table** views across **My Drive**, **Recent**, **Starred**, **Shared**, and **Trash** tabs.
  - Search (press `/` to focus), sort by date/name/size/duration, and filter by privacy status.
  - Inspect file metadata in the side Inspector panel and watch videos in a full-screen Cinema Player modal (`youtube-nocookie.com`).
  - Built-in Light, Dark, and System theme toggle.
- **PostgreSQL Persistence with In-Memory Fallback**
  - Stores drive metadata, folders, user profiles, and OAuth tokens in PostgreSQL (Supabase-ready) via Prisma, with a volatile in-memory fallback if the database is unreachable.

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (`16.4.6`, App Router, React Compiler, Cache Components, Turbopack)
- **UI:** [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/turbopack`), [Lucide Icons](https://lucide.dev/)
- **Authentication:** [Auth.js / NextAuth v5](https://authjs.dev/) (`next-auth@5.0.0-beta.32`) with Google OAuth & Credentials providers
- **Database & ORM:** PostgreSQL with [Prisma 7](https://www.prisma.io/) (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **HTTP Client:** `axios` and native `fetch`

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **PostgreSQL** database (e.g., [Supabase](https://supabase.com/) or local PostgreSQL)
- **Google Cloud Project** with the **YouTube Data API v3** enabled and OAuth 2.0 Web Application credentials

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# NextAuth / Auth.js
AUTH_SECRET="your-random-32-byte-secret"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"

# PostgreSQL / Supabase Connection Strings
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# Optional: YouTube Data API v3 key for metadata lookup when importing public/unlisted URLs
NEXT_YOUTUBE_API_KEY="your-youtube-api-key"
```

#### Environment Variables Reference

| Variable | Required | Description |
| --- | --- | --- |
| `AUTH_SECRET` | Yes (prod) | Secret used by Auth.js to sign/encrypt JWTs and cookies. |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth 2.0 Client ID. Enables Google sign-in and YouTube integration. |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth 2.0 Client Secret. |
| `DATABASE_URL` | Recommended | PostgreSQL connection URL used by Prisma at runtime (`@prisma/adapter-pg`). Falls back to in-memory RAM if unset or unreachable. |
| `DIRECT_URL` | Recommended | Direct PostgreSQL URL used by `prisma.config.ts` for schema push/migrations. |
| `NEXT_YOUTUBE_API_KEY` | Optional | Public YouTube Data API v3 key used to fetch title, duration, description, tags, and thumbnails when importing videos by URL. |

#### Google Cloud OAuth Setup

1. In the [Google Cloud Console](https://console.cloud.google.com/), enable **YouTube Data API v3**.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Add your authorized redirect URIs:
   - Local development: `http://localhost:3000/api/auth/callback/google`
   - Production (Vercel): `https://your-domain.vercel.app/api/auth/callback/google`
4. Configure the **OAuth consent screen** with the following scopes:
   - `openid`, `email`, `profile`
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
   - `https://www.googleapis.com/auth/youtube`
5. For **Publishing to Public (Google Cloud Verification)**:
   - **App Name:** `YT Drive`
   - **Application home page:** `https://your-domain.vercel.app`
   - **Application privacy policy link:** `https://your-domain.vercel.app/privacy`
   - **Application terms of service link:** `https://your-domain.vercel.app/terms`
   - **Authorized domains:** Add your custom domain (if using one; `.vercel.app` may require a custom domain for Google OAuth verification).
   - **Vercel Deployment Protection:** Keep **Vercel Authentication** disabled for **Production** so public users and Google verification crawlers can access `/`, `/privacy`, and `/terms`.
   - **Database:** Run `npx prisma db push` against your production database so `youtube_upload_sessions` and all Drive tables exist across serverless invocations.

> **Note:** The connected Google account must have an active YouTube channel (`youtube.com/create_channel`) to upload videos directly to YouTube.

### 3. Set Up the Database

Generate the Prisma client and push the schema to your PostgreSQL database:

```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the application for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint across the repository |

---

## Project Structure

```text
├── prisma/
│   └── schema.prisma              # PostgreSQL schema (profiles, drive files/folders, user content)
├── prisma.config.ts               # Prisma CLI datasource configuration
├── next.config.ts                 # Next.js config (React Compiler, remote image patterns, Turbopack)
└── src/
    ├── auth.ts                    # NextAuth v5 config, Google OAuth scopes, token refresh callbacks
    ├── app/
    │   ├── page.tsx               # Main server entry loading unified Drive data
    │   ├── layout.tsx             # Root layout, fonts, theme bootstrap, Providers
    │   ├── actions/
    │   │   └── driveActions.ts    # Server Actions (folders, rename, star, privacy, move, trash, delete)
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts
    │       ├── drive/upload/chunk/route.ts    # Resumable YouTube chunk upload endpoint
    │       ├── drive/import-youtube/route.ts  # Import video metadata from YouTube URL/ID
    │       └── user/content/route.ts          # User saved/liked/watch history endpoints
    ├── components/
    │   ├── drive/                 # Drive UI (Header, Sidebar, Grid/Table views, Inspector, CinemaPlayer, Modals)
    │   └── ui/                    # Shared UI primitives (ModalDialog, Loaders, SmartThumbnail, Backdrop)
    ├── context/                   # DriveContext, AuthContentContext, ThemeContext
    ├── data/                      # Prisma + RAM-fallback stores (driveStore, userStore)
    ├── lib/                       # Prisma client, driveServer resolver, YouTube sync & upload services
    ├── types/                     # TypeScript interfaces and storage quota helpers
    └── utils/                     # Formatting helpers
```

---

## Architecture Notes

### API Endpoints & Server Actions

- **`POST /api/drive/upload/chunk`** — Handles `"init"`, `"abort"`, and `multipart/form-data` chunk uploads, streaming binary chunks straight to Google's resumable upload endpoint.
- **`GET /api/drive/upload/chunk`** — Reports YouTube upload readiness and verifies whether the connected Google account has an active YouTube channel.
- **`POST /api/drive/import-youtube`** — Parses a YouTube URL or ID, fetches optional metadata via `NEXT_YOUTUBE_API_KEY`, and registers the video in the user's Drive.
- **`GET / POST /api/user/content`** — Reads and updates user-scoped saved videos, liked videos, and watch history.
- **`src/app/actions/driveActions.ts`** — Server Actions for folder CRUD, starring, renaming, moving, privacy updates, trashing, restoring, and permanent deletion.

### Database Models (`prisma/schema.prisma`)

- `User` (`profiles`) — User accounts and persisted Google OAuth access/refresh tokens.
- `DriveFile` (`drive_files`) — Video file entries, YouTube IDs, folder references, privacy, tags, and trash state.
- `DriveFolder` (`drive_folders`) — User folders with color labels and hierarchy support.
- `UserDrivesJson` (`user_drives_json`) — JSON snapshot storage for user drive state.
- `SavedVideo`, `LikedVideo`, `WatchHistory` — User library and playback history tables.
