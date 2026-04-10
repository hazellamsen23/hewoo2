# Hazel's Archive

## Overview

A MySpace-inspired personal social platform built as a pnpm workspace monorepo with TypeScript. Two main artifacts: a React/Vite frontend and an Express API server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite + Tailwind CSS
- **API framework**: Express 5
- **Database**: JSON file-based storage (no external DB required)
- **Auth**: JWT tokens stored in localStorage (`hz_token`)

## Artifacts

- `artifacts/hazel-archive` — React/Vite frontend, preview path `/`
- `artifacts/api-server` — Express API server, preview path `/api`

## Architecture

### Data Persistence
JSON files in `artifacts/api-server/data/`:
- `users.json` — user accounts & profiles
- `wall_posts.json` — Freedom Wall posts
- `guestbook.json` — Guestbook entries
- `blogs.json` — Blog posts
- `photos.json` — Photo entries
- `albums.json` — Photo albums

### Auth Flow
- Register/login → JWT returned → stored as `hz_token` in localStorage
- AuthContext in frontend manages token; all API calls include `Authorization: Bearer <token>`

### Profile System
Each user profile includes:
- Display name, status text, bio, location, course
- Zodiac, blood type, fun facts, About Me items
- Custom CSS (injected via `<style>` tag in Layout)
- Background color, text color, link color, font family
- Background music (URL)
- Profile song (URL + start/end timestamps, max 20s)
- Playlist (array of `{title, url}`)
- Top 8 friends (customizable count + label)
- Marquee text

### Key Frontend Files
- `src/context/AuthContext.tsx` — JWT authentication context
- `src/context/AppContext.tsx` — profile context (fetches from API)
- `src/components/Layout.tsx` — main layout: sparkly cursor, music player, marquee, Top 8, playlist, profile song
- `src/pages/ProfilePage.tsx` — 5-tab profile editor (Profile, Appearance, Music, Friends, About)
- `src/pages/WallPage.tsx` — Freedom Wall with voice messages
- `src/pages/GuestbookPage.tsx` — Guestbook with stickers, GIFs, voice messages
- `src/pages/BlogPage.tsx` — Blog with moods, tags, visibility controls
- `src/pages/GalleryPage.tsx` — Photo albums with captions and lightbox
- `src/services/api.ts` — all API calls centralized here

### Key Backend Files
- `src/lib/dataStore.ts` — JSON file-based data store
- `src/routes/index.ts` — all Express routes

## API Proxy
In development, vite proxies `/api/*` → `http://localhost:8080`. In production (Replit), the platform routes `/api/*` to the API server directly.

## Key Commands
- `pnpm --filter @workspace/hazel-archive run dev` — run frontend locally
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Share Links
Profile sharing via `/?view={userId}` — sets `viewedProfile` in AppContext for public viewing.

## Features
- Sparkly cursor effect (canvas overlay)
- Background music with mute toggle
- Marquee banner with custom text
- Custom CSS injection per user
- Top 8 friends grid (configurable count + label)
- Playlist sidebar
- Profile song with 20-second timestamp selector
- About Me: marquee text, zodiac, blood type, fun facts
- Freedom Wall (guest + logged-in posts, voice messages)
- Guestbook (stickers, GIFs, voice messages)
- Blog posts (moods, tags, public/friends/private)
- Photo albums with captions and lightbox
- Profile comment section
- Shareable profile links
