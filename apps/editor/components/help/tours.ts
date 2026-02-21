import type { Trail } from '@trailguide/runtime'

export const TOUR_KEYS = {
  home: 'trailguide_tour_home',
  editor: 'trailguide_tour_editor',
  analytics: 'trailguide_tour_analytics',
  settings: 'trailguide_tour_settings',
} as const

export const HOME_TOUR: Trail = {
  id: 'home-onboarding',
  title: 'Welcome to Trailguide',
  version: '1.0.0',
  steps: [
    {
      id: 'trails-header',
      title: 'Your Trails',
      content: 'Welcome to Trailguide! This is your home base — all the product tours you create live here.',
      target: '[data-tour-target="trails-header"]',
      placement: 'right',
    },
    {
      id: 'new-trail',
      title: 'Create a Trail',
      content: 'Click here to build a new product tour. Each trail is a step-by-step guide that helps your users discover features.',
      target: '[data-tour-target="new-trail-button"]',
      placement: 'bottom',
    },
    {
      id: 'nav-analytics',
      title: 'Track Performance',
      content: 'Once your trails are live, visit Analytics to see completion rates, drop-off points, and user engagement over time.',
      target: '[data-tour-target="nav-analytics"]',
      placement: 'right',
    },
    {
      id: 'help',
      title: "You're All Set!",
      content: 'Click the help icon anytime to replay this tour, browse docs, or get support.',
      target: '[data-tour-target="help-button"]',
      placement: 'right',
    },
  ],
}

export const EDITOR_TOUR: Trail = {
  id: 'editor-onboarding',
  title: 'Welcome to Trailguide',
  version: '1.0.0',
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Trailguide!',
      content: "Let's take a quick tour of the editor. You'll be creating product tours in no time.",
      target: '[data-tour-target="logo"]',
      placement: 'right',
    },
    {
      id: 'url-input',
      title: 'Enter Your App URL',
      content: "Start by entering your app's URL here. We'll load it in the preview so you can click elements to add them as tour steps.",
      target: '[data-tour-target="url-input"]',
      placement: 'bottom',
    },
    {
      id: 'pick-element',
      title: 'Record a Flow',
      content: 'Click "Start Recording" to open your app in a new window. Click elements there and they\'ll be added as tour steps in real time!',
      target: '[data-tour-target="preview-area"]',
      placement: 'left',
    },
    {
      id: 'step-list',
      title: 'Your Tour Steps',
      content: 'Your steps appear here. Drag to reorder, click to edit. Each step targets an element in your app.',
      target: '[data-tour-target="step-list"]',
      placement: 'right',
    },
    {
      id: 'add-step',
      title: 'Add Steps Manually',
      content: 'You can also add steps manually if you prefer. Just enter the CSS selector for the target element.',
      target: '[data-tour-target="add-step-button"]',
      placement: 'right',
    },
    {
      id: 'edit-panel',
      title: 'Edit Step Content',
      content: 'Select a step to edit its title, content, and placement. Use the rich text editor for formatting.',
      target: '[data-tour-target="edit-panel"]',
      placement: 'left',
    },
    {
      id: 'save',
      title: 'Save Your Work',
      content: "Don't forget to save! Your trails are stored locally and can be synced to GitHub.",
      target: '[data-tour-target="save-button"]',
      placement: 'bottom',
    },
    {
      id: 'sync',
      title: 'Sync with GitHub',
      content: 'Push your trails to GitHub as JSON files. Review changes in PRs just like code.',
      target: '[data-tour-target="sync-button"]',
      placement: 'bottom',
    },
    {
      id: 'done',
      title: "You're Ready!",
      content: "That's it! Enter a URL and start building your first product tour. Click the help icon anytime to restart this tour.",
      target: '[data-tour-target="help-button"]',
      placement: 'right',
    },
  ],
}

export const ANALYTICS_TOUR: Trail = {
  id: 'analytics-onboarding',
  title: 'Analytics Overview',
  version: '1.0.0',
  steps: [
    {
      id: 'analytics-header',
      title: 'Trail Analytics',
      content: 'See exactly how users engage with your product tours — completions, drop-offs, and trends over time.',
      target: '[data-tour-target="analytics-header"]',
      placement: 'right',
    },
    {
      id: 'analytics-filters',
      title: 'Filter Your Data',
      content: 'Focus on a specific trail or time period. Use these controls to drill into exactly what you need.',
      target: '[data-tour-target="analytics-filters"]',
      placement: 'bottom',
    },
    {
      id: 'analytics-content',
      title: 'Your Metrics Live Here',
      content: 'Once users interact with your trails, this area shows completion rates, engagement trends, and step-by-step drop-off data.',
      target: '[data-tour-target="analytics-content"]',
      placement: 'top',
    },
  ],
}

export const SETTINGS_TOUR: Trail = {
  id: 'settings-onboarding',
  title: 'Settings',
  version: '1.0.0',
  steps: [
    {
      id: 'settings-account',
      title: 'Your Account',
      content: 'Manage your email, connected GitHub account, and sign-out from here.',
      target: '[data-tour-target="settings-account"]',
      placement: 'right',
    },
    {
      id: 'settings-subscription',
      title: 'Subscription & Pro Features',
      content: 'Upgrade to Pro to unlock GitHub sync, the analytics dashboard, and selector auto-repair. Your first 14 days are free.',
      target: '[data-tour-target="settings-subscription"]',
      placement: 'right',
    },
  ],
}
