# Ledger — deploy & launch guide

This turns your invoice generator into a real product with working payments.
Everything below is copy-paste-able; none of it requires much coding experience.

## What's in this folder
```
index.html                      ← your app (Stripe-connected version)
api/create-checkout-session.js  ← starts a Stripe payment
api/webhook.js                  ← marks a user "unlocked" after they pay
api/check-unlock.js             ← lets the app check if an email is unlocked
lib/supabase.js                 ← tiny database connection helper
package.json / vercel.json      ← deployment config
```

## Step 1 — Create your accounts (10 min)
1. **Stripe**: sign up at stripe.com. Stay in **Test mode** (toggle top-right) until step 6.
2. **Supabase**: sign up at supabase.com → "New project" (free tier is enough).
3. **Vercel**: sign up at vercel.com — connect it to your GitHub account.

## Step 2 — Create the database table
In Supabase: go to **SQL Editor** → New query → paste and run:
```sql
create table unlocked_users (
  email text primary key,
  unlocked_at timestamptz not null default now()
);
```
Then go to **Project Settings → API** and copy:
- `Project URL` → this is `SUPABASE_URL`
- `service_role` key (under "Project API keys") → this is `SUPABASE_SERVICE_ROLE_KEY`
  (keep this secret — never put it in the front-end code)

## Step 3 — Get your Stripe keys
In Stripe dashboard → **Developers → API keys**:
- Copy the **Secret key** → this is `STRIPE_SECRET_KEY`
(You'll get `STRIPE_WEBHOOK_SECRET` in step 5, after deploying.)

## Step 4 — Push this folder to GitHub
```bash
cd ledger-backend
git init
git add .
git commit -m "Ledger app with Stripe unlock"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ledger.git
git push -u origin main
```
(Create the empty repo on GitHub first if you haven't.)

## Step 5 — Deploy to Vercel
1. In Vercel: **Add New → Project** → import the GitHub repo you just pushed.
2. Before deploying, add these **Environment Variables** in Vercel's project settings:
   - `STRIPE_SECRET_KEY` — from step 3
   - `SUPABASE_URL` — from step 2
   - `SUPABASE_SERVICE_ROLE_KEY` — from step 2
   - `APP_URL` — your Vercel URL, e.g. `https://ledger-yourname.vercel.app` (you can update this after first deploy)
   - `STRIPE_WEBHOOK_SECRET` — leave blank for now, you'll add it next
3. Click **Deploy**. Once it's live, copy the deployed URL.
4. Back in Stripe dashboard → **Developers → Webhooks → Add endpoint**:
   - Endpoint URL: `https://your-deployed-url.vercel.app/api/webhook`
   - Event to send: `checkout.session.completed`
   - After creating it, Stripe shows a **Signing secret** (starts with `whsec_`) — copy it.
5. Back in Vercel → Environment Variables → set `STRIPE_WEBHOOK_SECRET` to that value, then **redeploy** (Vercel → Deployments → ⋯ → Redeploy) so it picks up the change.

## Step 6 — Test it end-to-end (still in Stripe Test mode)
1. Open your deployed URL, click "Remove it for $9 one-time".
2. Enter any email, and on Stripe's checkout page use test card `4242 4242 4242 4242`, any future expiry, any CVC.
3. You should land back on your app with the watermark gone.
4. Refresh the page — it should *stay* gone (this confirms the database + webhook worked).
5. Check Supabase's `unlocked_users` table — your test email should be there.

If the watermark doesn't stay unlocked after refresh, check Vercel's function logs
(Vercel dashboard → your project → **Logs**) for errors — almost always a typo'd
environment variable.

## Step 7 — Go live
1. In Stripe, flip the toggle from **Test mode** to **Live mode**.
2. Grab your **live** secret key (Developers → API keys) and repeat step 5.4's webhook
   setup in live mode too — test and live webhooks are separate.
3. Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in Vercel to the live values, redeploy.
4. Do one real test purchase yourself with a real card to confirm it works, then refund
   yourself from the Stripe dashboard if you like.

## Step 8 — Connect a real domain (optional but recommended)
1. Buy a domain (Namecheap, Porkbun, etc.) — a few dollars/year.
2. In Vercel → your project → **Settings → Domains** → add your domain.
3. Vercel shows you 1–2 DNS records to add at your domain registrar. Add them there.
4. Update `APP_URL` in Vercel's environment variables to your new domain, redeploy.

## Step 9 — Launch
- Post it where freelancers hang out: r/freelance, r/smallbusiness, Indie Hackers,
  Product Hunt, freelancer Discord/Facebook groups.
- Lead with a before/after or a 20-second screen recording of filling out an invoice —
  concrete demos beat text descriptions for tools like this.
- Mention it's free to use, with a small one-time fee to remove the watermark —
  that's an easy, low-friction pitch.

## Costs to expect
- Vercel, Supabase: free at this scale.
- Stripe: no monthly fee, takes ~2.9% + $0.30 per transaction.
- Domain: ~$10–15/year.
So it costs you nothing to run until people start paying.
