import { useState, useEffect, useCallback, useRef } from 'react';
import { Trailguide } from '@trailguide/runtime';
import type { Trail } from '@trailguide/runtime';
import { RecorderOverlay, useRecorder } from '@trailguide/recorder';
import '@trailguide/core/styles.css';
import { Dashboard } from './components/Dashboard';
import { StatsPanel } from './components/StatsPanel';

function App() {
  const [showTour, setShowTour] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [trail, setTrail] = useState<Trail | null>(null);
  const [trailSource, setTrailSource] = useState<'default' | 'imported'>('default');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [builderState, setBuilderState] = useState<'initial' | 'recording' | 'ready'>('initial');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recorder = useRecorder({
    trailId: 'new-trail',
    trailTitle: 'My New Trail',
  });

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (builderState === 'recording' && recorder.steps.length > 0) {
        const lastStep = recorder.steps[recorder.steps.length - 1];
        setToastMessage(`Step added: ${lastStep.target}`);
    }
    }, [recorder.steps, builderState]);

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
    e.target.value = '';
  };

  // Start recording flow
  const startRecording = () => {
    setShowRecorder(true);
    setBuilderState('recording');
  };

  return (
    <>
      <Dashboard>
        {/* Toast Message */}
        {toastMessage && (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '12px 24px',
                background: '#22c55e',
                color: 'white',
                borderRadius: '8px',
                zIndex: 2000,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}>
                {toastMessage}
            </div>
        )}

        {/* Workbench Header */}
        <div
          style={{
            padding: '20px',
            marginBottom: '24px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 700, color: '#111827' }}>
            Build a Trail by Clicking Your App
          </h2>
          <p style={{ margin: 0, fontSize: '15px', color: '#6b7280' }}>
            Trails are recorded by clicking real UI elements. No dashboards. No setup.
          </p>
        </div>

        {/* Trail Builder */}
        <div
          style={{
            padding: '20px',
            marginBottom: '24px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
          }}
        >
          {builderState === 'initial' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                Step 1: Record your first trail
              </h3>
              <button
                onClick={startRecording}
                data-trail-id="start-recording"
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Start Recording
              </button>
            </div>
          )}
          {builderState === 'recording' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                Recording — click elements to add steps
              </h3>
              <button
                onClick={() => {
                  setShowRecorder(false);
                  setBuilderState('ready');
                }}
                data-trail-id="finish-recording"
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  cursor: 'pointer',
                }}
              >
                Finish Recording
              </button>
              {recorder.steps.length > 0 && (
                <button
                    onClick={() => {
                        const recordedTrail = recorder.exportTrail();
                        setTrail(recordedTrail);
                        setShowTour(true);
                    }}
                    data-trail-id="preview-trail-recording"
                    style={{
                        padding: '12px 24px',
                        fontSize: '14px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#374151',
                        cursor: 'pointer',
                        marginLeft: '12px',
                    }}
                >
                    Preview Trail
                </button>
              )}
            </div>
          )}
          {builderState === 'ready' && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                Trail ready — save or preview it
              </h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => recorder.downloadTrail()}
                  data-trail-id="save-trail"
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: '8px',
                    background: '#3b82f6',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Save Trail
                </button>
                <button
                  onClick={playTour}
                  data-trail-id="preview-trail"
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
                  Preview Trail
                </button>
              </div>
            </div>
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

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', opacity: builderState === 'recording' ? 0.5 : 1 }}>
            <button
                onClick={() => fileInputRef.current?.click()}
                data-trail-id="import-trail"
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
                Load a Trail
            </button>
            <button
                onClick={playTour}
                data-trail-id="play-example"
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
                Run Trail
            </button>
        </div>

        {trailSource === 'imported' && (
          <div
            style={{
              padding: '12px 16px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '8px',
              marginBottom: '24px',
              fontSize: '14px',
              color: '#065f46',
            }}
          >
            Loaded: <strong>{trail?.title || 'Untitled Trail'}</strong> ({trail?.steps?.length || 0} steps)
          </div>
        )}

        {/* Sample App Content - things to target */}
        <div style={{ opacity: builderState === 'recording' ? 0.5 : 1 }}>
            <StatsPanel />
        </div>

        {/* Recording Banner */}
        {builderState === 'recording' && (
            <div style={{
                position: 'fixed',
                top: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '12px 24px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                borderRadius: '8px',
                zIndex: 1000,
            }}>
                Click anything to add it to the trail
            </div>
        )}

        {/* Sample buttons to record */}
        <div
          style={{
            marginTop: '24px',
            padding: '24px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            opacity: builderState === 'recording' ? 1 : 0.5,
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            Things to Try Recording
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6b7280' }}>
            These are normal app buttons — Trailguide just watches what you click.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              data-trail-id="new-project"
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                borderRadius: '8px',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              + New Project
            </button>
            <button
              data-trail-id="invite-team"
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Invite Team
            </button>
            <button
              data-trail-id="view-reports"
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              View Reports
            </button>
          </div>
        </div>

        {/* How it works */}
        <div
          style={{
            marginTop: '16px',
            padding: '20px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#111827' }}>
            What did we just do?
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: 1.7, color: '#4b5563' }}>
            <li>You recorded a trail by clicking real UI</li>
            <li>Trailguide generated a trail file</li>
            <li>That file can live in your repo</li>
            <li>Anyone can edit it and review changes</li>
          </ul>
          <details style={{ marginTop: '16px', fontSize: '14px', color: '#4b5563' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Advanced: How trails are loaded</summary>
            <p style={{ margin: '8px 0 0 0', lineHeight: 1.7 }}>
              After exporting, drop the trail file in your app's <code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>/public/tours/</code> folder.
              Then load it with <code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '4px' }}>Trailguide.start(trail)</code> — that's it!
              Your tours are now version controlled and reviewable in PRs.
            </p>
          </details>
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
