# Getting Started with Trailguide

This guide will help you add interactive product tours to your React application.

## Prerequisites

- React 18+
- Node.js 18+
- pnpm, npm, or yarn

## Installation

```bash
pnpm add @trailguide/runtime
```

## Basic Setup

### 1. Create a trail file

Create a `tours` directory in your project and add a trail JSON file:

```json
// src/tours/welcome.json
{
  "id": "welcome",
  "title": "Welcome Tour",
  "version": "1.0.0",
  "steps": [
    {
      "id": "step-1",
      "target": "#signup-button",
      "placement": "bottom",
      "title": "Get Started",
      "content": "Click here to create your account and begin."
    },
    {
      "id": "step-2",
      "target": ".dashboard-nav",
      "placement": "right",
      "title": "Navigation",
      "content": "Use the sidebar to navigate between sections."
    }
  ]
}
```

### 2. Import and render

```tsx
import { Trailguide } from '@trailguide/runtime';
import welcomeTour from './tours/welcome.json';

function App() {
  const [showTour, setShowTour] = useState(true);

  return (
    <>
      <YourMainApp />

      {showTour && (
        <Trailguide
          trail={welcomeTour}
          onComplete={() => {
            setShowTour(false);
            // Mark tour as completed in user preferences
          }}
          onSkip={() => {
            setShowTour(false);
          }}
        />
      )}
    </>
  );
}
```

### 3. Test it out

Run your app and the tour should appear, highlighting each target element in sequence.

## Using the Recorder

To create trails interactively:

```bash
pnpm add @trailguide/recorder
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

1. Click "Record" in the recorder panel
2. Click on elements you want to highlight
3. Fill in step details
4. Export the JSON when done

## Best Practices

### Stable Selectors

Use stable selectors that won't change:

```jsx
// Good - explicit tour target
<button data-tour-target="create-project">Create</button>

// Good - stable ID
<nav id="main-navigation">...</nav>

// Avoid - fragile class names
<button className="btn-primary-lg-v2">Create</button>
```

### Version Your Trails

Include version numbers in trail files:

```json
{
  "id": "onboarding",
  "version": "2.1.0",
  ...
}
```

### Store Completion State

Track which tours users have completed:

```tsx
const completedTours = useUserPreferences('completedTours');

{!completedTours.includes(tour.id) && (
  <Trailguide trail={tour} onComplete={() => markComplete(tour.id)} />
)}
```

## Next Steps

- [Trail Format Reference](./trail-format.md)
- [API Reference](./api-reference.md)
