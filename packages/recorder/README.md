# @trailguide/recorder

Capture Trailguide steps by clicking on elements. Records CSS selectors and lets you export trail JSON.

## Installation

```bash
pnpm add @trailguide/recorder
# or
npm install @trailguide/recorder
```

## Usage

```tsx
import { RecorderOverlay, useRecorder } from '@trailguide/recorder';

function App() {
  const [showRecorder, setShowRecorder] = useState(false);
  const recorder = useRecorder({
    trailId: 'my-trail',
    trailTitle: 'My Trail',
  });

  return (
    <>
      <YourApp />
      <button onClick={() => setShowRecorder(true)}>
        Open Recorder
      </button>
      {showRecorder && <RecorderOverlay recorder={recorder} />}
    </>
  );
}
```

## How It Works

1. Click "Record" to enter recording mode
2. Click on any element in your app
3. Fill in the step title, content, and placement
4. Repeat for each step
5. Click "Export JSON" to download the trail file

## API

### `useRecorder(options)`

```tsx
const {
  isRecording,          // boolean - recording mode active
  steps,                // Step[] - captured steps
  pendingStep,          // current element being configured
  startRecording,       // () => void
  stopRecording,        // () => void
  toggleRecording,      // () => void
  addStep,              // (step) => void
  removeStep,           // (index) => void
  updateStep,           // (index, updates) => void
  clearSteps,           // () => void
  confirmPendingStep,   // (details) => void
  cancelPendingStep,    // () => void
  exportTrail,          // () => Trail
  downloadTrail,        // (filename?) => void
} = useRecorder({ trailId, trailTitle });
```

### `<RecorderOverlay>`

Pre-built UI for recording.

```tsx
<RecorderOverlay recorder={recorder} />
```

### Selector Generation

The recorder generates selectors with this priority:

1. `#id` - Element ID
2. `[data-testid="..."]` - Test ID attribute
3. `[data-tour-target="..."]` - Tour target attribute
4. `.unique-class` - Unique class selector
5. `tag:nth-child(n)` - Path-based selector

## Tips

- Add `data-testid` or `data-tour-target` attributes to important elements for stable selectors
- Review generated selectors before exporting
- Test the exported trail to ensure selectors still work
