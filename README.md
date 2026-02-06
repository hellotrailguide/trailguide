# Trailguide

**Tutorials as code** — Git-native, editable UI walkthroughs for any web app.

[![npm](https://img.shields.io/npm/v/@trailguide/core)](https://www.npmjs.com/package/@trailguide/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[Live Demo](https://trailguidedemo.vercel.app) · [Documentation](docs/) · [Website](https://gettrailguide.vercel.app)

---

## What is Trailguide?

Trailguide lets you create interactive product tours that live in your codebase as JSON files. Edit a tour, commit the change, and your users see the update—no separate dashboard needed.

- **Framework-agnostic** — Works with React, Vue, Svelte, vanilla JS, or any web app
- **Version controlled** — Trail changes show up in PRs, get reviewed, roll back easily
- **No vendor lock-in** — Your tours are JSON files in your repo
- **No per-user pricing** — Free runtime, unlimited users

## Quick Start

### Any Framework (Vanilla JS)

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

Tours are defined as JSON files. See [docs/trail-format.md](docs/trail-format.md) for the complete schema.

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

### Step Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique step identifier |
| `target` | string | Yes | CSS selector for the target element |
| `placement` | `top` \| `bottom` \| `left` \| `right` | Yes | Tooltip position |
| `title` | string | Yes | Step headline |
| `content` | string | Yes | Step description |

### Best Practice: Use `data-trail-id` for Stable Selectors

```html
<!-- Recommended: stable, won't break if classes change -->
<button data-trail-id="create-btn">Create</button>

<!-- Avoid: fragile, breaks if class names change -->
<button class="btn-primary-v2">Create</button>
```

Then target it in your trail:
```json
{ "target": "[data-trail-id='create-btn']" }
```

---

## Demo App

The [demo app](examples/demo-app) shows Trailguide in action with:

- Interactive dashboard with buttons and stats panel
- **Play Tour** button to start the tour
- **Recorder overlay** to capture new steps
- Live JSON reload — edit `public/tours/welcome.json` and click "Restart Tour"

Try it live: **[demo-app-steel-phi.vercel.app](https://demo-app-steel-phi.vercel.app)**

Run locally:
```bash
git clone https://github.com/brandenlanghals/trailguide.git
cd trailguide
pnpm install
pnpm dev
```

---

## Using the Recorder

The recorder lets you capture tour steps by clicking on elements.

### Enable Recorder in Demo App

1. Run `pnpm dev`
2. Click **"Show Recorder"** button
3. Click **"Record"** to start
4. Click any element on the page to capture it
5. Fill in the step title, content, and placement
6. Click **"Export JSON"** to download your trail

### Use in Your Own App

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

---

## Validating Trails

Use `validateTrail()` to check if all selectors exist before showing tours to users:

```ts
import { validateTrail, logValidationResults } from '@trailguide/core';
import myTrail from './tours/welcome.json';

const result = validateTrail(myTrail);

if (!result.valid) {
  logValidationResults(result); // Logs errors to console
}
```

This catches:
- Missing target elements
- Hidden elements
- Potentially unstable selectors (warns to use `data-trail-id`)

---

## Packages

| Package | Description | |
|---------|-------------|---|
| [`@trailguide/core`](packages/core) | Vanilla JS runtime — works with any framework | [![npm](https://img.shields.io/npm/v/@trailguide/core)](https://www.npmjs.com/package/@trailguide/core) |
| [`@trailguide/runtime`](packages/runtime) | React hooks and components | [![npm](https://img.shields.io/npm/v/@trailguide/runtime)](https://www.npmjs.com/package/@trailguide/runtime) |
| [`@trailguide/recorder`](packages/recorder) | Capture steps by clicking | [![npm](https://img.shields.io/npm/v/@trailguide/recorder)](https://www.npmjs.com/package/@trailguide/recorder) |

---

## Roadmap

### Free & Open Source
- [x] Core runtime (any framework)
- [x] React wrapper
- [x] Recorder
- [x] Trail validation
- [ ] Vue wrapper
- [ ] Svelte wrapper

### Pro Editor (Coming Soon)
- [ ] Visual tour builder
- [ ] Click-to-record in browser
- [ ] GitHub sync
- [ ] Selector auto-repair
- [ ] Team collaboration

### Enterprise Add-ons
- [ ] Analytics & completion tracking
- [ ] Conditional branching
- [ ] A/B testing for tours
- [ ] SSO & audit logs

---

## API Reference

See [docs/api-reference.md](docs/api-reference.md) for complete API documentation.

### Core

```ts
import { start, stop, validateTrail } from '@trailguide/core';

start(trail, options)    // Start a tour
stop()                   // Stop the current tour
validateTrail(trail)     // Check if selectors exist
```

### React

```tsx
import { Trailguide, useTrail } from '@trailguide/runtime';

<Trailguide trail={trail} onComplete={() => {}} />

const { next, prev, skip, currentStep } = useTrail({ trail });
```

---

## License

MIT © [Branden Langhals](https://github.com/brandenlanghals)
