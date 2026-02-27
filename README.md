# Trailguide

**Tutorials as code** — Git-native product tours for any web app.

[![npm](https://img.shields.io/npm/v/@trailguide/core)](https://www.npmjs.com/package/@trailguide/core)
[![npm downloads](https://img.shields.io/npm/dm/@trailguide/core)](https://www.npmjs.com/package/@trailguide/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://app.gettrailguide.com/demo) · [Website](https://gettrailguide.com) · [Documentation](https://docs.gettrailguide.com)

![Trailguide Pro — record a trail and sync to GitHub or GitLab in seconds](https://raw.githubusercontent.com/hellotrailguide/trailguide/main/.github/assets/QuickStart.gif)
*↑ [Trailguide Pro](https://app.gettrailguide.com) — visual editor, Git sync, and analytics for your whole team*

---

## Why Trailguide?

Most product tour tools charge per user, lock your content in their dashboard, and disappear when they shut down.

Trailguide is different:

- **No vendor lock-in** — Tours are JSON files in your repo. You own them forever.
- **No per-user pricing** — The runtime is free. Show tours to a million users without paying a cent.
- **Git-native** — Review tour changes in PRs. Roll back mistakes. Branch for experiments.
- **Framework-agnostic** — Works with React, Vue, Svelte, vanilla JS, or anything that runs in a browser.
- **Keyboard navigation built in** — Arrow keys, Enter, Escape. Works out of the box.

Your UI already knows how to teach itself. Trailguide just makes it easy.

---

## Free Forever

Trailguide runtime and recorder are **open-source and free forever** under the MIT license.

You can:
- Create unlimited trails
- Show them to unlimited users
- Store and version them in your repo
- Self-host everything

No accounts. No tracking. No hosted dependencies.

The free path is a **developer tool** — someone on your team writes or records the JSON, commits it, and deploys it. If you want non-developers to create and manage tours, built-in analytics, and one-click Git sync, that's what [Pro](#trailguide-pro) is for.

---

## Who This Is For

**Good fit:**
- Dev teams who want onboarding without a SaaS dependency
- Products that ship behind firewalls or on-prem
- OSS maintainers documenting complex UIs
- Teams tired of per-seat pricing
- Teams who want tours in version control, not a vendor dashboard

**Not a fit:**
- Teams with no engineering resources — the initial install requires a developer
- Teams who need marketing to deploy tours with zero engineer involvement

---

## How It Works

Two paths — pick the one that fits your team:

**Free — developer workflow**
```
1. Install the runtime in your app
2. Write trail JSON by hand, or use the recorder to capture steps by clicking
3. Commit the JSON to your repo
4. Load it with <Trailguide />
```

**Pro — whole team workflow**
```
1. A developer installs the runtime once
2. Anyone on your team opens the editor, enters your app URL, and hits Record
3. Click through your app — every click becomes a step, no code required
4. Edit, reorder, and preview in the visual editor
5. Hit Sync — trails push to GitHub or GitLab as a PR/MR
6. Engineers review and merge. Done.
```

---

## Quick Start

### React

```bash
npm install @trailguide/runtime @trailguide/core
```

```tsx
import { Trailguide } from '@trailguide/runtime';
import '@trailguide/core/dist/style.css';
import welcomeTour from './tours/welcome.json';

function App() {
  const [showTour, setShowTour] = useState(true);

  return (
    <>
      <YourApp />
      {showTour && (
        <Trailguide
          trail={welcomeTour}
          onComplete={() => setShowTour(false)}
        />
      )}
    </>
  );
}
```

### Vanilla JS

```bash
npm install @trailguide/core
```

```js
import { start } from '@trailguide/core';
import '@trailguide/core/dist/style.css';

fetch('/tours/welcome.json')
  .then(res => res.json())
  .then(trail => start(trail));
```

### CDN (No Build Step)

```html
<link rel="stylesheet" href="https://unpkg.com/@trailguide/core/dist/style.css">
<script src="https://unpkg.com/@trailguide/core/dist/trailguide.umd.js"></script>
<script>
  fetch('/tours/welcome.json')
    .then(r => r.json())
    .then(trail => Trailguide.start(trail));
</script>
```

---

## Trail Format

Tours are JSON files. Simple, readable, diffable.

```json
{
  "id": "welcome",
  "title": "Welcome Tour",
  "version": "1.0.0",
  "steps": [
    {
      "id": "step-1",
      "target": "[data-trail-id='create-btn']",
      "placement": "bottom",
      "title": "Create something new",
      "content": "Click here to get started."
    }
  ]
}
```

### Step Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `target` | string | Yes | CSS selector for the target element |
| `placement` | `top` \| `bottom` \| `left` \| `right` | Yes | Tooltip position |
| `title` | string | Yes | Step headline |
| `content` | string | Yes | Step description |

### Best Practice: Stable Selectors

Use `data-trail-id` attributes for selectors that won't break when classes change:

```html
<button data-trail-id="create-btn">Create</button>
```

```json
{ "target": "[data-trail-id='create-btn']" }
```

---

## Theming

Trailguide ships with CSS custom properties so tooltips match your app, not ours. Override a few variables and you're done — no class hunting, no `!important`.

### Quick customization

```css
:root {
  --trailguide-accent: #6366f1;        /* your brand color */
  --trailguide-accent-hover: #4f46e5;
  --trailguide-radius: 12px;           /* rounder corners */
}
```

### Full variable reference

| Variable | Default (light) | Description |
|----------|----------------|-------------|
| `--trailguide-accent` | `#1a91a2` | Primary/brand color for buttons and highlights |
| `--trailguide-accent-hover` | `#158292` | Hover state for primary buttons |
| `--trailguide-bg` | `#ffffff` | Tooltip background |
| `--trailguide-text` | `#374151` | Body text color |
| `--trailguide-title` | `#111827` | Step title color |
| `--trailguide-text-muted` | `#6b7280` | Progress counter, close button |
| `--trailguide-border` | `#e5e7eb` | Header/footer dividers |
| `--trailguide-btn-bg` | `#ffffff` | Secondary button background |
| `--trailguide-btn-text` | `#374151` | Secondary button text |
| `--trailguide-btn-border` | `#d1d5db` | Secondary button border |
| `--trailguide-btn-hover` | `#f9fafb` | Secondary button hover |
| `--trailguide-radius` | `8px` | Border radius for tooltips and buttons |
| `--trailguide-shadow` | `0 10px 25px rgba(0,0,0,0.15)` | Tooltip box shadow |
| `--trailguide-overlay` | `rgba(0,0,0,0.5)` | Backdrop overlay color |
| `--trailguide-max-width` | `320px` | Tooltip max width |
| `--trailguide-min-width` | `280px` | Tooltip min width |
| `--trailguide-font` | `system-ui, ...` | Font family |

### Dark mode

Dark mode is automatic when `.dark` is on your `<html>` or `<body>` — the defaults flip to dark backgrounds and light text. You can also override the dark values directly:

```css
.dark {
  --trailguide-bg: #1a1a2e;
  --trailguide-accent: #818cf8;
}
```

### Example: brand-matched tooltip

```css
/* Stripe-style purple theme */
:root {
  --trailguide-accent: #635bff;
  --trailguide-accent-hover: #5147e5;
  --trailguide-radius: 12px;
  --trailguide-shadow: 0 12px 40px rgba(99, 91, 255, 0.15);
}

/* Vercel-style minimal dark theme */
.dark {
  --trailguide-bg: #111111;
  --trailguide-text: #a1a1a1;
  --trailguide-title: #ededed;
  --trailguide-border: #333333;
  --trailguide-accent: #0070f3;
  --trailguide-accent-hover: #0060df;
  --trailguide-radius: 6px;
}
```

No ejecting, no custom render functions, no build step — just CSS.

---

## Using the Recorder

The recorder is a **developer capture tool** for the free workflow. You add it directly to your React app — it renders as a floating panel that only appears in development, never in production. Use it to click through your app and capture steps, then export the JSON and commit it to your repo. When you need to create or update a tour later, the recorder is already there waiting in your dev environment.

**Try it before installing** — visit [app.gettrailguide.com/demo](https://app.gettrailguide.com/demo) to see the recorder in action without writing a line of code.

```bash
npm install @trailguide/recorder
```

```tsx
import { RecorderOverlay, useRecorder } from '@trailguide/recorder';

function App() {
  const recorder = useRecorder({ trailId: 'my-trail' });

  return (
    <>
      <YourApp />
      {process.env.NEXT_PUBLIC_TRAILGUIDE_RECORDER === 'true' && (
        <RecorderOverlay recorder={recorder} />
      )}
    </>
  );
}
```

Gate it behind an env variable so it only appears when you explicitly want to record — not every time you run your dev server. Add it to your `.env.local` when you need it, leave it out the rest of the time. It never ships to production regardless.

```bash
# .env.local — only add this when you want to record
NEXT_PUBLIC_TRAILGUIDE_RECORDER=true
```

For non-Next.js apps, use whatever env prefix your framework requires (e.g. `VITE_TRAILGUIDE_RECORDER` for Vite).

### Recording Flow

1. Run your app locally — the recorder panel appears automatically
2. Click **Record** in the overlay
3. Click any element on the page to capture it as a step
4. Fill in what the user should do and know
5. Repeat for each step
6. Click **Save Trail** to download the JSON
7. Commit the JSON to your repo and load it with `<Trailguide />`

The recorder generates smart selectors, preferring stable attributes (`id`, `data-trail-id`, `aria-label`) over fragile paths.

> **Note:** Because the recorder runs inside your local dev environment, creating and updating tours requires someone with access to the codebase running the app locally. If you need non-developers to record and manage tours, or want to record against any URL without touching the codebase, that's what [Trailguide Pro](#trailguide-pro) is for.

---

## Validating Trails

Catch broken selectors before your users do:

```ts
import { validateTrail, logValidationResults } from '@trailguide/core';
import myTrail from './tours/welcome.json';

const result = validateTrail(myTrail);

if (!result.valid) {
  logValidationResults(result);
}
```

Validation checks:
- Missing target elements
- Hidden elements
- Unstable selectors (warns to use `data-trail-id`)

---

## Packages

| Package | Description |
|---------|-------------|
| [`@trailguide/core`](https://www.npmjs.com/package/@trailguide/core) | Vanilla JS runtime — works with any framework |
| [`@trailguide/runtime`](https://www.npmjs.com/package/@trailguide/runtime) | React hooks and components |
| [`@trailguide/recorder`](https://www.npmjs.com/package/@trailguide/recorder) | Capture steps by clicking elements |

All packages are MIT licensed and free forever.

---

## API Reference

### Core

```ts
import { start, stop, next, prev, skip, validateTrail } from '@trailguide/core';

start(trail, options)    // Start a tour
stop()                   // Stop the current tour
next()                   // Go to next step
prev()                   // Go to previous step
skip()                   // Skip/close the tour
validateTrail(trail)     // Check if selectors exist
```

### React

```tsx
import { Trailguide, useTrail } from '@trailguide/runtime';

// Component approach
<Trailguide
  trail={trail}
  onComplete={() => {}}
  onSkip={() => {}}
  onStepChange={(step, index) => {}}
/>

// Hook approach
const { next, prev, skip, goToStep, currentStep, isActive } = useTrail({ trail });
```

See [docs.gettrailguide.com](https://docs.gettrailguide.com) for complete documentation.

---

## Live Demo

Try it now: **[app.gettrailguide.com/demo](https://app.gettrailguide.com/demo)**

Or run locally:

```bash
git clone https://github.com/hellotrailguide/trailguide.git
cd trailguide
pnpm install
pnpm dev
```

---

## Roadmap

### Free & Open Source
- [x] Core runtime (works in React, Vue, Svelte, vanilla JS — any framework)
- [x] React hooks and components (`@trailguide/runtime`)
- [x] Recorder (`@trailguide/recorder`)
- [x] Trail validation
- [ ] Conditional steps
- [ ] Vue convenience wrapper (`@trailguide/vue`) — Vue composables on top of core, which already works in Vue today
- [ ] Svelte convenience wrapper (`@trailguide/svelte`) — Svelte stores/actions on top of core, which already works in Svelte today

### Pro
- [x] Visual Editor (point-and-click, drag-and-drop, rich text, live preview)
- [x] Trail & screenshot storage — every trail is saved with screenshots so your team can open and modify them anytime
- [x] Inline flow recording (Chrome extension)
- [x] Trail playback preview
- [x] Selector quality indicators
- [x] Selector auto-repair
- [x] Analytics dashboard (completion rates, drop-off funnel, time per step)
- [x] Git Sync — push trails as PRs/MRs to GitHub or GitLab
- [ ] A/B testing for trails
- [ ] Team workspaces with role-based access

---

## Trailguide Pro

Your app ships every week. Your tours need to keep up. Pro is how your whole team — product, marketing, customer success — stays on top of it without filing an engineering ticket every time copy changes.

A developer installs the runtime once. After that, anyone on your team can open the editor, record a new trail, edit an existing one, and push it to GitHub or GitLab as a pull request. Engineers review and merge. No one has to hand-edit JSON.

### Your trails, stored with screenshots

Every trail you build in the Pro Editor is saved to your account with a screenshot of each step. When your UI changes, you'll see exactly what shifted — open any trail, update the affected steps, and push a fix before users hit a broken tour.

### Visual Editor
- **Point-and-click recording** — open your app in the editor, click through it, every click becomes a step
- **Rich text editing** — format step content without touching JSON
- **Drag-and-drop step ordering** — reorganize flows instantly
- **Live preview** — step through the full trail inside the editor before publishing
- **JSON import/export** — everything is still plain JSON you own

### Analytics

See exactly where users drop off, how long they spend on each step, and which tours actually get completed. Completion funnels, time-per-step breakdowns, daily and weekly trends. This is data companies pay hundreds of dollars a month for in standalone analytics tools — it's built into Pro.

### Git Sync — GitHub & GitLab
- Push trails as PRs (GitHub) or MRs (GitLab) directly from the editor
- Choose any branch — push to `develop`, `main`, or a feature branch
- Review changes in code like any other diff
- Full version history, rollbacks, branching — everything Git already gives you

### Selector Quality & Reliability
- **Selector quality indicators** — every captured selector is graded Stable, Moderate, or Fragile with actionable hints
- **Selector auto-repair** — when DOM changes break a selector, the editor suggests fixes with confidence scores

### Pricing

Appcues starts at $249/month. Pendo won't show you pricing until you talk to sales. Trailguide Pro is **$29/month** — one flat price, unlimited trails, unlimited users.

**The Pro Editor is optional.** Everything it produces is still plain JSON in your repo. No lock-in, ever.

[Try Pro Free](https://app.gettrailguide.com) — 14 days free, no credit card required.

---

## License

**MIT** — free for personal and commercial use.

Trailguide is and will always be open source. Use it, fork it, build on it.

Made by [Branden Langhals](https://github.com/brandenlanghals)
