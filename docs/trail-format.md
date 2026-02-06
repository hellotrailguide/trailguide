# Trail Format Reference

Trails are JSON files that define the sequence of steps in a product tour.

## Schema

### Trail

The root object representing a complete tour.

```typescript
interface Trail {
  id: string;       // Unique identifier
  title: string;    // Human-readable name
  version: string;  // Semantic version
  steps: Step[];    // Ordered list of steps
}
```

### Step

A single step in the tour.

```typescript
interface Step {
  id: string;           // Unique step identifier
  target: string;       // CSS selector for the target element
  placement: Placement; // Tooltip position
  title: string;        // Step headline
  content: string;      // Step description
  action?: StepAction;  // Expected user action
  nextOn?: NextTrigger; // What advances to next step
}

type Placement = 'top' | 'bottom' | 'left' | 'right';
type StepAction = 'click' | 'input' | 'hover' | 'none';
type NextTrigger = 'click' | 'manual';
```

## Complete Example

```json
{
  "id": "project-creation",
  "title": "Create Your First Project",
  "version": "1.0.0",
  "steps": [
    {
      "id": "welcome",
      "target": "#app-header",
      "placement": "bottom",
      "title": "Welcome!",
      "content": "Let's create your first project together."
    },
    {
      "id": "click-create",
      "target": "[data-tour-target='create-button']",
      "placement": "bottom",
      "title": "Create a Project",
      "content": "Click here to start a new project.",
      "action": "click"
    },
    {
      "id": "enter-name",
      "target": "#project-name-input",
      "placement": "right",
      "title": "Name Your Project",
      "content": "Enter a descriptive name for your project.",
      "action": "input"
    },
    {
      "id": "done",
      "target": ".project-card:first-child",
      "placement": "top",
      "title": "All Set!",
      "content": "Your project is ready. Click it to get started."
    }
  ]
}
```

## Field Details

### `id`

Unique identifier for the trail or step. Used for:
- Tracking completion
- Analytics
- Referencing in code

### `target`

CSS selector that identifies the element to highlight. Supports:
- ID selectors: `#my-element`
- Class selectors: `.my-class`
- Attribute selectors: `[data-testid="my-component"]`
- Compound selectors: `#sidebar .nav-item:first-child`

**Tips for stable selectors:**
- Prefer IDs and data attributes over classes
- Add `data-tour-target` attributes to important elements
- Avoid selectors that depend on DOM structure

### `placement`

Where the tooltip appears relative to the target:

| Value | Position |
|-------|----------|
| `top` | Above the element |
| `bottom` | Below the element |
| `left` | Left of the element |
| `right` | Right of the element |

The tooltip automatically flips if there's not enough space.

### `action` (optional)

Indicates what action the user should take:

| Value | Meaning |
|-------|---------|
| `click` | User should click the element |
| `input` | User should type in the element |
| `hover` | User should hover over the element |
| `none` | Informational only |

### `nextOn` (optional)

What triggers advancement to the next step:

| Value | Behavior |
|-------|----------|
| `manual` | User clicks Next button (default) |
| `click` | Advances when target is clicked |

## Validation

Trails are validated at runtime. Common issues:

- **Target not found**: The CSS selector doesn't match any element
- **Target not visible**: The element exists but is hidden
- **Invalid placement**: Must be one of the four valid values

Check the browser console for warnings about invalid trails.
