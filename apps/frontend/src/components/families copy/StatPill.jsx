export default function StatPill({ label, count, color }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '.6rem 1.1rem',
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        borderRadius: '12px',
        fontFamily: "'Cairo', sans-serif",
        minWidth: '80px',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}
    >
      <span style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1, color }}>
        {count}
      </span>
      <span style={{ fontSize: '.72rem', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}
