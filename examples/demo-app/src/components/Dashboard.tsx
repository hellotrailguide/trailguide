interface DashboardProps {
  children: React.ReactNode;
}

export function Dashboard({ children }: DashboardProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
      }}
    >
      {/* Header */}
      <header
        id="dashboard-header"
        style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          Dashboard
        </h1>
        <button
          id="settings-button"
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            color: '#374151',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          Settings
        </button>
      </header>

      {/* Main content */}
      <main
        style={{
          padding: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {children}
      </main>
    </div>
  );
}
