/**
 * Next.js App Router example — using @trailguide/runtime
 *
 * Install:
 *   npm install @trailguide/runtime @trailguide/core
 *
 * Place this file at: app/page.tsx (or any route)
 * Place your tour JSON at: public/tours/welcome.json
 *
 * Key points:
 * - Must be 'use client' because Trailguide uses browser APIs
 * - Tour JSON can be imported directly or fetched from public/
 */
'use client';

import { useState } from 'react';
import { Trailguide } from '@trailguide/runtime';
import '@trailguide/core/dist/style.css';

const tour = {
  id: 'welcome',
  title: 'Welcome Tour',
  version: '1.0.0',
  steps: [
    {
      id: 'step-1',
      target: '#dashboard-header',
      placement: 'bottom' as const,
      title: 'Welcome!',
      content: 'This is your dashboard. Let us show you around.',
    },
    {
      id: 'step-2',
      target: '[data-trail-id="create-btn"]',
      placement: 'bottom' as const,
      title: 'Create something',
      content: 'Click here to create new items.',
    },
    {
      id: 'step-3',
      target: '[data-trail-id="settings"]',
      placement: 'left' as const,
      title: 'Settings',
      content: 'Customize your preferences here. You are all set!',
    },
  ],
};

export default function Page() {
  const [showTour, setShowTour] = useState(true);

  return (
    <>
      <header id="dashboard-header">
        <h1>Dashboard</h1>
        <button data-trail-id="settings">Settings</button>
      </header>

      <main>
        <button data-trail-id="create-btn">+ Create New</button>
        <p>Your Next.js app content goes here.</p>
      </main>

      {showTour && (
        <Trailguide
          trail={tour}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </>
  );
}
