# Trailguide

**Tutorials as code** — Git-native product tours for any web app.

[![npm](https://img.shields.io/npm/v/@trailguide/core)](https://www.npmjs.com/package/@trailguide/core)
[![npm downloads](https://img.shields.io/npm/dm/@trailguide/core)](https://www.npmjs.com/package/@trailguide/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://app.gettrailguide.com/demo) · [Website](https://gettrailguide.com) · [Documentation](https://docs.gettrailguide.com)

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

The optional [Pro Editor](#trailguide-pro) adds convenience features for teams — but the core tooling will always be free.

---

## Who This Is For

**Good fit:**
- Dev teams who want onboarding without a SaaS dependency
- Product managers who want to ship tours without waiting on engineering sprints
- Customer success teams building walkthroughs for complex features
- Products that ship behind firewalls or on-prem
- OSS maintainers documenting complex UIs
- Teams tired of per-seat pricing

**Not a fit:**
- Teams with no engineering resources — the initial install requires a developer
- Teams who need marketing to deploy tours with zero engineer review

---

## How It Works

```
1. Run your app locally
2. Enable the recorder
3. Click through your UI to capture steps
4. Export the trail as a JSON file
5. Commit it to your repo
6. Load it in production with <Trailguide />
```

That's it. Edit the JSON, reload, see changes. No build step. No deploy. No dashboard.

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

The recorder is a **developer capture tool** — not a full visual editor. It generates clean, reviewable JSON that you own.

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
      {process.env.NODE_ENV === 'development' && (
        <RecorderOverlay recorder={recorder} />
      )}
    </>
  );
}
```

### Recording Flow

1. Click **Record** in the overlay panel
2. Click any element on the page to capture it
3. Fill in what the user should do and know
4. Repeat for each step
5. Click **Save Trail** to download the JSON

The recorder generates smart selectors, preferring stable attributes (`id`, `data-trail-id`, `aria-label`) over fragile paths.

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
- [x] Recorder
- [x] Trail validation
- [ ] Conditional steps
- [ ] Vue convenience wrapper
- [ ] Svelte convenience wrapper

### Pro
- [x] Visual Editor (point-and-click, drag-and-drop, rich text, live preview)
- [x] Inline flow recording
- [x] Trail playback preview
- [x] Selector quality indicators
- [x] Selector auto-repair
- [x] Analytics dashboard (completion rates, drop-off funnel, time per step)
- [x] GitHub Sync (push trails as PRs)
- [ ] A/B testing for trails
- [ ] Team workspaces with role-based access

---

## Trailguide Pro

For teams who want **speed, safety, and insights** — without changing how trails are stored or shipped.

The workflow: a developer installs the runtime once. After that, product managers and customer success teams create and update tours in the visual editor — no code required. Every step is stored with a screenshot so your team can see exactly what changed when your UI evolves. Update copy, fix broken steps, check analytics, push to GitHub as a PR. Engineers review, merge, done.

### Visual Editor
- **Screenshot storage** — every step is saved with a screenshot of your UI. When your app changes, you'll see exactly what shifted and can fix it before users notice
- **Update copy without a deploy** — change step titles, reword instructions, fix typos directly in the editor. No PR, no deploy, no engineering ticket
- **Point-and-click element selection** — click any element on your site to capture it as a step, no CSS selectors to write
- **Inline flow recording** — hit Record, click through your app, and every click becomes a trail step in real time
- **Trail playback preview** — step through the full trail inside the editor before publishing
- **Rich text editing** — format step titles and content with a friendly editor, no JSON hand-editing
- **Drag-and-drop step ordering** — reorganize your flow instantly
- **JSON import/export** — everything exports to clean JSON you own

### Selector Quality & Reliability
- **Selector quality indicators** — every captured selector is graded as Stable, Moderate, or Fragile with actionable hints (e.g., "Add a `data-trail-id` for stability")
- **Selector auto-repair** — when DOM changes break a selector, the editor suggests fixes with confidence scores
- **Warnings when trails break** — catch broken selectors before your users do

### Analytics Dashboard
- Completion rates
- Drop-off by step (funnel view)
- Time per step
- Daily/weekly trends

### GitHub Sync
- Push trails as PRs directly from the editor
- Review changes in code
- Full version history

**The Pro Editor is optional.** Everything it produces is still just JSON files in your repo. No lock-in, ever.

[Try Pro Free](https://app.gettrailguide.com) — 14 days free, then $29/month. No credit card required to start.

---

## License

**MIT** — free for personal and commercial use.

Trailguide is and will always be open source. Use it, fork it, build on it.

Made by [Branden Langhals](https://github.com/brandenlanghals)
