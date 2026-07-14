# OneLeet — Deployment Guide

Stack in production:

- **Domain:** `oneleet.in` (GoDaddy) — website on the apex + `www`, API on
  `api.oneleet.in`. See **§7** for the DNS/custom-domain wiring.
- **Database:** MongoDB Atlas (free M0 tier)
- **Backend (Express API):** Render (free web service) — `api.oneleet.in`
- **Frontend (React/Vite):** Vercel — `oneleet.in`
- **Media:** Cloudinary (already used)

**Why Render over Railway:** Render still has a genuinely free web-service
tier and a dead-simple "connect a GitHub repo → set env vars → deploy" flow,
which is the easiest path for an Express API talking to an external MongoDB.
Trade-off: the free instance sleeps after ~15 min idle and cold-starts in
~30–50s on the next request — fine for early stage. (Railway is also great but
its free allowance is now a limited trial credit.)

> Security note: put every secret **into the platform's dashboard** (Render /
> Vercel env vars). Don't paste connection strings, API keys, or passwords into
> chat or commit them to git.

---

## 1. MongoDB Atlas (do this first — the backend needs the URI)

1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. **Create a cluster** → choose **M0 (Free)** → pick a region near India
   (e.g. Mumbai `ap-south-1`) → Create.
3. **Database Access** → Add New Database User → username + a strong password
   (save it) → role "Read and write to any database".
4. **Network Access** → Add IP Address → **Allow access from anywhere**
   (`0.0.0.0/0`). (Render's egress IPs aren't static on the free tier, so allow-all
   is the pragmatic choice; the DB user/password still protects it.)
5. **Connect → Drivers** → copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
6. Replace `<password>` with your real password and insert the DB name before
   the `?`, e.g. `.../oneleet?retryWrites=...`. Keep this string for step 2.

## 2. Backend API on Render

1. Sign up at https://render.com with your GitHub, and grant access to the
   `oneleet` repo.
