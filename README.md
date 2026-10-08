# Money Management (MM)

A mobile-first, installable **Progressive Web App** for tracking personal
expenses and splitting shared bills with friends — Splitwise-lite for a single
user and their contacts.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**,
**Tailwind CSS v4**, **Firebase** (Auth + Firestore) and **Recharts**.

## Features

- **Personal expenses** — fast capture with categories, notes and payment method.
- **Shared expenses** — split equally, by exact amounts, or by percentage. The
  split engine guarantees shares always sum to the total (no ledger drift).
- **Groups** — organise a trip or household and see per-group balances.
- **Balances & settlements** — see who owes whom and record payments that
  update your net position.
- **Reports** — monthly totals, category breakdown and a 6-month trend.
- **PWA** — installable to the home screen with an offline shell and app icons.

## Tech & structure

| Path | Purpose |
| --- | --- |
| `app/(auth)/*` | Sign in / sign up screens |
| `app/(app)/*` | Authenticated app (dashboard, expenses, groups, people, reports, settings) |
| `lib/split.ts` | Split engine (equal / exact / percentage) |
| `lib/balances.ts` | Ledger + balance summaries |
| `lib/data-context.tsx` | Firestore subscriptions and all CRUD |
| `lib/auth-context.tsx` | Firebase Auth state + profile |
| `firestore.rules` | Per-user access rules |

All amounts are stored as **integers in whole rupees (PKR)**. Data is scoped to
`users/{uid}/{categories|people|groups|expenses|settlements}`.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase project values
npm run dev
```

Open http://localhost:3000.

### Firebase setup

1. Create a Firebase project and a **Web app**.
2. Enable **Email/Password** and **Google** sign-in under Authentication.
3. Create a **Firestore** database.
4. Copy the web config values into `.env.local` (see `.env.example`).
5. Deploy the included rules: `firebase deploy --only firestore:rules`
   (or paste `firestore.rules` into the console).

## Scripts

```bash
npm run dev        # start the dev server
npm run build      # production build
npm run start      # run the production build (service worker + PWA enabled)
npm run lint       # eslint
npm run test       # vitest (split engine + balances)
```

> The service worker only registers in production, so test install/offline
> behaviour with `npm run build && npm run start`.

## Deploying to Vercel

Import the repo, then add every `NEXT_PUBLIC_FIREBASE_*` variable from
`.env.example` in the Vercel project settings (Environment Variables) before
deploying. No other configuration is required.
