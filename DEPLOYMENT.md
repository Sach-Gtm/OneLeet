# OneLeet — Deployment Guide

Stack in production:

- **Database:** MongoDB Atlas (free M0 tier)
- **Backend (Express API):** Render (free web service)
- **Frontend (React/Vite):** Vercel
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
   | `CLIENT_URL` | `https://REPLACE-AFTER-VERCEL.vercel.app` (fix in step 4) |
   | `CLOUDINARY_CLOUD_NAME` | from your Cloudinary dashboard |
   | `CLOUDINARY_API_KEY` | from Cloudinary |
   | `CLOUDINARY_API_SECRET` | from Cloudinary |
   | `AI_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | from https://aistudio.google.com |

   (Don't set `PORT` — Render injects it and the app reads `process.env.PORT`.)
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
   | `VITE_API_URL` | `https://oneleet-api.onrender.com/api` (your Render URL + `/api`) |
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
3. **Authorized JavaScript origins:** add `https://oneleet.vercel.app`
   (and `http://localhost:5173` for local dev).
4. Use that client ID as `VITE_GOOGLE_CLIENT_ID` in Vercel.

## 6. Post-deploy checklist

- [ ] `GET /api/health` on the Render URL returns ok
- [ ] Register a new account on the Vercel site → lands on the dashboard
- [ ] Log out and back in (confirms the cross-site cookie works)
- [ ] PYQ Archive + Notes load (after seeding)
- [ ] Take a mock test → results + dashboard stats update
- [ ] AI Tools: chip shows "Powered by Gemini" (if `GEMINI_API_KEY` is set)
- [ ] "Continue with Google" works (if the client ID + origins are set)

## Troubleshooting

- **CORS error in the browser console:** `CLIENT_URL` on Render doesn't exactly
  match the Vercel origin (scheme + host, no trailing slash).
- **Login "works" but you're logged out on refresh:** cookie blocked — ensure
  `NODE_ENV=production` on Render (so `SameSite=None; Secure`) and that you're
  on `https`.
- **First request after idle is slow:** Render free tier cold start — expected.
- **AI shows "Sample mode":** `AI_PROVIDER` isn't `gemini` or `GEMINI_API_KEY`
  is missing/invalid on Render.
