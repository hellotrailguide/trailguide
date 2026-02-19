# Getting Started with Trailguide

Trailguide works with any web app — React, Vue, Svelte, vanilla JS, or a plain HTML page. This guide covers all of them.

## The basics

Every Trailguide tour is a JSON file:

```json
// tours/welcome.json
{
  "id": "welcome",
  "title": "Welcome Tour",
  "version": "1.0.0",
  "steps": [
    {
      "id": "step-1",
      "target": "[data-trail-id='create-btn']",
      "placement": "bottom",
      "title": "Start here",
      "content": "Click to create your first project."
    },
    {
      "id": "step-2",
      "target": "#main-navigation",
      "placement": "right",
      "title": "Navigation",
      "content": "Use the sidebar to move between sections."
    }
  ]
}
```

You point each step at a CSS selector, and Trailguide handles highlighting, positioning, and navigation. The JSON lives in your repo — version it, review it in PRs, diff it like code.

---

## Pick your setup

### CDN (no build step)

The fastest way to try Trailguide. No npm, no bundler, no framework.

```html
<link rel="stylesheet" href="https://unpkg.com/@trailguide/core/dist/style.css">
<script src="https://unpkg.com/@trailguide/core/dist/trailguide.umd.js"></script>

<script>
  fetch('/tours/welcome.json')
    .then(res => res.json())
    .then(trail => Trailguide.start(trail, {
      onComplete: () => console.log('Tour done!'),
    }));
</script>
```

See the full example: [`examples/vanilla-demo/`](../examples/vanilla-demo/)

### Vanilla JS (with bundler)

```bash
npm install @trailguide/core
```

```js
import { start } from '@trailguide/core';
import '@trailguide/core/dist/style.css';

fetch('/tours/welcome.json')
  .then(res => res.json())
  .then(trail => start(trail, {
    onComplete: () => console.log('Tour done!'),
  }));
```

This works with Vite, Webpack, Parcel, esbuild — any bundler that handles ES modules.

### React

```bash
npm install @trailguide/runtime @trailguide/core
```

```tsx
import { useState } from 'react';
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
          onSkip={() => setShowTour(false)}
        />
      )}
    </>
  );
}
```

See the full example: [`examples/react/`](../examples/react/)

### Next.js

```bash
npm install @trailguide/runtime @trailguide/core
```

```tsx
// app/providers.tsx (or any client component)
'use client';

import { useState } from 'react';
import { Trailguide } from '@trailguide/runtime';
import '@trailguide/core/dist/style.css';

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [showTour, setShowTour] = useState(true);
  const tour = require('./tours/welcome.json');

  return (
    <>
      {children}
      {showTour && (
        <Trailguide
          trail={tour}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </>
  );
}
```

Put your tour JSON in `public/tours/` or import it directly. Mark the component `'use client'` since Trailguide uses browser APIs.

See the full example: [`examples/nextjs/`](../examples/nextjs/)

### Vue

```bash
npm install @trailguide/core
```

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { start } from '@trailguide/core'
import '@trailguide/core/dist/style.css'
import welcomeTour from './tours/welcome.json'

const tourActive = ref(false)

onMounted(() => {
  tourActive.value = true
  start(welcomeTour, {
    onComplete: () => { tourActive.value = false },
    onSkip: () => { tourActive.value = false },
  })
})
</script>

<template>
  <YourApp />
</template>
```

No Vue-specific wrapper needed — `@trailguide/core` works directly. It manages its own DOM.

See the full example: [`examples/vue/`](../examples/vue/)

### Svelte

```bash
npm install @trailguide/core
```

```svelte
<script>
  import { onMount } from 'svelte';
  import { start } from '@trailguide/core';
  import '@trailguide/core/dist/style.css';
  import welcomeTour from './tours/welcome.json';

  onMount(() => {
    start(welcomeTour, {
      onComplete: () => console.log('Tour done!'),
      onSkip: () => console.log('Tour skipped'),
    });
  });
</script>