2. **New → Web Service** → pick this repo.
3. Settings:
   - **Root Directory:** `Server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. **Environment variables** (Advanced → Add Environment Variable):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGO_URI` | the Atlas string from step 1 |
   | `JWT_SECRET` | a long random string (e.g. from `openssl rand -hex 32`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://oneleet.in,https://www.oneleet.in,https://oneleet.vercel.app` (put the primary domain first — password-reset emails use it) |
   | `COOKIE_DOMAIN` | *(optional)* `.oneleet.in` — only once the site is fully served from oneleet.in and the API is `api.oneleet.in`. Upgrades the auth cookie to first-party `SameSite=Lax`. Leave unset for the cross-site `.vercel.app` setup. |
   | `CLOUDINARY_CLOUD_NAME` | from your Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | from Cloudinary |
   | `CLOUDINARY_API_SECRET` | from Cloudinary |
   | `AI_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | from https://aistudio.google.com |
   | `SUPERADMIN_PASSWORD` | *(recommended)* a strong password. On boot the app creates/claims the Super Admin account (`sachin.gautam8292@gmail.com`) with this password, **before** anyone could register that address. Set it once, on first deploy. |
   | `SUPERADMIN_EMAIL` | *(optional)* overrides the built-in Super Admin address if it ever changes. |

   (Don't set `PORT` — Render injects it and the app reads `process.env.PORT`.)

   > **Super Admin provisioning.** The Super Admin role is never granted by
   > signing up, and never by promoting an existing account — it's only ever
   > assigned to a **freshly created** account, so a squatted address can't be
   > escalated. Provision it one of two ways on a **not-yet-registered** address:
   > (a) set `SUPERADMIN_PASSWORD` and deploy — the startup bootstrap creates the
   > account at boot (log in with `sachin.gautam8292@gmail.com` + that password);
   > or (b) sign in with Google using the real `sachin.gautam8292@gmail.com` for
   > the first time (the server verifies the address with Google). If the address
   > was already registered as a normal user, delete that account first. Mentors
   > and admins are then appointed in-app from the Admin dashboard.
5. **Create Web Service.** When it's live, copy the URL, e.g.
   `https://oneleet-api.onrender.com`. Health check: open
   `https://oneleet-api.onrender.com/api/health` → should return `{"status":"ok"}`.
6. Seed sample content (optional, from the Render **Shell** tab, or run locally
   against the Atlas URI): `npm run seed:pyqs && npm run seed:notes && npm run seed:tests`.

## 3. Frontend on Vercel

1. Sign up at https://vercel.com with GitHub, import the `oneleet` repo.
2. Settings:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (auto-detected)
   - Build Command / Output (`dist`) are auto-detected. `vercel.json` already
     handles SPA routing so deep links work.
3. **Environment Variables:**

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://api.oneleet.in/api` (your API domain + `/api`; falls back to the Render URL in code if unset) |
   | `VITE_GOOGLE_CLIENT_ID` | your Google OAuth Web client ID |

4. **Deploy.** Copy the resulting URL, e.g. `https://oneleet.vercel.app`.

## 4. Connect the two (CORS + cookies)

1. Back in **Render → your service → Environment**, set `CLIENT_URL` to the
   exact Vercel URL from step 3 (e.g. `https://oneleet.vercel.app`, no trailing
   slash). You can comma-separate multiple, e.g.
   `https://oneleet.vercel.app,https://www.oneleet.in`.
2. Save → Render redeploys. In production the API sets the auth cookie as
   `SameSite=None; Secure`, which is required for the Vercel↔Render cross-site
   setup (already handled in code via `NODE_ENV=production`).

## 5. Google OAuth (for the "Continue with Google" button)

1. https://console.cloud.google.com → APIs & Services → Credentials.
2. Create/edit your **OAuth 2.0 Web client**.
3. **Authorized JavaScript origins:** add `https://oneleet.in`,
   `https://www.oneleet.in`, `https://oneleet.vercel.app`, and
   `http://localhost:5173` (local dev). (Google sign-in uses the client-side
   token flow, so there are **no** redirect URIs to configure — origins only.)
4. Use that client ID as `VITE_GOOGLE_CLIENT_ID` in Vercel.

## 6. Post-deploy checklist

- [ ] `GET /api/health` on the Render URL returns ok
- [ ] Register a new account on the Vercel site → lands on the dashboard
- [ ] Log out and back in (confirms the cross-site cookie works)
- [ ] PYQ Archive + Notes load (after seeding)
- [ ] Take a mock test → results + dashboard stats update
- [ ] AI Tools: chip shows "Powered by Gemini" (if `GEMINI_API_KEY` is set)
- [ ] "Continue with Google" works (if the client ID + origins are set)

## 7. Custom domain (oneleet.in, bought on GoDaddy)

Website → `oneleet.in` + `www` (Vercel); API → `api.oneleet.in` (Render). The
app reads all URLs from env vars, so this is DNS + dashboard config — no code
changes beyond the optional `COOKIE_DOMAIN` upgrade below.

**A. GoDaddy → your domain → DNS → Manage DNS.** Add/edit these records (use the
exact targets Vercel/Render show you in their "add domain" screens if they
differ — those dashboards are the source of truth):

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | `@` | `76.76.21.21` | apex `oneleet.in` → Vercel |
| CNAME | `www` | `cname.vercel-dns.com` | `www` → Vercel |
| CNAME | `api` | `oneleet-api.onrender.com` | `api` → Render (API) |

Keep GoDaddy's nameservers (don't switch to Vercel's) so email MX records can
stay here later.

**B. Vercel → Project → Settings → Domains.** Add `oneleet.in` (set primary) and
`www.oneleet.in` (redirect → apex). Vercel auto-issues the HTTPS certificate
once DNS resolves.

**C. Render → service → Settings → Custom Domains.** Add `api.oneleet.in`.
Render verifies the CNAME and issues its certificate. Then set the Vercel env
`VITE_API_URL=https://api.oneleet.in/api` and redeploy the frontend.

**D. Render → Environment.** Set `CLIENT_URL` (comma-separated, primary first):
`https://oneleet.in,https://www.oneleet.in,https://oneleet.vercel.app`.

**E. Google Cloud Console** → OAuth client → add the new JS origins (see §5).

**F. First-party cookie upgrade (optional, do last).** Once every visitor lands
on `oneleet.in` (not the `.vercel.app` URL), set `COOKIE_DOMAIN=.oneleet.in` on
Render and drop the `.vercel.app` entry from `CLIENT_URL`. The auth cookie
becomes first-party `SameSite=Lax; Domain=.oneleet.in`, which browsers treat far
more reliably than the cross-site `None` cookie. (Login already works regardless
via the Bearer token; this just strengthens the cookie path.)

**DNS propagation** is usually minutes, occasionally up to ~48h. Check status at
https://dnschecker.org for `oneleet.in`, `www`, and `api`.

## Troubleshooting

- **CORS error in the browser console:** `CLIENT_URL` on Render doesn't exactly
  match the Vercel origin (scheme + host, no trailing slash).
- **Login "works" but you're logged out on refresh:** cookie blocked — ensure
  `NODE_ENV=production` on Render (so `SameSite=None; Secure`) and that you're
  on `https`.
- **First request after idle is slow:** Render free tier cold start — expected.
- **AI shows "Sample mode":** `AI_PROVIDER` isn't `gemini` or `GEMINI_API_KEY`
  is missing/invalid on Render.
