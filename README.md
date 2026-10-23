# Obsidian Studio: smartphone showcase + admin

One React (Vite + TypeScript + Tailwind) project. A small Node server (`server/index.mjs`) serves the built site, the `/admin` panel and the REST API from one process. Data and uploaded images go in Postgres when `DATABASE_URL` is set, otherwise in `.data/` (local only).

## Deploy on Render
1. Push this folder to GitHub.
2. Create a free Postgres database (Render's own free one expires after 30 days, so a free Neon or Supabase database is the better choice; check their current free limits). Copy its connection string (starts with `postgres://` or `postgresql://`).
3. Render > New > **Blueprint** > pick the repo. Render reads `render.yaml` and asks for `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `DATABASE_URL`; `JWT_SECRET` is generated for you.
   (Or New > Web Service with build command `npm install --include=dev && npm run build`, start command `npm start`, and add the 4 env vars by hand.)
4. Open `https://YOUR-SERVICE.onrender.com/admin/login`. The 6 sample phones are created on the first visit.

Free web services sleep after 15 minutes without traffic and take about a minute to wake up. Without `DATABASE_URL`, everything you add is lost on every restart.

## Sample catalogue
A fresh install (and the first request after upgrading an older site) fills the shop with about 70 phones from 15 brands (Apple, Samsung, Xiaomi, Oppo, Realme, Honor, Huawei, Vivo, Infinix, Tecno, Google Pixel, OnePlus, Nothing, Motorola, Asus ROG), each with colours, specs and an official-store link. **Specs are indicative and prices are placeholder dinar amounts: check each phone in the admin before showing it to customers**, and delete the ones you do not sell. Deleted phones do not come back. Phones without a photo get a drawn back-and-front illustration in the chosen colour; upload a real photo as the main image in the admin to replace it. Tip: a buy link can be a WhatsApp link such as `https://wa.me/213XXXXXXXXX`, which gives customers a one-tap "order" button.

## Adding a phone (admin)
Open `/admin/login`, then **+ New phone**. Only these are needed: brand (pick one or choose "+ New brand…"), phone name, and optionally price in DA, a brief description and a main image. Tick "Published" to show it on the site. Everything else (colors, specs, camera photos, buy links) sits under **More details (optional)** and can be skipped. Prices are shown in Algerian dinar (e.g. 250 000 DA); phones without a price show "Price on request". The sample phones and their prices are examples: edit or delete them in the admin.

## Security
- **Session:** after sign-in the browser holds an HttpOnly, SameSite=Strict cookie (Secure on https). JavaScript cannot read it, so a script bug cannot steal it. It lasts 7 days and renews while you keep using the admin, so you are not asked to sign in again on every visit. Logging out, changing `ADMIN_PASSWORD`/`ADMIN_EMAIL` or rotating `JWT_SECRET` signs everyone out.
- **Brute force:** 5 wrong passwords from one address lock it out for 15 minutes (60 wrong attempts overall pauses all sign-ins for a while).
- **Requests:** every change needs the `X-Requested-With` header and the SameSite cookie (CSRF protection); request bodies are capped at 1 MB; all fields are length-checked; buy links must be http(s); image URLs, colours and spec keys are validated; uploads are checked by their real file type, 5 MB max, and served with `nosniff` and a sandbox policy.
- **Pages:** Content-Security-Policy, frame blocking, `nosniff`, referrer and permissions policies, and HSTS (https) are sent with every page. Server errors never show internals.
- **Your part:** `JWT_SECRET` must be 16+ random characters and `ADMIN_PASSWORD` 8+ (use 12+); the server refuses to sign anyone in otherwise. Keep them out of Git (they live only in the host's environment variables). There is one admin account and no two-factor step, so use a password you use nowhere else.

## Languages
The whole interface is available in English, French and Arabic (right-to-left). Visitors switch with the EN / FR / عربي buttons in the header; the choice is remembered, and the first visit follows the browser language (French if it is none of the three). All texts are in `src/i18n.tsx` (one line per text: English, French, Arabic), so wording is easy to adjust. What the admin types (phone names, descriptions, taglines) is shown as written, in any language. The 6 sample phones have English descriptions: replace them with your own.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173 · admin: /admin · login admin@example.com / admin12345
```
Locally the API runs inside Vite and saves to `.data/`. To test the production server: `npm run build && npm start` (http://localhost:4000; set the env vars in `.env`, see `.env.example`).

## Structure
- `src/` React app (`pages.tsx` public, `admin.tsx` admin, `i18n.tsx` EN/FR/AR texts, `api.ts` fetch helper with in-browser image resize)
- `server/index.mjs` production server (static files + API) · `server/core.mjs` the REST API · `server/stores.mjs` file / Postgres storage · `server/seed.mjs` + `server/catalog.mjs` sample data
- `dev/api-plugin.mjs` runs the API inside `npm run dev`
- `render.yaml` Render blueprint

## API
Public: `GET /api/brands` · `GET /api/phones?q=&brand=&min=&max=&sort=newest|price_asc|price_desc|battery|camera&page=&limit=&featured=1` · `GET /api/phones/:slug` · `GET /api/compare?a=&b=`
Auth: `POST /api/auth/login {email,password}` sets the session cookie; `POST /api/auth/logout` clears it; `GET /api/admin/me` checks it. Writes need the header `X-Requested-With: studio`.
Admin (session cookie): `/api/admin/stats`, `/api/admin/phones` (+ `/:id`, `/:id/duplicate`), `/api/admin/brands` (+ `/:id`), `POST /api/admin/upload` (jpg/png/webp/avif, 5 MB).
