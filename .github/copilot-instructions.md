# Trailguide - Copilot Instructions

Trailguide is a Git-native product tour library for web apps. Tours are JSON files stored in repos, and the runtime is framework-agnostic.

## Build, Test, and Lint

### Root-level commands (run from repo root)
```bash
pnpm install          # Install all dependencies
pnpm build            # Build all packages
pnpm typecheck        # Type-check all packages
pnpm dev              # Run demo-app (default dev environment)
pnpm clean            # Remove all dist and node_modules
```

### Package-specific commands
```bash
pnpm --filter @trailguide/core build         # Build core package
pnpm --filter @trailguide/runtime build      # Build runtime package
pnpm --filter @trailguide/recorder build     # Build recorder package
pnpm --filter @trailguide/editor dev         # Run Pro Editor (Next.js)
```

### Development environments
```bash
pnpm dev:editor       # Run Pro Editor in dev mode
pnpm dev:vanilla      # Serve vanilla JS demo
pnpm dev:website      # Serve marketing website
pnpm dev:demo         # Run editor and demo-app in parallel
```

### Individual package commands
Each package has its own package.json with:
- `dev` - Watch mode build
- `build` - Production build (Vite + TypeScript declarations)
- `typecheck` - Type checking only

No test runner or linter configured yet.

## Architecture

### Monorepo Structure (pnpm workspaces)
```
packages/
  core/       - Vanilla JS runtime (framework-agnostic)
  runtime/    - React wrapper (hooks + components)
  recorder/   - Developer capture tool (React)
apps/
  editor/     - Pro Editor (Next.js + Supabase + Stripe)
examples/
  demo-app/   - Example React app
  vanilla-demo/ - Plain HTML/JS example
```

### Package Hierarchy
- `@trailguide/core` - Base runtime, no dependencies on React
- `@trailguide/runtime` - React wrapper, depends on `core`
- `@trailguide/recorder` - React-based recorder, depends on `core`
- `@trailguide/editor` - Next.js app using `core` and `runtime`

**Key principle**: Core is framework-agnostic. React-specific code lives in `runtime` and `recorder`.

### Trail Data Model
Trails are JSON files with this structure:
```json
{
  "id": "trail-id",
  "title": "Trail Title",
  "version": "1.0.0",
  "steps": [
    {
      "id": "step-1",
      "target": "[data-trail-id='create-btn']",  // CSS selector
      "placement": "top|bottom|left|right",
      "title": "Step Title",
      "content": "Step description",
      "action": "click|input|hover|none",  // optional
      "nextOn": "click|manual"              // optional
    }
  ]
}
```

See `packages/core/src/types.ts` for the canonical TypeScript types.

### Build System
- All packages use **Vite** for bundling
- Core builds ES modules + UMD format (for CDN use)
- All packages emit TypeScript declarations
- No test runner configured

### Key Files
- `packages/core/src/trailguide.ts` - Core runtime engine (start, stop, next, prev, skip)
- `packages/core/src/dom.ts` - DOM manipulation, positioning logic using Floating UI
- `packages/core/src/validate.ts` - Trail validation (check if selectors exist)
- `packages/core/src/analytics.ts` - Analytics event tracking
- `packages/runtime/src/hooks/useTrail.ts` - React hook for trail control
- `packages/runtime/src/components/Trailguide.tsx` - React component wrapper
- `packages/recorder/src/utils/selectorGenerator.ts` - Smart CSS selector generation

## Conventions

### Workspace Dependencies
When referencing workspace packages in package.json:
```json
"dependencies": {
  "@trailguide/core": "workspace:*"
}
```

### Selector Stability
Prefer stable attributes for targeting elements:
1. `data-trail-id` (best - dedicated for tours)
2. `id` attributes
3. `aria-label` attributes
4. Class names (avoid - fragile)

The recorder prioritizes these in `selectorGenerator.ts`.

### CSS Class Naming
- Core uses plain CSS (no preprocessor)
- Editor uses Tailwind CSS
- Runtime/Recorder use inline styles

### TypeScript Configuration
- Base config in `tsconfig.base.json`
- Each package extends the base config
- Strict mode enabled
- Target: ES2020

### Analytics Integration
Core supports optional analytics via `TrailguideOptions.analytics`:
```ts
{
  endpoint: string,   // Pro Editor analytics endpoint
  userId: string,     // Trail owner ID
  trailId?: string,   // Override trail.id
  debug?: boolean     // Log events to console
}
```

### Exports Pattern
Each package exports via `src/index.ts`:
- Core: `start`, `stop`, `next`, `prev`, `skip`, `validateTrail`, types
- Runtime: `Trailguide` component, `useTrail` hook
- Recorder: `RecorderOverlay` component, `useRecorder` hook

### Editor-Specific
The Pro Editor (`apps/editor`) is a Next.js app with:
- Supabase for auth and data
- Stripe for billing
- Upstash for rate limiting
- TipTap for rich text editing
- Recharts for analytics dashboard
- dnd-kit for drag-and-drop

Run `pnpm seed:analytics` to populate demo analytics data.

## Common Workflows

### Adding a new feature to core
1. Add types to `packages/core/src/types.ts`
2. Implement in `packages/core/src/trailguide.ts`
3. Export from `packages/core/src/index.ts`
4. Update React wrapper in `packages/runtime` if needed
5. Run `pnpm build:core` then `pnpm typecheck`

### Testing changes locally
1. Make changes in a package
2. Run `pnpm --filter <package-name> build`
3. Test in `demo-app` with `pnpm dev`
4. Or test in vanilla demo with `pnpm dev:vanilla`

### Working with the editor
The Pro Editor is the Next.js app in `apps/editor`. It requires environment variables for Supabase, Stripe, and Upstash (see `.env.example` if it exists). For development:
```bash
pnpm --filter @trailguide/editor dev
```

### Creating a new package
1. Add to `packages/` directory
2. Include in `pnpm-workspace.yaml` (uses `packages/*` glob)
3. Add `build`, `dev`, and `typecheck` scripts
4. Reference other workspace packages with `workspace:*`
