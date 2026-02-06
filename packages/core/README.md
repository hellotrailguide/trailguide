# @trailguide/core

Framework-agnostic product tours. Works with any web app - vanilla JS, React, Vue, Svelte, or anything else.

## Installation

```bash
npm install @trailguide/core
```

## Quick Start

```js
import { start } from '@trailguide/core';
import '@trailguide/core/styles.css';

// Load your trail
const trail = {
  id: 'welcome',
  title: 'Welcome Tour',
  version: '1.0.0',
  steps: [
    {
      id: 'step-1',
      target: '#create-button',
      placement: 'bottom',
      title: 'Create something',
      content: 'Click here to get started.'
    }
  ]
};

// Start the tour
start(trail, {
  onComplete: () => console.log('Tour completed!'),
  onSkip: () => console.log('Tour skipped'),
});
```

## CDN Usage (No Build Step)

```html
<link rel="stylesheet" href="https://unpkg.com/@trailguide/core/dist/trailguide.css">
<script src="https://unpkg.com/@trailguide/core/dist/trailguide.umd.js"></script>
<script>
  Trailguide.start({
    id: 'welcome',
    title: 'Welcome',
    version: '1.0.0',
    steps: [
      { id: '1', target: '#btn', placement: 'bottom', title: 'Click me', content: 'Start here' }
    ]
  });
</script>
```

## API

### Functions

```js
import { start, stop, next, prev, skip } from '@trailguide/core';

start(trail, options)  // Start a tour
stop()                 // Stop the current tour
next()                 // Go to next step
prev()                 // Go to previous step
skip()                 // Skip/close the tour
```

### Class API

```js
import { Trailguide } from '@trailguide/core';

const tour = new Trailguide({
  onComplete: () => {},
  onSkip: () => {},
  onStepChange: (step, index) => {},
});

tour.start(trail);
tour.next();
tour.prev();
tour.goToStep(2);
tour.stop();
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `onComplete` | `() => void` | Called when tour finishes |
| `onSkip` | `() => void` | Called when user skips |
| `onStepChange` | `(step, index) => void` | Called on each step change |

## Trail Format

```typescript
interface Trail {
  id: string;
  title: string;
  version: string;
  steps: Step[];
}

interface Step {
  id: string;
  target: string;       // CSS selector
  placement: 'top' | 'bottom' | 'left' | 'right';
  title: string;
  content: string;
}
```

## Keyboard Shortcuts

- `→` or `Enter` - Next step
- `←` - Previous step
- `Escape` - Skip tour

## Framework Wrappers

- **React**: Use `@trailguide/runtime` for hooks and components
- **Vue/Svelte/etc**: Use this package directly
