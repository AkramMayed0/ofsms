'use client';

export default function StatCard({ icon, label, value, sub, color = '#1B5E8C', onClick, urgent }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        background: '#fff',
        border: `1px solid ${urgent ? color : '#edf0f5'}`,
        borderRadius: '1.1rem',
        padding: '1.3rem 1.3rem 1.1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '.35rem',
        boxShadow: urgent ? `0 0 0 3px ${color}20` : '0 2px 8px rgba(27,94,140,.06)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .18s, transform .18s',
        fontFamily: "'Cairo','Tajawal',sans-serif",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(27,94,140,.13)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = urgent ? `0 0 0 3px ${color}20` : '0 2px 8px rgba(27,94,140,.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.25rem' }}>
        <div style={{ width: 46, height: 46, borderRadius: '.875rem', background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, fontFamily: "'Cairo',sans-serif", color }}>
          {value ?? '—'}
        </div>
      </div>
      <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#4b5563' }}>{label}</div>
      {sub && <div style={{ fontSize: '.71rem', color: '#b0bac8' }}>{sub}</div>}
      <div style={{ position: 'absolute', bottom: 0, right: 0, left: 0, height: 3, background: color, borderRadius: '0 0 1.1rem 1.1rem' }} />
    </div>
  );
}
