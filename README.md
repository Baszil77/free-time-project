# Context (MVP)

Camera-first context for places around you. Take a photo, get a short factual explanation, and save it to your personal archive.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth + Postgres + Storage)
- Mapbox
- OpenAI (vision + text)

## Local setup

```bash
npm install
npm run dev
```

Create a `.env.local`:

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
MAPBOX_TOKEN=...
OPENAI_API_KEY=...

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_MAPBOX_TOKEN=...
```

## Supabase
1. Create a Supabase project.
2. Run the migration in `supabase/migrations/001_init.sql`.
3. Create the `photos` storage bucket if it does not exist.

## Core flows
- **Home**: capture/upload a photo (camera-friendly input) and optional location.
- **Explain**: AI generates a 2–3 sentence summary and a confidence label, then auto-saves for signed-in users.
- **Your Places**: private archive grouped by city with search.
- **Discover**: map + list of nearby public entries.
- **Place Detail**: photo, story, map pin.

## Rate limiting & caching
- Daily cap enforced in `/api/explain` via `ai_requests`.
- AI responses cached by photo hash + coarse location in `ai_cache`.

## Deployment (Vercel)
1. Push to GitHub.
2. Create a Vercel project.
3. Add environment variables from `.env.local`.
4. Deploy.

## Analytics (console only)
Key actions log to `console` (explain requests, location capture, auth events).

## TODO (Phase 2)
- Offline capture + sync.
- Deeper sources with citations.
- Corrections workflow + user feedback.
- Better location clustering and ranking.
- Public sharing flow + moderation.
