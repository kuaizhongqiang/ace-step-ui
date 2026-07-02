# CODEBUDDY.md

This file provides guidance to CodeBuddy when working with code in this repository.

## Build & Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server (Vite, port 3000) |
| `npm run build` | Build frontend for production (outputs `dist/`) |
| `npm run preview` | Preview production build locally |
| `cd server && npx tsx src/index.ts` | Start backend server (port 3001) |
| `npx tsc --noEmit` | Type-check frontend |
| `cd server && npx tsc --noEmit` | Type-check backend |

## Project Architecture

### Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS 3 (build-time via PostCSS), Vite 6, lucide-react
- **Backend**: Express 4, TypeScript (tsx), better-sqlite3 (SQLite), JWT auth
- **AI Engine**: ACE-Step 1.5 (Gradio API on port 8001 — externally managed via Tailscale)
- **Plan**: Text-to-text LLM will use DeepSeek V4 Flash API; text-to-audio uses local ACE-Step DiT model
- **All frontend CSS/fonts are self-hosted** — no Google Fonts, no CDN Tailwind, no esm.sh import maps

### Key Architectural Points

**No React Router.** Navigation uses `window.location.pathname` + `popstate` events. Views: `create`, `library`, `training`, `profile`, `song`, `playlist`, `search`, `news`.

**State management** uses React Context: `AuthContext` (user/token), `ResponsiveContext` (768px breakpoint), `I18nContext` (en/zh/ja/ko). All other state lives locally in `App.tsx` via useState.

**Backend** runs on port 3001. The Vite dev server proxies `/api`, `/audio`, `/editor`, `/demucs-web` to it. JWT tokens for auth. Database migrations auto-run on startup (`server/src/db/migrate.ts`).

**Generation pipeline**: Frontend POSTs to `/api/generate` → `generationQueue.ts` schedules → `acestep.ts` calls Gradio API → Frontend polls `/api/generate/status/:jobId` every 2s.

### Security Policy

**All external communication paths have been removed or disabled.** The project only communicates with:
- Local ACE-Step Gradio API (port 8001) via Tailscale
- Planned: DeepSeek API for text-to-text LLM (to be implemented)

Removed paths: Google Gemini (`services/geminiService.ts` deleted), Pexels API proxy, oEmbed endpoint, image proxy SSRF, Google OAuth types, picsum.photos, dicebear.com, Google Fonts CDN, Tailwind CDN, esm.sh import maps. All replaced with local/self-hosted alternatives.

## API Layer

All frontend API calls go through `services/api.ts` (`api<T>()` wrapper). API modules: `authApi`, `songsApi`, `generateApi`, `usersApi`, `playlistsApi`, `searchApi`, `contactApi`, `trainingApi`. Backend routes in `server/src/routes/`: `auth.ts`, `songs.ts`, `generate.ts`, `users.ts`, `playlists.ts`, `training.ts`, `lora.ts`, `referenceTrack.ts`, `contact.ts`.

## Configuration

Edit `server/.env`: `PORT` (3001), `ACESTEP_API_URL` (http://100.x.x.1:8001 via Tailscale), `DATABASE_PATH`, `JWT_SECRET`.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): runs on push/PR to `main` — type-check + build for both frontend and server
- **Release** (`.github/workflows/release.yml`): triggers on `v*` tags — builds, generates changelog via git-cliff, publishes GitHub Release
