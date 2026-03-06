// Generates og-image.png from og-card.html
// Run from the website/ directory: node generate-og.mjs

import { chromium } from 'playwright';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage();

await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(`file://${resolve(__dirname, 'og-card.html')}`);
await page.screenshot({ path: resolve(__dirname, 'og-image.png') });

await browser.close();
console.log('Generated og-image.png');
