# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Czech-language tool-inventory PWA ("Nářadí" = tools) for the company Fér Řemeslníci. Workers log in with a 4-digit PIN, browse/search a tool catalog, scan QR/barcodes on tools, and transfer them between locations (warehouses, construction sites, and a "transit" pseudo-location).

## Development

There is no build system, package manager, linter, or test suite. The app is static files served as-is.

- Run locally: `python3 -m http.server 8000` (or any static server), then open `http://localhost:8000`. The camera scanner and service worker require a secure context (localhost qualifies).
- There is no compile step — edit `index.html` and reload. Hard-refresh or bump the service worker cache to bypass stale caching (see below).

## Architecture

**The entire application lives in `index.html` (~2,200 lines)** — CSS in a `<style>` block at the top, page markup in `<body>`, and all JavaScript in a single `<script>` block at the bottom (starting ~line 757). There are no modules or frameworks; it is vanilla JS with global functions wired via `onclick` attributes. The only external dependency is `html5-qrcode` loaded from a CDN.

**Backend is a Google Apps Script web app** backed by a Google Sheet. The deployment URL is hardcoded as `API_URL` at the top of the script block. Two helpers wrap all communication:
- `apiGet(action, params)` — query-string GET
- `apiPost(action, body)` — JSON POST (the `action` goes in both the URL and the body)

Both return parsed JSON shaped `{ success: true, ... }` or `{ success: false, error }` — never throw. API actions in use: `loginPin`, `dashboard`, `getLokace`, `getNaradi`, `getNaradiById`, `scanCode`, `getHistorie`, `prevod` (single transfer), `hromadnyPrevod` (batch transfer). The Apps Script backend itself is not in this repository.

**Navigation:** each screen is a `<div class="page" id="page-<name>">`; `showPage(name)` toggles the `.active` class, starts/stops the camera scanners, and lazily loads page data. Pages: `search` (default after login), `dashboard`, `scanner`, `transfer` (batch), `history`. Tool detail is a bottom-sheet overlay (`#detailOverlay`).

**Roles and the transit model:** `currentUser.rola` is `admin`, `stavbyvedouci`, or `skladník`. Admins transfer tools directly to any location. Non-admins must go through transit: "Vyskladnit" moves tools *to* transit, "Naskladnit" moves them *from* transit to a destination. The transit location is the magic string constant `TRANZIT_ID` ("V tranzitu mezi sklady"), which **must exactly match the value used in the Google Sheet** (column M); `isInTransit()` compares against it. Transfers optionally attach GPS coordinates (`getGPS()` — failures are silently ignored).

**Service worker (`sw.js`):** precaches the app shell, uses network-first with cache fallback, and bypasses caching entirely for `script.google.com` requests. When changing any cached asset, **bump `CACHE_NAME`** (`naradi-v2` → `naradi-v3`) so old caches are purged on activate.

## Conventions

- All user-facing text is Czech; domain identifiers also use Czech terms (`lokace` = location, `prevod` = transfer, `naradi` = tool, `prevedl` = transferred-by). Keep new code consistent with this.
- UI is built with template literals injected via `innerHTML`. Always pass user/sheet-derived strings through `escHtml()` when interpolating.
- User feedback goes through `showToast(msg, isError)`.
- Two independent scanner instances exist (`scanner` for the scan page, `transferScanner` for batch transfer); always stop a scanner when its page is left — `showPage()` handles this, so route page changes through it.
- The app targets mobile (bottom nav, safe-area insets, portrait orientation); test layout changes at narrow viewport widths.
