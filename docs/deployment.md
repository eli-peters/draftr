# Deployment

## How it works

Draftr is deployed on **Vercel**, connected to the GitHub repo. Every push to `main` triggers a production deploy. Every PR gets a preview deploy.

## Environment Variables

Set these in Vercel's project settings (Settings → Environment Variables):

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API (anon/public key) |

These are also in `.env.local` for local development (not committed to git).

## Deploying

1. Push to `main` → auto-deploys to production
2. Open a PR → Vercel creates a preview URL
3. Merge the PR → auto-deploys to production

## Manual deploy

If needed: go to Vercel dashboard → Deployments → click "Redeploy" on any previous deployment.

## Custom domain

Once a domain is registered, add it in Vercel: Settings → Domains → Add. Vercel handles SSL automatically.
