export function CreateButton() {
  return (
    <button
      id="create-button"
      style={{
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 500,
        border: 'none',
        borderRadius: '8px',
        background: '#3b82f6',
        color: 'white',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
      }}
      onClick={() => alert('Create clicked!')}
    >
      <span style={{ fontSize: '18px' }}>+</span>
      Create New
    </button>
  );
}
