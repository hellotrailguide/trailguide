// =============================================
// TRAILGUIDE EXTENSION CONFIGURATION
// =============================================
// Change EDITOR_URL to your production URL before publishing

const TRAILGUIDE_CONFIG = {
  // DEVELOPMENT
  EDITOR_URL: 'http://localhost:3000',

  // PRODUCTION (uncomment and update when deploying)
  // EDITOR_URL: 'https://editor.trailguide.dev',
};

// Make available globally
if (typeof window !== 'undefined') {
  window.TRAILGUIDE_CONFIG = TRAILGUIDE_CONFIG;
}
