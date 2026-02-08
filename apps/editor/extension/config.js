// =============================================
// TRAILGUIDE EXTENSION CONFIGURATION
// =============================================
// Change EDITOR_URL to your production URL before publishing

const TRAILGUIDE_CONFIG = {
  // PRODUCTION
  EDITOR_URL: 'https://traileditor.vercel.app',

  // DEVELOPMENT (uncomment for local testing)
  // EDITOR_URL: 'http://localhost:3000',
};

// Make available globally
if (typeof window !== 'undefined') {
  window.TRAILGUIDE_CONFIG = TRAILGUIDE_CONFIG;
}
