# Revealr

**Tells you exactly what you're agreeing to — and what it might cost you — before you click "Continue."**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-6b4fd8)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict%2C%20no%20any-3178c6)](tsconfig.json)

Revealr is a consumer-protection browser extension, not a UX-education tool — it doesn't explain psychology or grade sites as "good" or "bad." It finds hidden financial and consent commitments on the page you're on right now (a trial that silently converts to a paid subscription, an insurance add-on that got pre-checked at checkout) and gives you one click to get out of them.

This is a real, working extension, not a mockup. The detectors are heuristics deliberately tuned for precision over recall, and the Firebase backend is intentionally left open for easy setup — see [Firebase setup](#firebase-setup-optional) for the tradeoffs.

## Contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Privacy, by construction](#privacy-by-construction)
- [Firebase setup (optional)](#firebase-setup-optional)
- [What it detects (and what it deliberately doesn't)](#what-it-detects-and-what-it-deliberately-doesnt)
- [Project structure](#project-structure)
- [Example walkthrough](#example-walkthrough)
- [Known limitations](#known-limitations)
- [Contributing](#contributing)
- [License](#license)

## What it does

1. **Subscription Trap Shield** — finds free trials that convert to paid, and recurring-billing terms wherever they're disclosed, and surfaces the actual number: *"Free trial ends in 7 days. Then $9.99/month, renews monthly."* No hunting through fine print.
2. **Checkout Guardian** — finds pre-checked add-ons (insurance, warranties, "protection plans", donations) at checkout and shows the dollar impact directly: *"Protection Plan +$12.99 — already selected."*
3. **Find My Exit** — one click locates and scrolls to the real cancel-subscription link, the real reject-cookies button, account-deletion, or privacy controls, however buried they are. **Revealr never clicks, submits, or modifies anything — it only improves visibility.**

Revealr does not compute a "trust score" or rank sites as safe/unsafe. It reports facts — what was found, and what it costs — and leaves the judgment to you.

## Tech stack

- **Manifest V3** Chrome extension, built with [`@crxjs/vite-plugin`](https://crxjs.dev/)
- **React 19 + TypeScript** (strict, `noUncheckedIndexedAccess`, no `any`)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Vite 8**
- **OpenAI** Chat Completions API (JSON mode), used narrowly for structured *extraction* (never interpretation), behind a swappable `AIService` abstraction
- **Firebase Firestore** (REST API only — no `firebase-js-sdk`, so it works from an MV3 service worker) as the Registry backend

## Getting started

```bash
npm install
npm run build
```

Then load the extension:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder produced by `npm run build`

No environment variables are required to try it. Visit a site with a free trial or a checkout flow; the toolbar badge and the floating button (bottom-right of the page) show what was found. Click "Find My Exit" from either the popup or the drawer to locate the real cancel link on any page.

### Development mode

```bash
npm run dev
```

`@crxjs/vite-plugin` gives you HMR for the popup/dashboard and fast rebuilds for the content script/background worker — reload the extension from `chrome://extensions` after the first build, then most changes hot-reload automatically.

### Other scripts

```bash
npm run typecheck      # tsc -b, no emit
npm run lint           # eslint
npm run generate-icons # regenerates public/icons/*.png (pure-Node PNG encoder, no deps)
```

## Environment variables

Copy `.env.example` to `.env` if you want either of these — **both are optional**, the extension works fully without them:

| Variable | Required? | Purpose |
|---|---|---|
| `VITE_OPENAI_API_KEY` | No | Baked in at build time as a fallback default OpenAI key. End users can also paste their own key into the popup's **Settings** tab (stored in `chrome.storage.local`, never synced) — that always takes priority. Without any key, every commitment still shows a locally-computed summary (regex-extracted amount/frequency) — AI only adds richer fields like the trial-end date and cancellation requirement. |
| `VITE_FIREBASE_PROJECT_ID` | No | Firestore project ID for the Registry dashboard. Without it, the dashboard displays built-in placeholder data so the layout isn't empty. |

## Privacy, by construction

- Detection runs **entirely locally** — DOM inspection, regex extraction, computed-style checks. No page content leaves your browser for this step.
- The AI call is **opt-in per commitment**: it only fires when you open a commitment's detail view (or if you turn on "Auto-extract details" in Settings), and it sends a small evidence snippet — not the page, not your browsing history.
- The Registry upload is **off by default** and, when on, sends only domain + commitment types + a count — no URLs, no page content, no PII.

## Firebase setup (optional)

Revealr talks to the Firestore REST API directly with no auth, so it relies on Firestore being in permissive test-mode rules — do not point this at a project with real user data.

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** → start in **test mode**
3. Set rules to allow anonymous read/write to the `registry` collection only:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /registry/{entryId} {
         allow read: if true;
         allow create: if request.resource.data.keys().hasOnly(['domain', 'patternTypes', 'commitmentCount', 'timestamp'])
           && request.resource.data.domain is string
           && request.resource.data.commitmentCount is int
           && request.resource.data.commitmentCount >= 0;
         allow update, delete: if false;
       }
     }
   }
   ```

4. Copy the **Project ID** (Project settings → General) into `VITE_FIREBASE_PROJECT_ID` in `.env`
5. `npm run build` again, reload the unpacked extension
6. Turn on **Contribute to Registry** in the popup's Settings tab on a couple of sites, then open the dashboard (popup → "Open Revealr Dashboard")

### Firestore schema

Single collection, `registry`, one document per opted-in scan (throttled to at most one upload per domain per 5 minutes):

```ts
// collection: registry
{
  domain: string           // e.g. "example.com" — no full URLs, no PII
  patternTypes: string[]   // subset of ["subscription_commitment", "checkout_addon"]
  commitmentCount: number  // how many hidden commitments were found on that scan
  timestamp: number        // Date.now(), ms since epoch
}
```

The dashboard aggregates this client-side: sites ranked by total commitments found, a 14-day found-per-day trend, and commitment-type frequency across the whole registry. No score or good/bad ranking is computed anywhere.

## What it detects (and what it deliberately doesn't)

| Detector | What it finds | Why it's kept high-confidence |
|---|---|---|
| **Subscription commitment** | Free trials that convert to paid, and recurring-billing terms, wherever disclosed — merges what used to be two separate heuristics. Fires on the *presence* of a real commitment, not on how well it's hidden; suppressed styling (tiny font/low contrast/low opacity) only raises confidence, never gates detection. | A local regex extracts amount + billing frequency immediately, no AI required for the headline number. |
| **Checkout add-on** | Pre-checked checkboxes whose label mentions insurance, warranty, protection plans, or donations. | Binary checkbox state — the least ambiguous signal in the extension. |
| **Find My Exit** (assist, not a "flag") | Reject-cookies button, cancel/unsubscribe link, account-deletion link, privacy controls — found and highlighted regardless of how they're styled. | Makes no claim about manipulation; it's a lookup, not a judgment. |

An earlier iteration also detected fake urgency countdowns, confirmshaming copy, misleading button hierarchy, and stacked modals. All were cut: none map to quantifiable financial or consent harm, and in practice several (urgency-timer resets, button-size hierarchy) fired on completely ordinary UI. A tool that cries wolf gets uninstalled, so precision was prioritized over feature count.

All thresholds live in `src/utils/constants.ts` — tune them without touching detector logic.

## Project structure

```
src/
  background/     Service worker: message router, tab state, badge, registry upload throttling
  content/         Content script: detection loop (DetectionStore), overlay/drawer/badge UI, mounted into a shadow DOM
    detectors/      subscriptionCommitment, checkoutAddon (patterns) + cookieButton, hiddenUnsubscribe, accountControls (Find My Exit assists)
    components/      Overlay, CommitmentOutline, AssistOutline, Drawer, CommitmentDetail, FloatingBadge
  popup/           Toolbar popup (also doubles as the Options page at #/options)
  dashboard/       Registry dashboard (separate extension page, opened in a new tab)
  services/        AIService (+ OpenAIProvider), FirebaseService, StorageService, messaging
  components/      Shared UI: Button, Toggle, CommitmentListItem, FindExitButton
  hooks/           useSettings, useDetectionStore, useCommitmentDetails
  types/           Shared TypeScript types (patterns, detection, messages, settings, registry)
  utils/           DOM inspection, color-contrast (WCAG), formatting, constants
```

### How it flows end-to-end

1. `DetectionStore` (content script) runs a debounced `MutationObserver`-driven scan through both pattern detectors, plus the three Find My Exit assist-finders. There's no polling/stateful detector — every commitment is decidable from a single DOM snapshot.
2. Each detector computes a **local, regex-derived summary** (amount, billing frequency) at detection time — this is what shows in the banner immediately, no network call involved.
3. The content script reports a serialized summary to the background worker (`CG_SCAN_RESULT`), which updates the toolbar badge (a count, not a color-coded risk level) and, if the user opted in, throttles an anonymous upload to Firestore.
4. Opening a commitment's detail view sends `CG_EXTRACT_COMMITMENT` to the background worker, which calls `AIService` (OpenAI, or the local-only fallback) to enrich the local summary with a trial-end date, renewal date, and cancellation requirement — kept off the content script so the request isn't subject to page CSP/CORS, and never leaves the user with nothing even if the AI call fails.

### Swapping the AI provider

`AIService` (`src/services/AIService.ts`) depends only on the `AIProvider` interface, whose one method is `extract()` — never `explain()` or `judge()`. `OpenAIProvider` is the only implementation today; to add another (Gemini, Anthropic, a local model, etc.), implement `AIProvider.extract()` and wire it into `createAIService()`.

## Example walkthrough

1. Open a free-trial signup page → Revealr shows *"Free trial ends in 7 days. Then $9.99/month, renews monthly."*
2. Open an e-commerce checkout with a pre-checked add-on → highlighted: *"+$12.99 warranty — already selected."*
3. Click **Find My Exit** → the page auto-scrolls to the real cancel-subscription or reject-all-cookies link.

## Known limitations

- Detectors are heuristic and deliberately tuned for precision over recall — they'll miss some real commitments rather than risk crying wolf on ordinary UI.
- The Firestore Registry uses open test-mode rules — don't point it at production data.
- No automated test suite yet — verified via `tsc`, `eslint`, and manual QA in Chrome.

## Contributing

Issues and PRs are welcome. Keep changes scoped, run `npm run typecheck && npm run lint` before opening a PR, and match the existing code style (no `any`, small components, comments only where the *why* isn't obvious from the code).

## License

[MIT](LICENSE)
