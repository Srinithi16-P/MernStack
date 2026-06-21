import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const ToastContainer = () => (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding:'12px 18px', borderRadius:12, fontSize:13, fontWeight:500,
          minWidth:220, boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
          background: t.type === 'error' ? '#fff2f2' : t.type === 'info' ? '#eef7ff' : '#f0fdf4',
          color: t.type === 'error' ? '#c0392b' : t.type === 'info' ? '#1a5c9e' : '#2d7a3a',
          border: `1px solid ${t.type==='error'?'#f5c6c6':t.type==='info'?'#b3d9f5':'#bbf7d0'}`,
          animation: 'slideUp 0.25s ease',
        }}>
          {t.type === 'error' ? '❌ ' : t.type === 'info' ? 'ℹ️ ' : '✅ '}{t.msg}
        </div>
      ))}
    </div>
  );

  return { toast, ToastContainer };
}