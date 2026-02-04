function LoadingSkeleton({ type = 'card', count = 1 }) {
  const renderChartSkeleton = () => (
    <div className="glass-card animate-fadeIn">
      <div className="flex justify-between items-center mb-lg">
        <div className="skeleton" style={{ width: '150px', height: '24px' }}></div>
        <div className="skeleton" style={{ width: '100px', height: '20px' }}></div>
      </div>
      
      <div style={{ height: '320px', display: 'flex', alignItems: 'end', gap: '8px' }}>
        {[...Array(7)].map((_, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div 
              className="skeleton" 
              style={{ 
                width: '100%', 
                height: `${Math.random() * 200 + 50}px`,
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
              }}
            ></div>
            <div className="skeleton" style={{ width: '100%', height: '12px' }}></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="glass-card animate-fadeIn">
      <div className="skeleton mb-md" style={{ width: '60%', height: '20px' }}></div>
      <div className="skeleton mb-sm" style={{ width: '40%', height: '32px' }}></div>
      <div className="skeleton" style={{ width: '80%', height: '16px' }}></div>
    </div>
  );

  const renderStatSkeleton = () => (
    <div className="glass-card animate-fadeIn">
      <div className="flex items-center gap-md mb-md">
        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)' }}></div>
        <div style={{ flex: 1 }}>
          <div className="skeleton mb-xs" style={{ width: '70%', height: '14px' }}></div>
          <div className="skeleton" style={{ width: '50%', height: '24px' }}></div>
        </div>
      </div>
      <div className="skeleton" style={{ width: '40%', height: '16px' }}></div>
    </div>
  );

  const renderVehicleSkeleton = () => (
    <div className="glass-card animate-fadeIn">
      <div className="skeleton mb-md" style={{ width: '100%', height: '160px', borderRadius: 'var(--radius-lg)' }}></div>
      <div className="skeleton mb-sm" style={{ width: '70%', height: '20px' }}></div>
      <div className="skeleton mb-md" style={{ width: '50%', height: '16px' }}></div>
      <div className="flex gap-xs mb-md">
        <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: 'var(--radius-pill)' }}></div>
        <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: 'var(--radius-pill)' }}></div>
      </div>
      <div className="flex justify-between items-center pt-md" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <div className="skeleton" style={{ width: '80px', height: '32px' }}></div>
        <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: 'var(--radius-md)' }}></div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="glass-card animate-fadeIn">
      <div className="skeleton mb-lg" style={{ width: '200px', height: '24px' }}></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center justify-between p-md mb-sm" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ flex: 1 }}>
            <div className="skeleton mb-xs" style={{ width: '60%', height: '16px' }}></div>
            <div className="skeleton" style={{ width: '40%', height: '14px' }}></div>
          </div>
          <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: 'var(--radius-md)' }}></div>
        </div>
      ))}
    </div>
  );

  const skeletonTypes = {
    chart: renderChartSkeleton,
    card: renderCardSkeleton,
    stat: renderStatSkeleton,
    vehicle: renderVehicleSkeleton,
    table: renderTableSkeleton
  };

  const renderSkeleton = skeletonTypes[type] || renderCardSkeleton;

  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </>
  );
}

export default LoadingSkeleton;
