# Flashcards App

A full-stack flashcard learning app built with Next.js and Supabase. Features authentication, CRUD flashcards, flip cards, quiz mode with spaced repetition (easy/medium/hard), and a dashboard with stats.

## Getting Started

### 1. Environment variables

Copy the example env file and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (e.g. `https://xxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anonymous (public) key

Get these from [Supabase Dashboard](https://app.supabase.com) → your project → **Settings** → **API**.

### 2. Database schema

In the Supabase SQL Editor, run the contents of `supabase/schema.sql` to create the `flashcards` table and Row Level Security (RLS) so each user only sees their own cards.

**Example queries** (used by the app via Supabase client):

- **Select all cards for a user:** `select * from flashcards where user_id = $1 order by created_at desc`
- **Select cards due for review:** `select * from flashcards where user_id = $1 and (next_review_at is null or next_review_at <= now()) order by next_review_at nulls first`
- **Insert:** `insert into flashcards (user_id, word, meaning, next_review_at) values ($1, $2, $3, now()) returning *`
- **Update after quiz:** `update flashcards set last_reviewed = now(), review_count = review_count + 1, next_review_at = $2, difficulty_level = $3 where id = $1 returning *`

### 3. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or sign in on the auth page (email or Google), then add cards and use Quiz mode for spaced repetition.

### 4. (Optional) Google sign-in

1. **Supabase Dashboard** → **Authentication** → **Providers** → enable **Google** and enter your Google OAuth Client ID and Secret.
2. **URL Configuration**: set **Site URL** (e.g. `http://localhost:3000` for dev) and add **Redirect URLs**:  
   `http://localhost:3000/auth/callback` (and your production URL when you deploy).
3. **Google Cloud Console**: create OAuth 2.0 credentials (Web application), add authorized redirect URI:  
   `https://<your-project-ref>.supabase.co/auth/v1/callback`, and use the Client ID and Secret in Supabase.

## Features

- **Auth**: Sign up / sign in with Supabase Auth (email + password) or **Google**.
- **Cards**: Add, flip, and browse flashcards (Previous, Next, Random).
- **Quiz mode**: Review cards due based on `next_review_at`; rate each card as Easy, Medium, or Hard to adjust when it appears again (spaced repetition).
- **Dashboard**: Total cards learned, review streak (consecutive days with a review), and count of cards pending review.

## Project structure

- `app/` — Next.js App Router pages: `page.tsx` (home), `quiz/`, `dashboard/`, `auth/`
- `components/` — `flash-card`, `add-card-form`, `quiz-card`, `dashboard-stats`, `nav`
- `lib/supabase/` — Supabase client and types
- `lib/auth/` — `useAuth` hook
- `lib/flashcards/` — CRUD and due-cards queries, streak helper
- `supabase/schema.sql` — Table and RLS definitions

## Tech stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL)
