import { useState, useEffect } from 'react';
import { Trailguide } from '@trailguide/runtime';
import type { Trail } from '@trailguide/runtime';
import { RecorderOverlay, useRecorder } from '@trailguide/recorder';
import '@trailguide/core/dist/style.css';
import { Dashboard } from './components/Dashboard';
import { CreateButton } from './components/CreateButton';
import { StatsPanel } from './components/StatsPanel';

// Import the tour JSON directly
import welcomeTour from '../../../tours/welcome.json';

function App() {
  const [showTour, setShowTour] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [trail] = useState<Trail>(welcomeTour as Trail);

  const recorder = useRecorder({
    trailId: 'new-trail',
    trailTitle: 'My New Trail',
  });

  // Auto-start tour after a small delay
  useEffect(() => {
    const timer = setTimeout(() => setShowTour(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Dashboard>
        {/* Action bar */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <CreateButton />
          <button
            onClick={() => setShowTour(true)}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              cursor: 'pointer',
            }}
          >
            Restart Tour
          </button>
          <button
            onClick={() => setShowRecorder(prev => !prev)}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              border: showRecorder ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: '8px',
              background: showRecorder ? '#eff6ff' : 'white',
              color: showRecorder ? '#1d4ed8' : '#374151',
              cursor: 'pointer',
            }}
          >
            {showRecorder ? 'Hide Recorder' : 'Show Recorder'}
          </button>
        </div>

        {/* Stats */}
        <StatsPanel />

        {/* Info panel */}
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: 600,
              color: '#111827',
            }}
          >
            Tutorials as Code
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#4b5563',
            }}
          >
            Edit <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
              tours/welcome.json
            </code> to customize the tour, then reload the page to see your changes instantly.
            Git-friendly, human-readable, and version-controllable.
          </p>
        </div>
      </Dashboard>

      {/* Tour overlay */}
      {showTour && trail && (
        <Trailguide
          trail={trail}
          onComplete={() => {
            setShowTour(false);
            console.log('Tour completed!');
          }}
          onSkip={() => {
            setShowTour(false);
            console.log('Tour skipped');
          }}
          onStepChange={(step, index) => {
            console.log(`Step ${index + 1}:`, step.title);
          }}
        />
      )}

      {/* Recorder overlay */}
      {showRecorder && <RecorderOverlay recorder={recorder} />}

      {/* Global styles */}
      <style>
        {`
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
        `}
      </style>
    </>
  );
}

export default App;
