# Morning Desk

A daily news briefing read aloud. Create a profile, pick your topics, the outlets you trust and the time you listen, and each morning you get a short, radio-style spoken summary of the news made for you.

**Status:** Landing page, sign-up flow, headline dashboard and settings built (step 3 of 7) · Accounts next

Live: https://morning-desk-opal.vercel.app

## Features

- **Topics:** Google News sections (World, Business, Tech, Sports…) plus your own search topics like "Formula 1".
- **Preferred sources:** pick outlets you trust. Their recent stories come first, or turn on "only my sources".
- **Schedule:** choose the time and days you listen. Your briefing is ready before then.
- **Voice and length:** pick a voice style and a 3, 5 or 10 minute briefing.
- **Accounts:** sign in with a link sent to your email, no password. Preferences follow you to any device.
- **Coming:** spoken MP3 briefings, private podcast feed, email delivery.

## How it works

```
Vercel Cron (~5 AM) → /api/generate
  1. Read each user's settings   Supabase
  2. Fetch headlines             Google News RSS
  3. Write the script            plain read-out first, Claude API later
  4. Turn it into audio          Text-to-speech (OpenAI / ElevenLabs / Google) → MP3
  5. Save the MP3                Vercel Blob
→ Delivered via the web app player, a private podcast feed, or email (Resend, optional)
```

Full diagrams, the component table, and costs are in [`docs/architecture.html`](docs/architecture.html). Download it and open it in a browser.

## Stack

| Layer | Tool |
|---|---|
| App framework | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Hosting, cron, file storage | Vercel (Hobby, free) + Vercel Blob |
| Accounts and settings | Supabase (email-link sign-in) |
| News source | Google News RSS |
| Script writing | Plain read-out, Claude API later |
| Voice | OpenAI TTS, ElevenLabs or Google Cloud TTS |
| Email (optional) | Resend |

## Design decisions

- **Free, for friends.** Vercel's free plan and the Google News feed are for personal, non-commercial use, so Morning Desk is a free app for a small group.
- **Generate early, play later.** On Vercel Hobby, a cron job runs once a day and can fire any time within its hour. Briefings are generated around 5 AM, and the player or podcast app handles the exact listening time.
- **Secrets never touch Git.** API keys live in `.env.local` (gitignored) locally and in Vercel Environment Variables in production.
- **Running costs are a few dollars a month.** Vercel's free tier covers hosting. The only real spend is text-to-speech (and the Claude API, later).

## Build plan

- [x] Prototype: single-file browser app that reads headlines with the browser's built-in voice
- [x] Architecture and cost plan
- [x] 1. Tools: editor, Git, Claude Code; create the Next.js app; push to GitHub
- [x] 2. Connect to Vercel and deploy the empty app
- [x] 3. SaaS site: landing page, sign-up flow, headline dashboard, settings (preferences saved in the browser)
- [ ] 4. Accounts: Supabase email-link sign-in, preferences saved to the database
- [ ] 5. One briefing by hand: headlines → script → MP3
- [ ] 6. Daily cron, Blob storage, podcast feed
- [ ] 7. Polish: voice, script style, email

## Run it locally

```
npm install
npm run dev
```

Copy the environment variables below into `.env.local`, run `supabase/migrations/0001_profiles.sql` once in the Supabase SQL Editor, then open http://localhost:3000.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=              # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # safe in the browser; Row Level Security protects data
OPENAI_API_KEY=        # or your chosen TTS provider's key
CRON_SECRET=           # random string; only Vercel Cron can trigger /api/generate
ANTHROPIC_API_KEY=     # later, for AI-written scripts
```
