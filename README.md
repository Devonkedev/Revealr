# ChoiceGuard

**ChoiceGuard** is an AI-powered Chrome extension that detects manipulative UX ("dark patterns") in real time as you browse — fake urgency countdowns, confirmshaming, hidden "reject cookies" buttons, forced-continuity subscriptions, sneak-into-basket add-ons, misleading button hierarchy, buried unsubscribe links, and more.

It combines **deterministic DOM/heuristic detection** (no ML training required, runs entirely client-side) with an **LLM call** for plain-language explanation and classification, then surfaces everything through a live on-page overlay, a side drawer, a popup, and a "Registry" dashboard.

> Built as a hackathon-quality MVP. It's a real, working extension — not a mockup — but the detectors are heuristics, not a certified dark-pattern classifier, and the Firebase backend is an intentionally open demo backend (see [Firebase setup](#firebase-setup-optional)).

---

## Features

- **Dark pattern detection** — 9 heuristic detectors (see [Detected patterns](#detected-patterns)) built from DOM inspection, computed-style analysis (opacity, contrast, font size), and text heuristics. No page is sent anywhere for this step.
- **AI explanation** — when you click a flagged element, a small evidence snippet (visible text + trimmed HTML) is sent to OpenAI, which returns a structured classification: psychological bias exploited, why it's manipulative, a fair alternative, and likely business impact. Falls back to a built-in template explanation if no API key is configured.
- **Live overlay** — red/amber outlines drawn directly on the page over flagged elements, with hover tooltips and click-to-explain.
- **Choice Assist** — highlights the *true* reject-cookies button, buried unsubscribe links, and recurring-billing fine print in green so you can find them. **ChoiceGuard never clicks, submits, or modifies anything on the page** — it only improves visibility.
- **Transparency Score** — a 0–100 score per page/site, with a risk level (Low/Medium/High) and a breakdown of which patterns were found.
- **Registry dashboard** — an opt-in, anonymous demo backend (Firebase Firestore) aggregating domain → pattern types → score across everyone who's opted in, visualized as top offending sites, a 14-day score trend, and the most common manipulation types. Ships with realistic mock data so the dashboard looks alive even with zero setup.

## Tech stack

- **Manifest V3** Chrome extension, built with [`@crxjs/vite-plugin`](https://crxjs.dev/)
- **React 19 + TypeScript** (strict, `noUncheckedIndexedAccess`, no `any`)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Vite 8**
- **OpenAI** Chat Completions API (JSON mode) for explanations, behind a swappable `AIService` abstraction
- **Firebase Firestore** (REST API only — no `firebase-js-sdk`, so it works from an MV3 service worker) as a demo backend

---

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

That's it — no environment variables are required to try the extension. Visit any site; the popup (toolbar icon) and the floating badge (bottom-right of the page) will show a live Transparency Score. Click the badge to open the side drawer.

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

---

## Environment variables

Copy `.env.example` to `.env` if you want either of these — **both are optional**, the extension works fully without them:

| Variable | Required? | Purpose |
|---|---|---|
| `VITE_OPENAI_API_KEY` | No | Baked in at build time as a fallback default OpenAI key. End users can also paste their own key into the popup's **Settings** tab (stored in `chrome.storage.local`, never synced) — that always takes priority. Without any key, AI explanations fall back to a built-in template. |
| `VITE_FIREBASE_PROJECT_ID` | No | Firestore project ID for the Registry dashboard. Without it, the dashboard shows bundled mock data. |

## Firebase setup (optional)

The Registry is a **demonstration backend only**. ChoiceGuard talks to the Firestore REST API directly with no auth, so it relies on Firestore being in permissive test-mode rules — do not point this at a project with real user data.

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore Database** → start in **test mode**
3. Set rules to allow anonymous read/write to the `registry` collection only:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /registry/{entryId} {
         allow read: if true;
         allow create: if request.resource.data.keys().hasOnly(['domain', 'patternTypes', 'score', 'timestamp'])
           && request.resource.data.domain is string
           && request.resource.data.score is int
           && request.resource.data.score >= 0 && request.resource.data.score <= 100;
         allow update, delete: if false;
       }
     }
   }
   ```

4. Copy the **Project ID** (Project settings → General) into `VITE_FIREBASE_PROJECT_ID` in `.env`
5. `npm run build` again, reload the unpacked extension
6. Turn on **Contribute to Registry** in the popup's Settings tab on a couple of sites, then open the dashboard (popup → "Open ChoiceGuard Dashboard")

### Firestore schema

Single collection, `registry`, one document per opted-in scan (throttled to at most one upload per domain per 5 minutes):

```ts
// collection: registry
{
  domain: string          // e.g. "example.com" — no full URLs, no PII
  patternTypes: string[]  // e.g. ["fake_urgency", "confirmshaming"]
  score: number           // 0–100 Transparency Score at time of scan
  timestamp: number       // Date.now(), ms since epoch
}
```

The dashboard aggregates this client-side: top sites by (lowest) average score, a 14-day score trend, and pattern-type frequency across the whole registry.

---

## Detected patterns

| Pattern | How it's detected |
|---|---|
| **Fake urgency** | Countdown-like text (`MM:SS` / `HH:MM:SS`) tracked across polls; a timer that resets instead of reaching zero is flagged with high confidence. A countdown paired with pressure language ("only 3 left", "hurry") is flagged at lower confidence even without a reset. |
| **Confirmshaming** | Opt-out controls matched against a phrase list and a "negation + emotionally loaded language" heuristic (e.g. "No thanks, I don't want to save money and stay unprotected"). |
| **Hidden reject cookies** | Cookie banners where the reject control scores far lower than accept on a prominence heuristic (background fill, font weight, size, opacity, contrast) — or fails WCAG contrast outright. |
| **Forced continuity** | A "free trial" CTA with nearby recurring-billing disclosure text that's suppressed (tiny font / low contrast / low opacity) relative to the CTA. |
| **Sneak into basket** | Pre-checked checkboxes/widgets whose label mentions insurance, warranty, protection plans, donations, etc. |
| **Misleading button hierarchy** | A binary choice (two sibling buttons) where one is rendered dramatically larger than the other. |
| **Hard-to-find unsubscribe** | Cancellation/unsubscribe links present in the DOM but styled to be easy to miss (tiny, faint, low contrast). |
| **Hidden recurring billing** | Billing-disclosure text ("auto-renew", "will be charged", "unless you cancel") rendered as fine print. |
| **Multiple modal layers** | Two or more simultaneously visible full-screen overlays (`position: fixed/absolute`, high z-index, large viewport coverage, or `role="dialog"`). |

All thresholds live in `src/utils/constants.ts` — tune them live for a demo without touching detector logic.

---

## Project structure

```
src/
  background/     Service worker: message router, tab state, badge, registry upload throttling
  content/         Content script: detection loop (DetectionStore), overlay/drawer/badge UI, mounted into a shadow DOM
    detectors/      One file per dark pattern + scoring
    components/      Overlay, PatternOutline, AssistOutline, Drawer, ExplanationPanel, FloatingBadge
  popup/           Toolbar popup (also doubles as the Options page at #/options)
  dashboard/       Registry dashboard (separate extension page, opened in a new tab)
  services/        AIService (+ OpenAIProvider), FirebaseService, StorageService, messaging
  components/      Shared UI: Button, Toggle, ScoreGauge, RiskBadge, PatternListItem
  hooks/           useSettings, useDetectionStore, useExplanation
  types/           Shared TypeScript types (patterns, detection, messages, settings, registry)
  utils/           DOM inspection, color-contrast (WCAG), formatting, constants
```

### How detection flows end-to-end

1. `DetectionStore` (content script) runs a debounced `MutationObserver`-driven scan through every stateless detector, plus a separate polling loop for the stateful countdown detector.
2. Results render immediately as overlay outlines — no network call needed for detection itself.
3. The content script reports a serialized summary to the background worker (`CG_SCAN_RESULT`), which updates the toolbar badge and, if the user opted in, throttles an anonymous upload to Firestore.
4. Clicking a flagged element sends `CG_EXPLAIN_PATTERN` to the background worker, which calls `AIService` (OpenAI, or the built-in fallback) and returns a structured explanation — kept off the content script so the request isn't subject to page CSP/CORS.

### Swapping the AI provider

`AIService` (`src/services/AIService.ts`) depends only on the `AIProvider` interface. `OpenAIProvider` is the only implementation today; to add another (Anthropic, a local model, etc.), implement `AIProvider.explain()` and wire it into `createAIService()`.

---

## Screenshots

The dashboard (`chrome-extension://<id>/dashboard.html`) renders fully populated with realistic mock data immediately after install — no Firebase setup needed — so it's a good first screenshot. For the in-page overlay/drawer, visit any site with a cookie banner or countdown timer, or use your own test page with a few of the patterns above; the floating badge and outlines appear within ~1 second.

---

## Limitations (by design, for a hackathon MVP)

- Detectors are heuristic, not a trained classifier — expect some false positives/negatives, especially on sites with unusual markup.
- The Firestore Registry uses open test-mode rules and is meant purely as a demo backend, not for production data.
- No automated test suite yet — verified via `tsc`, `eslint`, and manual QA in Chrome.

## License

MIT — this is a hackathon demo project.
