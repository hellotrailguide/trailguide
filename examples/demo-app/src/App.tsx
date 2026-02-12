import { useState, useEffect, useCallback, useRef } from 'react';
import { Trailguide } from '@trailguide/runtime';
import type { Trail, AnalyticsConfig } from '@trailguide/runtime';
import { RecorderOverlay, useRecorder } from '@trailguide/recorder';
import '@trailguide/core/dist/style.css';
import { Dashboard } from './components/Dashboard';

function App() {
  const [showTour, setShowTour] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [trail, setTrail] = useState<Trail | null>(null);
  const [trailSource, setTrailSource] = useState<'default' | 'imported' | 'recorded'>('default');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recorder = useRecorder({
    trailId: 'my-trail',
    trailTitle: 'My Trail',
  });

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load default tour
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
    if (trail) {
      setShowTour(true);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setTrail(json);
        setTrailSource('imported');
        setToastMessage(`Loaded: ${json.title || 'Trail'}`);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startRecording = () => {
    setShowRecorder(true);
    recorder.startRecording();
    setToastMessage('Trail recording started');
  };

  const previewRecordedTrail = () => {
    if (recorder.steps.length > 0) {
      const recordedTrail = recorder.exportTrail();
      setTrail(recordedTrail);
      setTrailSource('recorded');
      setShowTour(true);
    }
  };

  const analyticsConfig: AnalyticsConfig = {
    endpoint: 'http://localhost:3000/api/analytics',
    userId: '00000000-0000-0000-0000-000000000000', // matches seed script demo user
    debug: true,
  };

  const isRecording = showRecorder;

  return (
    <>
      <Dashboard>
        {/* Toast */}
        {toastMessage && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 20px',
            background: '#0f172a',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}>
            {toastMessage}
          </div>
        )}

        {/* Recording Banner */}
        {isRecording && (
          <div data-recorder-ui style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#ef4444',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite',
              }}/>
              <span style={{ fontSize: '14px', color: '#fca5a5', fontWeight: 500 }}>
                Recording — click any element below to add it to your trail
              </span>
            </div>
            <button
              onClick={() => { recorder.stopRecording(); setShowRecorder(false); }}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Stop Recording
            </button>
          </div>
        )}

        {/* Main Card */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
          marginBottom: '24px',
        }}>
          {/* Card Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(135deg, rgba(26,145,162,0.1) 0%, #1e293b 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#f8fafc' }}>
                Blaze a Trail
              </h1>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a91a2" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h4l2-6 3 12 2-6h3"/>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
              Click elements to record steps, then save as JSON to use in your app
            </p>
          </div>

          {/* Card Body */}
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  data-trail-id="start-recording"
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: '#1a91a2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Start Recording
                </button>
              ) : (
                <>
                  {recorder.steps.length > 0 && (
                    <>
                      <button
                        onClick={previewRecordedTrail}
                        data-trail-id="preview-recorded"
                        style={{
                          padding: '10px 20px',
                          fontSize: '14px',
                          fontWeight: 500,
                          background: '#1a91a2',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        Preview ({recorder.steps.length} steps)
                      </button>
                      <button
                        onClick={() => recorder.downloadTrail()}
                        data-trail-id="save-trail"
                        style={{
                          padding: '10px 20px',
                          fontSize: '14px',
                          fontWeight: 500,
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        Save Trail
                      </button>
                    </>
                  )}
                </>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                data-trail-id="import-trail"
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Import JSON
              </button>

              {trail && !isRecording && (
                <button
                  onClick={playTour}
                  data-trail-id="play-tour"
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: 'rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Run Trail
                </button>
              )}
            </div>

            {trailSource !== 'default' && trail && (
              <div style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#6ee7b7',
              }}>
                Loaded: <strong>{trail.title}</strong> ({trail.steps?.length || 0} steps)
              </div>
            )}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />

        {/* Sample App Section */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
          opacity: isRecording ? 1 : 0.7,
          transition: 'opacity 0.2s',
        }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: isRecording ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.03)',
          }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
              {isRecording ? 'Click any element to add a waypoint' : 'Your App (sample UI for demo)'}
            </h2>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Stats Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
            }}>
              {[
                { label: 'Total Users', value: '2,847', data: 'stat-users' },
                { label: 'Active Projects', value: '23', data: 'stat-projects' },
                { label: 'Completion Rate', value: '94%', data: 'stat-completion' },
              ].map((stat) => (
                <div
                  key={stat.data}
                  data-trail-id={stat.data}
                  style={{
                    padding: '16px',
                    background: '#0f172a',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: isRecording ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#f8fafc' }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                data-trail-id="new-project"
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#1a91a2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                New Project
              </button>
              <button
                data-trail-id="invite-team"
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
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
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                View Reports
              </button>
              <button
                data-trail-id="settings"
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: 'linear-gradient(90deg, rgba(26,145,162,0.1) 0%, rgba(15,23,42,0.5) 100%)',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#cbd5e1',
          lineHeight: 1.6,
          borderLeft: '3px solid #1a91a2',
        }}>
          <strong>Trails are just JSON.</strong> Record waypoints here, download the file, drop it in your repo.
          Load it with <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Trailguide.start(trail)</code> and you're guiding users.
        </div>
      </Dashboard>

      {/* Tour overlay */}
      {showTour && trail && (
        <Trailguide
          trail={trail}
          analytics={analyticsConfig}
          onComplete={() => {
            setShowTour(false);
            setToastMessage('Trail completed');
          }}
          onSkip={() => {
            setShowTour(false);
          }}
        />
      )}

      {/* Recorder overlay */}
      {showRecorder && <RecorderOverlay recorder={recorder} />}

      {/* Global styles */}
      <style>
        {`
          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Inter, system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            background: #0f172a;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </>
  );
}

export default App;