<YourApp />
```

Same as Vue — `@trailguide/core` works directly, no wrapper needed.

See the full example: [`examples/svelte/`](../examples/svelte/)

---

## Theming

Trailguide tooltips are styled with CSS custom properties. Override a few variables and the tour matches your app.

### Match your brand

Add this to your global CSS:

```css
:root {
  --trailguide-accent: #6366f1;        /* your brand color */
  --trailguide-accent-hover: #4f46e5;
  --trailguide-radius: 12px;
}
```

That's it — every tooltip, button, and highlight updates automatically.

### All variables

| Variable | Default | What it controls |
|----------|---------|-----------------|
| `--trailguide-accent` | `#1a91a2` | Brand color (buttons, highlight ring) |
| `--trailguide-accent-hover` | `#158292` | Primary button hover |
| `--trailguide-bg` | `#ffffff` | Tooltip background |
| `--trailguide-text` | `#374151` | Body text |
| `--trailguide-title` | `#111827` | Step title |
| `--trailguide-text-muted` | `#6b7280` | Progress counter, close icon |
| `--trailguide-border` | `#e5e7eb` | Divider lines |
| `--trailguide-btn-bg` | `#ffffff` | Secondary button background |
| `--trailguide-btn-text` | `#374151` | Secondary button text |
| `--trailguide-btn-border` | `#d1d5db` | Secondary button border |
| `--trailguide-btn-hover` | `#f9fafb` | Secondary button hover |
| `--trailguide-radius` | `8px` | Corner radius |
| `--trailguide-shadow` | `0 10px 25px ...` | Tooltip shadow |
| `--trailguide-overlay` | `rgba(0,0,0,0.5)` | Backdrop dimming |
| `--trailguide-max-width` | `320px` | Tooltip max width |
| `--trailguide-min-width` | `280px` | Tooltip min width |
| `--trailguide-font` | `system-ui, ...` | Font family |

### Dark mode

Dark mode works automatically when `.dark` is on `<html>` or `<body>`. The defaults flip to dark backgrounds and light text. Override them if you want:

```css
.dark {
  --trailguide-bg: #1a1a2e;
  --trailguide-accent: #818cf8;
}
```

### Framework-specific tips

**React / Next.js** — add the CSS overrides in your global stylesheet (`globals.css` or `layout.tsx`).

**Vue / Svelte** — add them in your root `App.vue` or `+layout.svelte`, or any global CSS file.

**CDN / Vanilla** — add a `<style>` tag after importing `style.css`:

```html
<link rel="stylesheet" href="https://unpkg.com/@trailguide/core/dist/style.css">
<style>
  :root { --trailguide-accent: #ff6600; }
</style>
```

See the full variable reference in the [README](../README.md#theming).

---

## Stable selectors

The most important thing for reliable tours: use selectors that won't break when you refactor CSS.

```html
<!-- Best — dedicated tour attribute -->
<button data-trail-id="create-project">Create</button>

<!-- Good — stable ID -->
<nav id="main-navigation">...</nav>

<!-- Avoid — fragile class names that change with design tweaks -->
<button class="btn-primary-lg-v2">Create</button>
```

In your trail JSON:
```json
{ "target": "[data-trail-id='create-project']" }
```

---

## Using the recorder

The recorder lets you build trails by clicking on elements instead of writing selectors by hand.

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

1. Click **Record** in the overlay panel
2. Click any element on the page to capture it
3. Fill in the step title and content
4. Repeat for each step
5. Click **Save Trail** to download the JSON

The recorder generates smart selectors, preferring `data-trail-id`, `id`, and `aria-label` over fragile class paths.

> The recorder is a React component. If you're not using React, you can use it in a separate dev tool or use the [Live Demo](https://app.gettrailguide.com/demo) to record trails and export the JSON.

---

## Version your trails

Include version numbers so you can track changes:

```json
{
  "id": "onboarding",
  "version": "2.1.0",
  ...
}
```

---

## Track completion state

Don't show tours to users who've already completed them:

```tsx
// React example
const completedTours = useUserPreferences('completedTours');

{!completedTours.includes(tour.id) && (
  <Trailguide trail={tour} onComplete={() => markComplete(tour.id)} />
)}
```

```js
// Vanilla JS example
const completed = JSON.parse(localStorage.getItem('completedTours') || '[]');

if (!completed.includes(tour.id)) {
  start(tour, {
    onComplete: () => {
      completed.push(tour.id);
      localStorage.setItem('completedTours', JSON.stringify(completed));
    },
  });
}
```

---

## Next steps

- [Trail Format Reference](./trail-format.md) — all step fields and options
- [API Reference](./api-reference.md) — core, runtime, and recorder APIs
- [Live Demo](https://app.gettrailguide.com/demo) — try recording and playing trails in your browser
