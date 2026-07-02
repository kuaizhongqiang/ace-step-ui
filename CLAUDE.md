# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite frontend dev server on port 3000 |
| `npm run build` | Build frontend for production (`dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run start` | Start both backend + frontend (server on 3001, Vite on 3000) |
| `cd server && npx tsx src/index.ts` | Start backend server (port 3001) |
| `cd server && npx tsx watch src/index.ts` | Start backend with hot reload |
| `npx tsc --noEmit` | Type-check frontend (uses tsconfig.json) |
| `cd server && npx tsc --noEmit` | Type-check backend (uses server/tsconfig.json) |
| `cd server && npx tsx src/db/migrate.ts` | Run database migrations manually |

CI (`.github/workflows/ci.yml`) runs type-check + build for both frontend and server on push/PR to `main`.

## Project Architecture

### Tech Stack
- **Frontend**: React 19, TypeScript, TailwindCSS 3 (build-time via PostCSS), Vite 6, lucide-react icons
- **Backend**: Express 4 with TypeScript (run via `tsx`), better-sqlite3 (SQLite), JWT auth (jsonwebtoken)
- **AI Engine**: ACE-Step 1.5 Gradio API (port 8001, externally managed)
- **All CSS/fonts are self-hosted** — no Google Fonts, no CDN Tailwind, no external image services

### Key Architectural Points

**No React Router.** Navigation uses `window.location.pathname` + `popstate` events. Views: `'create' | 'library' | 'training' | 'profile' | 'song' | 'playlist' | 'search' | 'news'`. Routes are handled directly in `App.tsx` with `pushState`.

**State management** uses three React Contexts:
- `AuthContext` (`context/AuthContext.tsx`) — user/token from auto-login (JWT stored in localStorage), wraps entire app in `index.tsx`
- `ResponsiveContext` (`context/ResponsiveContext.tsx`) — mobile/desktop breakpoint at 768px, wraps entire app in `index.tsx`
- `I18nContext` (`context/I18nContext.tsx`) — i18n with en/zh/ja/ko languages

All other state (songs, playlists, player, modals, generation jobs) lives in `App.tsx` via `useState` hooks (~130 state variables). `App.tsx` is effectively the state hub; it passes callbacks down to every child component.

**Key data types** are defined in [types.ts](types.ts): `Song`, `Playlist`, `GenerationParams`, `User`, `View`, `Comment`.

### Frontend Component Structure

```
App.tsx              ← State hub + layout orchestrator
├── Sidebar          ← Navigation + theme toggle + settings
├── CreatePanel      ← Generation form (simple + custom mode)
├── SongList         ← Main song listing (with inline playback controls)
├── RightSidebar     ← Song details panel (metadata, actions)
├── Player           ← Bottom music player (waveform, controls)
├── LibraryView      ← Library tab, playlists, liked songs, reference tracks
├── SearchPage       ← Search songs/creators/playlists
├── SongProfile      ← Single song detail page
├── UserProfile      ← User profile page with public songs
├── PlaylistDetail   ← Playlist contents viewer
├── TrainingPanel    ← LoRA training interface (dataset building, training)
├── NewsPage         ← News/changelog feed
└── [Modals]         ← VideoGeneratorModal, SettingsModal, UsernameModal,
                        PlaylistModals, ShareModal, EditProfileModal, ConfirmDialog, Toast
```

### Frontend Context Setup

```
index.tsx → AuthProvider → ResponsiveProvider → App (which wraps AppContent in I18nProvider)
```

### Backend Structure (`server/src/`)

```
src/
  config/index.ts       ← Env-based configuration (port, DB path, ACE-Step URL, storage)
  db/
    pool.ts             ← SQLite wrapper (better-sqlite3) with auto-migration on import
    sqlite.ts           ← Helpers: UUID generation, JSON serialization, transaction, batch insert
    migrate.ts          ← Schema definitions (users, songs, generation_jobs, playlists, etc.)
  middleware/auth.ts    ← JWT auth middleware (authMiddleware, optionalAuthMiddleware, adminMiddleware)
  routes/
    auth.ts             ← User auto-login, setup, username update, logout
    songs.ts            ← CRUD songs, likes, comments, privacy, social sharing
    generate.ts         ← Generation orchestration, audio upload, status polling, model switching, format endpoint
    users.ts            ← Profile, avatars, banners, follow/unfollow, followers
    playlists.ts        ← CRUD playlists, add/remove songs
    training.ts         ← LoRA dataset building, preprocessing, training jobs
    lora.ts             ← LoRA model loading/unloading/scaling via Gradio
    referenceTrack.ts   ← Uploaded reference audio management
    contact.ts          ← Contact form submissions
  services/
    acestep.ts          ← Core generation logic: Gradio API client + Python spawn fallback
    gradio-client.ts    ← Lazy-initialized @gradio/client connection (singleton per process)
    generationQueue.ts  ← Local queue with priority (free/pro/unlimited tiers)
    cleanup.ts          ← Scheduled cleanup of orphaned songs (daily via node-cron at 3 AM)
    storage/
      index.ts           ← Storage provider interface
      local.ts           ← Local filesystem storage (audio files in server/public/audio/)
      factory.ts         ← Provider factory (currently only 'local')
  index.ts             ← Express server entry (helmet, CORS, routes, schedule cleanup)
```

### Database Schema (SQLite, auto-migrated on startup)

Main tables: `users`, `songs`, `generation_jobs`, `playlists`, `playlist_songs`, `liked_songs`, `comments`, `followers`, `reference_tracks`, `contact_submissions`. All use UUID primary keys. Schema is defined in `server/src/db/migrate.ts` and runs on every backend start.

### Generation Pipeline

1. Frontend POSTs to `/api/generate` with `GenerationParams`
2. Server creates a `generation_jobs` record in SQLite
3. `acestep.ts` adds job to local in-memory queue, then calls ACE-Step Gradio API via `@gradio/client`
4. Frontend polls `/api/generate/status/:jobId` every 2 seconds
5. On success, server downloads audio files via `LocalStorageProvider`, inserts `songs` row
6. Failed/timed-out jobs are cleaned up after 10 minutes (or 10-minute timeout per job)

### API Layer

All frontend API calls go through `services/api.ts` using a generic `api<T>()` wrapper that handles auth headers, JSON serialization, and error extraction. API modules: `authApi`, `songsApi`, `generateApi`, `usersApi`, `playlistsApi`, `searchApi`, `contactApi`, `trainingApi`.

The Vite dev server proxies `/api`, `/audio`, `/editor`, `/demucs-web` to backend port 3001 (configured in `vite.config.ts`).

### Configuration

Edit `server/.env` (copy from `server/.env.example`):
- `PORT` — backend port (default 3001)
- `ACESTEP_API_URL` — Gradio API URL (default http://localhost:8001)
- `DATABASE_PATH` — SQLite database path
- `AUDIO_DIR` — Local audio storage path
- `JWT_SECRET` — JWT signing key
- `FRONTEND_URL` — CORS allow origin

Root `.env.example` also has a `PEXELS_API_KEY` (currently unused since the Pexels proxy was removed).

### Security Notes

- The project has intentionally removed all external API integrations (Gemini, Pexels, picsum.photos, dicebear, Google Fonts, etc.) for privacy and offline operation.
- CSP headers are set by `helmet` in the Express server.
- Audio editor and Demucs stem extraction have relaxed CSP for WASM/shared memory (SAB).
- All authentication is local JWT with no external OAuth.
- Database uses SQLite with WAL mode; no connection pooling needed.

### External Tools Bundled

- `audiomass-editor/` (and `server/audio-editor/`) — AudioMass web audio editor (vanilla JS)
- `server/public/demucs-web/` — Demucs stem extraction (ONNX + WASM in browser)
- `server/scripts/` — Python scripts for generation fallback (`simple_generate.py`, `format_sample.py`, `preprocess_dataset.py`, `get_limits.py`)
