# Trailguide

**Tutorials as code** — Git-native product tours for any web app.

[![npm](https://img.shields.io/npm/v/@trailguide/core)](https://www.npmjs.com/package/@trailguide/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://trailguidedemo.vercel.app) · [Website](https://gettrailguide.vercel.app) · [Documentation](docs/)

---

## Why Trailguide?

Most product tour tools charge per user, lock your content in their dashboard, and disappear when they shut down.

Trailguide is different:

- **No vendor lock-in** — Tours are JSON files in your repo. You own them forever.
- **No per-user pricing** — The runtime is free. Show tours to a million users without paying a cent.
- **Git-native** — Review tour changes in PRs. Roll back mistakes. Branch for experiments.
- **Framework-agnostic** — Works with React, Vue, Svelte, vanilla JS, or anything that runs in a browser.

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

The optional [Pro Editor](#trailguide-pro-coming-soon) adds convenience features for teams — but the core tooling will always be free.

---

## Who This Is For

**Good fit:**
- Dev teams who want onboarding without a SaaS dependency
- Products that ship behind firewalls or on-prem
- OSS maintainers documenting complex UIs
- Teams tired of per-seat pricing
- Anyone who wants to version control their tours

**Not a fit:**
- No-code teams that never touch Git
- Marketing-led tours managed by non-technical users

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
| [`@trailguide/core`](packages/core) | Vanilla JS runtime — works with any framework |
| [`@trailguide/runtime`](packages/runtime) | React hooks and components |
| [`@trailguide/recorder`](packages/recorder) | Capture steps by clicking elements |

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

See [docs/api-reference.md](docs/api-reference.md) for complete documentation.

---

## Live Demo

Try it now: **[trailguidedemo.vercel.app](https://trailguidedemo.vercel.app)**

Or run locally:

```bash
git clone https://github.com/brandenlanghals/trailguide.git
cd trailguide
pnpm install
pnpm dev
```

---

## Roadmap

### Free & Open Source
- [x] Core runtime (any framework)
- [x] React wrapper
- [x] Recorder
- [x] Trail validation
- [ ] Vue wrapper
- [ ] Svelte wrapper
- [ ] Conditional steps

---

## Trailguide Pro

For teams who want **speed, safety, and insights** — without changing how trails are stored or shipped.

### Visual Editor
- Drag-and-drop step ordering
- Live preview
- No JSON hand-editing required

### Analytics Dashboard
- Completion rates
- Drop-off by step (funnel view)
- Time per step
- Daily/weekly trends

### GitHub Sync
- Push trails as PRs
- Review changes in code
- Full version history

### Reliability
- Selector auto-repair when DOM changes
- Warnings when trails break

**The Pro Editor is optional.** Everything it produces is still just JSON files in your repo. No lock-in, ever.

[Try Pro Free](https://app.gettrailguide.com) — 14 days of Pro, no credit card.

---

## License

**MIT** — free for personal and commercial use.

Trailguide is and will always be open source. Use it, fork it, build on it.

Made by [Branden Langhals](https://github.com/brandenlanghals)
