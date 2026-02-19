'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Trailguide } from '@trailguide/runtime';
import type { Trail, AnalyticsConfig } from '@trailguide/runtime';
import { theme } from '@trailguide/core';
import { RecorderOverlay, useRecorder } from '@trailguide/recorder';

export default function DemoPage() {
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
    endpoint: '/api/analytics',
    userId: '00000000-0000-0000-0000-000000000000',
    debug: true,
  };

  const isRecording = showRecorder;

  return (
    <>
      {/* Dashboard layout */}
      <div style={{ minHeight: '100vh', background: theme.bgBase }}>
        {/* Header */}
        <header
          style={{
            background: theme.bgBase,
            borderBottom: `1px solid ${theme.borderSubtle}`,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <a
            href="https://gettrailguide.com"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <img src="/favicon.svg" alt="" style={{ height: '32px', width: '32px' }} />
            <span style={{ fontSize: '18px', fontWeight: 600, color: theme.textPrimary, letterSpacing: '-0.01em' }}>
              Trailguide
            </span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href="/signup"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'white',
                background: theme.accent,
                padding: '8px 16px',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              Get Started
            </a>
            <a
              href="https://github.com/hellotrailguide/trailguide"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 500,
                border: `1px solid ${theme.borderControl}`,
                borderRadius: '6px',
                background: theme.bgGlass,
                color: theme.textSecondary,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </header>

        {/* Main content */}
        <main style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto' }}>
          {/* Toast */}
          {toastMessage && (
            <div style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 20px',
              background: theme.bgBase,
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              zIndex: 9999,
              boxShadow: theme.shadowLight,
            }}>
              {toastMessage}
            </div>
          )}

          {/* Recording Banner */}
          {isRecording && (
            <div data-recorder-ui style={{
              background: theme.errorBg,
              border: `1px solid ${theme.errorBorder}`,
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
                  background: theme.error,
                  borderRadius: '50%',
                  animation: 'pulse 1.5s infinite',
                }}/>
                <span style={{ fontSize: '14px', color: theme.errorText, fontWeight: 500 }}>
                  Recording — click any element below to add it to your trail
                </span>
              </div>
              <button
                onClick={() => { recorder.stopRecording(); setShowRecorder(false); }}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: theme.error,
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
            background: theme.bgCard,
            borderRadius: '12px',
            border: `1px solid ${theme.borderSubtle}`,
            overflow: 'hidden',
            marginBottom: '24px',
          }}>
            {/* Card Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${theme.borderSubtle}`,
              background: `linear-gradient(135deg, ${theme.accentBg.replace('0.15', '0.1')} 0%, ${theme.bgCard} 100%)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: theme.textPrimary }}>
                  Blaze a Trail
                </h1>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h4l2-6 3 12 2-6h3"/>
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: theme.textMuted }}>
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
                      background: theme.accent,
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
                            background: theme.accent,
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
                            background: theme.success,
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
                    background: theme.bgGlass,
                    color: theme.textSecondary,
                    border: `1px solid ${theme.borderControl}`,
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
                      background: theme.bgGlass,
                      color: theme.textSecondary,
                      border: `1px solid ${theme.borderControl}`,
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
                  background: theme.successBg,
                  border: `1px solid ${theme.successBorder}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: theme.successText,
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
            background: theme.bgCard,
            borderRadius: '12px',
            border: `1px solid ${theme.borderSubtle}`,
            overflow: 'hidden',
            opacity: isRecording ? 1 : 0.7,
            transition: 'opacity 0.2s',
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${theme.borderSubtle}`,
              background: isRecording ? theme.warningBg : theme.bgInput,
            }}>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: theme.textPrimary }}>
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
                      background: theme.bgBase,
                      borderRadius: '8px',
                      border: `1px solid ${theme.borderSubtle}`,
                      cursor: isRecording ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{ fontSize: '24px', fontWeight: 600, color: theme.textPrimary }}>{stat.value}</div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>{stat.label}</div>
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
                    background: theme.accent,
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
                    background: theme.bgGlass,
                    color: theme.textSecondary,
                    border: `1px solid ${theme.borderControl}`,
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
                    background: theme.bgGlass,
                    color: theme.textSecondary,
                    border: `1px solid ${theme.borderControl}`,
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
                    background: theme.bgGlass,
                    color: theme.textSecondary,
                    border: `1px solid ${theme.borderControl}`,
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
            background: `linear-gradient(90deg, ${theme.accentBg.replace('0.15', '0.1')} 0%, rgba(15,23,42,0.5) 100%)`,
            borderRadius: '8px',
            fontSize: '13px',
            color: theme.textTertiary,
            lineHeight: 1.6,
            borderLeft: `3px solid ${theme.accent}`,
          }}>
            <strong>Trails are just JSON.</strong> Record waypoints here, download the file, drop it in your repo.
            Load it with <code style={{ background: theme.borderControl, padding: '2px 6px', borderRadius: '4px' }}>Trailguide.start(trail)</code> and you&#39;re guiding users.
          </div>
        </main>
      </div>

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

      {/* Scoped styles */}
      <style>
        {`
          body {
            margin: 0;
            font-family: Inter, system-ui, -apple-system, sans-serif;
            -webkit-font-smoothing: antialiased;
            background: ${theme.bgBase};
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
