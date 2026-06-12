# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Nářadí — Fér Řemeslníci** is a Progressive Web App (PWA) for tracking tools/assets ("nářadí") across construction-company locations. Workers log in with a PIN, scan QR/barcodes to look up tools, and transfer them between locations. The UI language is Czech.

The backend is a **Google Apps Script** web app (a deployed `/exec` endpoint backed by Google Sheets). This repository contains only the **frontend** — there is no Apps Script source here.

## Architecture

This is a **single-file vanilla-JS app** with no build step, framework, or package manager. The entire application lives in `index.html`:

- **Lines ~13–523** — `<style>`: all CSS, themed via CSS custom properties on `:root` (brand colors, light theme). Mobile-first, portrait-oriented.
- **Lines ~524–755** — `<body>`: five `.page` sections (`page-dashboard`, `page-scanner`, `page-transfer`, `page-search`, `page-history`), a fixed `#topbar`, `#bottomNav`, login screen, and a detail overlay.
- **Lines ~757–2163** — `<script>`: all application logic, organized by `// ===` banner comments (CONFIG, API CALLS, TOAST, LOGIN, NAVIGATION, DASHBOARD, LOKACE, SCANNER, DETAIL OVERLAY, BATCH TRANSFER, CATALOG / SEARCH, HISTORY, GPS, UTILS).

Supporting files:
- `sw.js` — service worker. `script.google.com` requests always go to network; everything else is network-first with cache fallback. Bump `CACHE_NAME` (currently `naradi-v2`) when changing precached assets to force a refresh.
- `manifest.json` — PWA manifest (standalone, portrait).
- `icon-192.png`, `icon-512.png`, `logo-web.png` — app icons/branding (precached by `sw.js`).

External dependencies are loaded via CDN at runtime (no install): **html5-qrcode** (camera scanning) and Google Fonts (Outfit, JetBrains Mono).

### Client/server contract

All server communication goes through two helpers (search for `apiGet` / `apiPost`) that target `API_URL`, the hardcoded Apps Script `/exec` URL in the `CONFIG` block (~line 764). Both expect a JSON response shaped `{ success: bool, ... }` or `{ success: false, error: "..." }`.

- `apiGet(action, params)` → `GET ?action=<action>&...` (used for reads + login).
- `apiPost(action, body)` → `POST ?action=<action>` with `JSON.stringify({ action, ...body })`; uses `redirect: 'follow'` because Apps Script redirects POSTs.

Server actions in use: `loginPin`, `dashboard`, `getLokace`, `getNaradi`, `getNaradiById`, `scanCode`, `getHistorie`, `prevod` (single transfer), `hromadnyPrevod` (batch transfer).

### Domain model (Czech field names)

- A tool item carries: `id`, `nazev`/`interni_nazev`, `znacka`, `model`, `seriove_cislo`, `cena`, `typ_majetku`, `lokace` (current location), `scan` (QR/barcode value), `foto_urls`/`foto_thumbnails`, `posledni_prevody` (recent transfers).
- `lokace` = locations; `prevod` = a transfer of a tool to `na_lokaci`, recording `prevedl` (who) plus optional `gps_lat`/`gps_lon`.
- User roles (`formatRole`): `admin`, `stavbyvedouci` (site manager), `skladnik` (warehouse worker).

### App flow

`attemptLogin()` (4-digit PIN pad) → on success stores `currentUser`, reveals topbar/nav, and kicks off `loadDashboard()`, `loadLokace()`, `loadCatalog()`. `showPage(name)` toggles `.page`/`.nav-item` active classes, lazy-loads page data, and starts/stops the camera scanner when entering/leaving the scanner & transfer pages. Global mutable state lives in top-level `let`s (`currentUser`, `scanner`, `batchItems`, `lokaceData`, `dashboardData`).

## Development

There is **no build, lint, or test tooling** — edit `index.html` directly. To run locally, serve the directory over HTTP (the service worker and camera APIs require a secure/localhost context; opening the file via `file://` will not fully work):

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Note that login and all data require the live Apps Script backend; there is no local mock.

## Conventions

- Keep everything inline in `index.html` — do not introduce a bundler, framework, or npm dependencies without explicit direction.
- UI strings, comments, and domain terms are **Czech**; match the existing language.
- User-supplied/server strings rendered into the DOM must go through `escHtml()` to prevent injection.
- After changing any precached asset (`index.html`, `sw.js`, icons, manifest), bump `CACHE_NAME` in `sw.js` so clients pick up the new version.
