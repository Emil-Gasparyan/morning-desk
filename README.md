# Morning Desk

A daily news briefing read aloud by AI. Pick your topics and a time, and each morning you get a short, radio-style spoken summary of the news.

**Status:** Prototype done · Architecture planned · Build starting (step 1 of 6)

## How it works

```
Vercel Cron (~5 AM) → /api/generate
  1. Read settings        Supabase
  2. Fetch headlines      Google News RSS
  3. Write the script     Claude API
  4. Turn it into audio   Text-to-speech (OpenAI / ElevenLabs / Google) → MP3
  5. Save the MP3         Vercel Blob
→ Delivered via the web app player, a private podcast feed, or email (Resend, optional)
```

Full diagrams, the component table, and costs are in [`docs/architecture.html`](docs/architecture.html). Download it and open it in a browser.

## Stack

| Layer | Tool |
|---|---|
| App framework | Next.js |
| Hosting, cron, file storage | Vercel (Hobby, free) + Vercel Blob |
| Settings database | Supabase |
| News source | Google News RSS |
| Script writing | Claude API |
| Voice | OpenAI TTS, ElevenLabs or Google Cloud TTS |
| Email (optional) | Resend |

## Design decisions

- **Generate early, play later.** On Vercel Hobby, a cron job runs once a day and can fire any time within its hour. The briefing is generated around 5 AM, and the player or podcast app handles the exact listening time.
- **Secrets never touch Git.** API keys live in `.env.local` (gitignored) locally and in Vercel Environment Variables in production.
- **Running costs are a few dollars a month.** Vercel's free tier covers hosting. The only real spend is Claude API and TTS usage.

## Build plan

- [x] Prototype: single-file browser app that reads headlines with the browser's built-in voice
- [x] Architecture and cost plan
- [ ] 1. Tools: editor, Git, Claude Code; create the Next.js app; push to GitHub
- [ ] 2. Connect to Vercel and deploy the empty app
- [ ] 3. One briefing by hand: headlines → Claude script → MP3
- [ ] 4. Supabase and the settings screen
- [ ] 5. Daily cron, Blob storage, podcast feed
- [ ] 6. Polish: voice, script style, email

## Environment variables

```
SUPABASE_URL=
SUPABASE_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=        # or your chosen TTS provider's key
CRON_SECRET=           # random string; only Vercel Cron can trigger /api/generate
```
