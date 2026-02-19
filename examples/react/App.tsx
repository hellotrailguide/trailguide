/**
 * React example — using @trailguide/runtime
 *
 * Install:
 *   npm install @trailguide/runtime @trailguide/core
 *
 * The runtime package provides a React component that handles
 * rendering, positioning, and step navigation automatically.
 */
import { useState } from 'react';
import { Trailguide } from '@trailguide/runtime';
import '@trailguide/core/dist/style.css';

// Import your trail JSON (or fetch it at runtime)
import welcomeTour from './tours/welcome.json';

export default function App() {
  const [showTour, setShowTour] = useState(true);

  return (
    <>
      {/* Your app */}
      <header id="dashboard-header">
        <h1>Dashboard</h1>
        <button data-trail-id="settings">Settings</button>
      </header>

      <main>
        <button data-trail-id="create-btn">+ Create New</button>

        <div id="stats-panel">
          <h2>Your Statistics</h2>
          <p>12 Projects / 48 Tasks / 6 Members</p>
        </div>
      </main>

      {/* Tour overlay — renders when showTour is true */}
      {showTour && (
        <Trailguide
          trail={welcomeTour}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
    </>
  );
}
