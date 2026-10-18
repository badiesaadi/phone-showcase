# Obsidian Studio: smartphone showcase + admin

One React (Vite + TypeScript + Tailwind) project. The public site and the `/admin` panel are the React app; the API is a single Netlify Function that stores data and images in Netlify Blobs (no database to set up).

## Deploy on Netlify
1. Push this folder to GitHub, then Netlify > Add new site > Import from Git. Settings come from `netlify.toml`.
2. Site configuration > Environment variables: add `JWT_SECRET` (long random string), `ADMIN_EMAIL`, `ADMIN_PASSWORD`. Redeploy.
3. Open `/admin/login`. The 6 sample phones are created on the first visit; edit or delete them in the admin.

CLI instead of Git: `npm i -g netlify-cli && netlify login && netlify init && netlify deploy --build --prod`.
(Drag-and-drop of `dist` alone will not work: the API needs the function.)

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173  ·  admin: /admin  ·  login admin@example.com / admin12345
```
Locally the same API runs inside Vite and saves to `.data/`. Optional: copy `.env.example` to `.env` to change the login. Local data does not carry over to the live site.

## Structure
- `src/` React app (`pages.tsx` public, `admin.tsx` admin, `api.ts` fetch helper with in-browser image resize)
- `netlify/functions/api.mjs` + `lib/core.mjs` the REST API (`/api/*`, `/uploads/*`); `lib/seed.mjs` sample data
- `dev/api-plugin.mjs` runs that API in `npm run dev`

## API
Public: `GET /api/brands` · `GET /api/phones?q=&brand=&min=&max=&sort=newest|price_asc|price_desc|battery|camera&page=&limit=&featured=1` · `GET /api/phones/:slug` · `GET /api/compare?a=&b=`
Auth: `POST /api/auth/login {email,password}` returns `{token}` (JWT, 8h).
Admin (Bearer token): `/api/admin/stats`, `/api/admin/phones` (+ `/:id`, `/:id/duplicate`), `/api/admin/brands` (+ `/:id`), `POST /api/admin/upload` (jpg/png/webp/avif, 5 MB).
