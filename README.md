# Vinylify

A Spotify-connected vinyl player web app built with Next.js 14, shadcn/ui, and the Spotify Web Playback SDK. Spin your music on a virtual turntable with album-art-driven backgrounds, real-time playback controls, and a premium dark aesthetic.

## Stack

- **Next.js 14** (App Router) — server components, route handlers, cookie-based auth
- **Spotify OAuth + Web Playback SDK** — full playback control directly in the browser
- **shadcn/ui + Tailwind CSS** — UI components and styling
- **Color Thief** — extracts dominant colors from album art to drive dynamic backgrounds
- **motion/react** — animations

## Features

- Vinyl turntable visualization synced to playback state
- Album art color extraction → layered blurred-art + gradient + dark overlay background
- Spotify Connect — play from any device, control here
- Auth-gated UI — dock and player only visible when logged in
- Light / dark mode

## Getting started

1. Copy `.env.sample` to `.env.local` and fill in your Spotify app credentials
2. Install dependencies: `pnpm install`
3. Run dev server: `pnpm dev`

Requires a **Spotify Premium** account for Web Playback SDK.
