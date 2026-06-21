const STEPS = ['Placed','Processing','Shipped','Out for Delivery','Delivered'];

export default function OrderStepper({ status }) {
  if (['Cancelled','Returned'].includes(status)) {
    return (
      <div style={{ textAlign:'center', padding:'20px', color:'var(--error)', fontWeight:600 }}>
        {status === 'Cancelled' ? '❌ This order was cancelled' : '🔄 Return requested'}
      </div>
    );
  }
  const current = STEPS.indexOf(status);
  return (
    <div className="order-steps">
      {STEPS.map((step, i) => (
        <div key={step} style={{ display:'contents' }}>
          <div className={`step${i < current ? ' done' : i === current ? ' active' : ''}`}>
            <div className="step-dot">{i < current ? '✓' : i === current ? '●' : ''}</div>
            <div className="step-label">{step}</div>
          </div>
          {i < STEPS.length - 1 && <div className={`step-line${i < current ? ' done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}