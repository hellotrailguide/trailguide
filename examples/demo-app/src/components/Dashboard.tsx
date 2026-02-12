interface DashboardProps {
  children: React.ReactNode;
}

export function Dashboard({ children }: DashboardProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: '#0f172a',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
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
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <img src="/favicon.svg" alt="" style={{ height: '32px', width: '32px' }} />
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', letterSpacing: '-0.01em' }}>
            Trailguide
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#1a91a2',
              background: 'rgba(26,145,162,0.15)',
              padding: '4px 10px',
              borderRadius: '12px',
              border: '1px solid rgba(26,145,162,0.3)',
            }}
          >
            Live Demo
          </span>
          <a
            href="https://github.com/brandenlanghals/trailguide"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)',
              color: '#e2e8f0',
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
      <main
        style={{
          padding: '32px 24px',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {children}
      </main>
    </div>
  );
}
