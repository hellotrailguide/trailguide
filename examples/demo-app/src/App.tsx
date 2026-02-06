import { useState, useEffect, useCallback, useRef } from 'react';
import { Trailguide } from '@trailguide/runtime';
import type { Trail } from '@trailguide/runtime';
import { RecorderOverlay, useRecorder } from '@trailguide/recorder';
import '@trailguide/core/dist/style.css';
import { Dashboard } from './components/Dashboard';
import { CreateButton } from './components/CreateButton';
import { StatsPanel } from './components/StatsPanel';

function App() {
  const [showTour, setShowTour] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [trail, setTrail] = useState<Trail | null>(null);
  const [trailSource, setTrailSource] = useState<'default' | 'imported'>('default');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recorder = useRecorder({
    trailId: 'new-trail',
    trailTitle: 'My New Trail',
  });

  // Load default tour from JSON file
  const loadDefaultTour = useCallback(async () => {
    try {
      const response = await fetch('/tours/welcome.json?' + Date.now());
      const data = await response.json();
      setTrail(data);
      setTrailSource('default');
    } catch (err) {
      console.error('Failed to load tour:', err);
    }
  }, []);

  useEffect(() => {
    loadDefaultTour();
  }, [loadDefaultTour]);

  const playTour = () => {
    if (trailSource === 'default') {
      loadDefaultTour().then(() => setShowTour(true));
    } else {
      setShowTour(true);
    }
  };

  // Handle file import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setTrail(json);
        setTrailSource('imported');
        setShowTour(true);
      } catch (err) {
        alert('Invalid JSON file. Please upload a valid trail file.');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be imported again
    e.target.value = '';
  };

  return (
    <>
      <Dashboard>
        {/* Hero section with Play Tour */}
        <div
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700 }}>
            Trailguide Demo
          </h2>
          <p style={{ margin: '0 0 24px 0', opacity: 0.9, fontSize: '15px' }}>
            Interactive product tours that live in your Git repo
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={playTour}
              style={{
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px',
                background: 'white',
                color: '#1d4ed8',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              Play Tour
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: 600,
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Import Trail
            </button>
          </div>
          {trailSource === 'imported' && (
            <p style={{ margin: '16px 0 0 0', fontSize: '13px', opacity: 0.8 }}>
              Playing imported trail: {trail?.title || 'Untitled'}
            </p>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />

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
            onClick={() => {
              loadDefaultTour();
              setShowTour(true);
            }}
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
            Reset to Default
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

        {/* How it works */}
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
            Try It Out
          </h3>
          <ol
            style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '14px',
              lineHeight: 1.8,
              color: '#4b5563',
            }}
          >
            <li>Click <strong>Show Recorder</strong> → then <strong>Record</strong></li>
            <li>Click any element on the page to capture it</li>
            <li>Fill in the step details and add more steps</li>
            <li>Click <strong>Export JSON</strong> to download your trail</li>
            <li>Click <strong>Import Trail</strong> to test it immediately</li>
          </ol>
        </div>

        {/* Info panel */}
        <div
          style={{
            marginTop: '16px',
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
              margin: '0 0 16px 0',
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#4b5563',
            }}
          >
            Tours are just JSON files in your repo. Edit them, commit changes, review in PRs.
            No vendor dashboard, no per-user pricing.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', color: '#374151' }}>
              No build step
            </span>
            <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', color: '#374151' }}>
              JSON format
            </span>
            <span style={{ fontSize: '12px', background: '#f3f4f6', padding: '4px 10px', borderRadius: '6px', color: '#374151' }}>
              Git diff-able
            </span>
          </div>
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
