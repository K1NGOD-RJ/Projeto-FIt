# Treino

Workout tracker for a small group of friends. React + Vite, Supabase (auth + Postgres), hosted on Netlify. All free tier.

## Setup

1. **Supabase** — create a free project at supabase.com.
   - SQL Editor → paste [supabase/schema.sql](supabase/schema.sql) → change `TROQUE-ESTE-CODIGO` to your invite code → Run.
   - Authentication → Sign In / Providers → Email → turn **off** "Confirm email" (so friends get in right away, and you skip the free tier's email limit).
   - Project Settings → API → copy the Project URL and the `anon` public key.
2. **Local** — put those values in `.env` (see `.env.example`), then `npm install` and `npm run dev`.
3. **Netlify** — import the repo (build settings come from `netlify.toml`), and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Site configuration → Environment variables.
4. Send friends the URL plus the invite code. On a phone, "Add to Home Screen" makes it open like an app.

To change the invite code later, run:
`update private.settings set invite_code = 'NOVO-CODIGO';`

## Notes

- Free Supabase projects pause after 7 days with no activity. Click "Restore" in the dashboard if that happens. Your data is kept.
- The plan template (`src/data/defaultPlan.js`) was generated from `Plano_de_Treino.xlsx`.
- A workout in progress is saved in the browser, so closing the tab doesn't lose it.
