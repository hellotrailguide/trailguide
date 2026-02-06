# Trailguide

**Tutorials as code** - Git-native, editable UI walkthroughs for React apps.

Trailguide lets you create interactive product tours that live in your codebase as JSON files. Edit a tour, commit the change, and your users see the update—no separate dashboard needed.

## Quick Start

### 1. Install the runtime

```bash
pnpm add @trailguide/runtime
```

### 2. Create a trail file

```json
// tours/welcome.json
{
  "id": "welcome",
  "title": "Welcome Tour",
  "version": "1.0.0",
  "steps": [
    {
      "id": "step-1",
      "target": "#create-button",
      "placement": "bottom",
      "title": "Create something new",
      "content": "Click here to get started."
    }
  ]
}
```

### 3. Add to your app

```tsx
import { Trailguide } from '@trailguide/runtime';
import welcomeTour from './tours/welcome.json';

function App() {
  return (
    <>
      <YourApp />
      <Trailguide
        trail={welcomeTour}
        onComplete={() => console.log('Done!')}
      />
    </>
  );
}
```

## Why Tutorials as Code?

- **Version controlled** - Trail changes show up in PRs, get reviewed, roll back easily
- **No vendor lock-in** - Your tours are JSON files in your repo
- **Developer-friendly** - Edit in your IDE, use your existing workflow
- **Git diff-able** - See exactly what changed between versions

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| `@trailguide/runtime` | Renders trails in your app | Ready |
| `@trailguide/recorder` | Capture steps by clicking | Ready |
| `@trailguide/editor` | Visual editing UI | Coming soon |

## Development

```bash
# Clone and install
git clone <repo>
cd trailguide
pnpm install

# Run the demo
pnpm dev

# Build all packages
pnpm build
```

## Trail Format

See [docs/trail-format.md](docs/trail-format.md) for the complete schema.

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

## Roadmap

- [x] Runtime package - render trails
- [x] Recorder - capture steps interactively
- [ ] Editor - visual trail builder (paid)
- [ ] Analytics - track completion rates
- [ ] Branching - conditional step logic

## License

MIT
