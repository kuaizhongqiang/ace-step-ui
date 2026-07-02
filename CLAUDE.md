# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend dev server (Vite, port 3000) |
| `npm run build` | Build frontend for production (`dist/`) |
| `npm run start` | Production start via `bin/cli.js` |
| `npm run dev:start` | Dev start: backend + Vite |
| `cd server && npx tsx src/index.ts` | Backend server (port 3001) |
| `cd server && npx tsx watch src/index.ts` | Backend with hot reload |
| `npx tsc --noEmit` | Frontend type-check |
| `cd server && npx tsc --noEmit` | Backend type-check |
| `cd server && npx tsx src/db/migrate.ts` | Run DB migrations manually |

## Key Context

- **Fork** of [fspecii/ace-step-ui](https://github.com/fspecii/ace-step-ui). Origin: `kuaizhongqiang`, upstream: `fspecii`.
- **Default branch**: `main`. No direct pushes — all changes via **branch → PR → CI → merge**.
- **CI**: commitlint (PR title) + frontend tsc+Build + server tsc. See `.github/workflows/ci.yml`.

## Architecture

### Frontend

```
index.tsx → AuthProvider → ResponsiveProvider → App
                                                └─ I18nProvider wraps AppContent
```

**No React Router.** Navigation uses `window.location.pathname` + `popstate`. Views: `create | library | training | profile | song | playlist | search | news`. All routing in `App.tsx`.

**State**: 3 React Contexts (`AuthContext`, `ResponsiveContext`, `I18nContext`). Everything else in `App.tsx` via ~130 `useState` hooks — it's the state hub, passing callbacks to children.

**Key types** in [types.ts](types.ts): `Song`, `Playlist`, `GenerationParams`, `User`, `View`.

**API layer** in `services/api.ts`: generic `api<T>()` wrapper. Modules: `authApi`, `songsApi`, `generateApi`, `usersApi`, `playlistsApi`, `searchApi`, `contactApi`, `trainingApi`. Vite proxies `/api`, `/audio`, `/editor`, `/demucs-web` to backend.

### Backend (`server/src/`)

```
config/     ← env-based config (port, DB, ACE-Step URL)
db/         ← pool.ts (better-sqlite3), sqlite.ts (helpers), migrate.ts (schema)
middleware/ ← JWT auth middleware
routes/     ← auth, songs, generate, users, playlists, training, lora, referenceTrack, contact
services/   ← acestep.ts (Gradio API + Python spawn), gradio-client.ts, generationQueue.ts, cleanup.ts
index.ts    ← Express entry (helmet, CORS, routes, cron cleanup at 3AM)
```

**Generation pipeline**: Frontend POST → `generationQueue.ts` schedules → `acestep.ts` calls Gradio API → Frontend polls `/api/generate/status/:jobId` every 2s.

**Storage**: Local filesystem via `storage/local.ts` (audio in `server/public/audio/`). Provider pattern in `storage/factory.ts`.

## Release & Publish

Push a `v*` tag triggers `.github/workflows/release.yml`:

1. Build frontend (`npm run build`)
2. git-cliff generates changelog from conventional commits (`cliff.toml`)
3. **npm publish** (`--provenance --access public`) — needs `NPM_TOKEN` repo secret
4. **GitHub Release** — attaches `dist/` + `server/` artifacts

## Conventional Commits

PR titles must match `type(scope): description`. Enforced by CI. Types:

| Type       | When                       |
|------------|----------------------------|
| `feat`     | New feature                |
| `fix`      | Bug fix                    |
| `chore`    | Maintenance, build, deps   |
| `docs`     | Documentation              |
| `refactor` | No functional change       |
| `perf`     | Performance                |
| `ci`       | CI/CD config               |
| `test`     | Tests                      |
| `style`    | Code style                 |

## CLI Entry

`bin/cli.js` — lightweight launcher for `npx ace-step-ui` / `npm start`. Not the full site-management CLI (that is a separate effort per Issue #1).

## External Tools Bundled

- `server/audio-editor/` — AudioMass web audio editor
- `server/public/demucs-web/` — Stem extraction (ONNX + WASM in browser)
- `server/scripts/` — Python scripts for generation fallback

## Security

- All external API integrations removed (Gemini, Pexels, picsum, dicebear, etc.)
- CSP via helmet in Express. Audio editor + Demucs have relaxed CSP for WASM/SAB.
- Local JWT auth, no OAuth. SQLite with WAL mode.
