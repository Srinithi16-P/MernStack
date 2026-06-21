// Spinner.jsx
export default function Spinner({ size = 36, text = '' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:48 }}>
      <div style={{
        width:size, height:size, borderRadius:'50%',
        border:'3px solid rgba(194,86,26,0.15)',
        borderTopColor:'var(--brand)',
        animation:'spin 0.7s linear infinite',
      }} />
      {text && <p style={{ color:'var(--muted)', fontSize:'0.88rem' }}>{text}</p>}
    </div>
  );
}