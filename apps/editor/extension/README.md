# Trailguide Editor Chrome Extension

Visual element picker for creating product tours with Trailguide Pro Editor.

## Installation (Development)

1. Open Chrome and go to `chrome://extensions`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this `extension` folder

## Usage

1. Open the Trailguide Editor at `http://localhost:3000`
2. Navigate to any website in another tab
3. Click the Trailguide extension icon
4. Click "Start Picking Elements"
5. Hover over elements to see them highlighted
6. Click an element to capture its CSS selector
7. The selector is automatically sent to the editor

## Files

- `manifest.json` - Extension configuration
- `popup.html/js` - Extension popup UI
- `content.js` - Injected into pages for element picking
- `background.js` - Service worker for message routing
- `icons/` - Extension icons

## Updating for Production

Before deploying to production, update `EDITOR_URL` in:
- `background.js` (line 3)
- `popup.js` (line 3)

Change from `http://localhost:3000` to your production URL.

## Publishing to Chrome Web Store

1. Update icons with proper branded assets
2. Update EDITOR_URL to production
3. Create a ZIP of this folder
4. Submit at https://chrome.google.com/webstore/developer/dashboard

## Troubleshooting

**Extension not picking up elements:**
- Make sure you're not on a chrome:// or extension page
- Reload the extension at chrome://extensions

**Selector not appearing in editor:**
- Open browser console on editor page
- Look for `[ExtensionListener]` logs
- Check extension background console for errors

**To view background script logs:**
1. Go to chrome://extensions
2. Find Trailguide Editor
3. Click "Service worker" link
