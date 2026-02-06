interface Stat {
  label: string;
  value: string;
  change?: string;
}

const stats: Stat[] = [
  { label: 'Total Projects', value: '12', change: '+2 this week' },
  { label: 'Tasks Completed', value: '48', change: '+8 today' },
  { label: 'Team Members', value: '6' },
  { label: 'Active Hours', value: '24h', change: 'This month' },
];

export function StatsPanel() {
  return (
    <div
      id="stats-panel"
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      <h2
        style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: 600,
          color: '#111827',
        }}
      >
        Your Statistics
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
        }}
      >
        {stats.map(stat => (
          <div key={stat.label}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#111827',
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: '#6b7280',
                marginTop: '2px',
              }}
            >
              {stat.label}
            </div>
            {stat.change && (
              <div
                style={{
                  fontSize: '12px',
                  color: '#10b981',
                  marginTop: '4px',
                }}
              >
                {stat.change}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
