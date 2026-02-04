function TripHeatmap({ timeRange }) {
  // Mock data for trip density heatmap
  const cities = [
    { name: 'New York', trips: 1250, lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', trips: 980, lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', trips: 750, lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', trips: 620, lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix', trips: 540, lat: 33.4484, lng: -112.0740 },
    { name: 'Philadelphia', trips: 480, lat: 39.9526, lng: -75.1652 },
    { name: 'San Antonio', trips: 420, lat: 29.4241, lng: -98.4936 },
    { name: 'San Diego', trips: 390, lat: 32.7157, lng: -117.1611 }
  ];

  const maxTrips = Math.max(...cities.map(c => c.trips));

  const getHeatColor = (trips) => {
    const intensity = trips / maxTrips;
    if (intensity > 0.8) return 'var(--accent-red)';
    if (intensity > 0.6) return 'var(--accent-orange)';
    if (intensity > 0.4) return 'var(--accent-cyan)';
    return 'var(--accent-green)';
  };

  const getHeatSize = (trips) => {
    const intensity = trips / maxTrips;
    return 40 + (intensity * 80); // 40px to 120px
  };

  return (
    <div className="glass-card animate-fadeIn">
      <div className="flex justify-between items-center mb-lg">
        <h3 className="font-semibold">Trip Density Heatmap</h3>
        <div className="flex items-center gap-md text-xs">
          <div className="flex items-center gap-xs">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent-green)' }}></div>
            <span className="text-secondary">Low</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent-cyan)' }}></div>
            <span className="text-secondary">Medium</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent-orange)' }}></div>
            <span className="text-secondary">High</span>
          </div>
          <div className="flex items-center gap-xs">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent-red)' }}></div>
            <span className="text-secondary">Very High</span>
          </div>
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div 
        className="rounded-lg p-lg relative mb-lg"
        style={{ 
          height: '300px',
          background: 'var(--bg-tertiary)',
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }}
      >
        {cities.map((city, index) => {
          const positions = [
            { top: '20%', left: '75%' },  // New York
            { top: '45%', left: '15%' },  // Los Angeles
            { top: '25%', left: '60%' },  // Chicago
            { top: '60%', left: '50%' },  // Houston
            { top: '55%', left: '25%' },  // Phoenix
            { top: '30%', left: '80%' },  // Philadelphia
            { top: '65%', left: '45%' },  // San Antonio
            { top: '70%', left: '20%' }   // San Diego
          ];
          const pos = positions[index];
          const size = getHeatSize(city.trips);
          const color = getHeatColor(city.trips);

          return (
            <div
              key={city.name}
              className="absolute group cursor-pointer"
              style={{
                top: pos.top,
                left: pos.left,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {/* Heat circle */}
              <div
                className="rounded-full transition-all animate-pulse"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `radial-gradient(circle, ${color}80 0%, ${color}20 70%, transparent 100%)`,
                  boxShadow: `0 0 ${size / 2}px ${color}`
                }}
              ></div>

              {/* City marker */}
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: '12px',
                  height: '12px',
                  background: color,
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: `0 0 10px ${color}`
                }}
              ></div>

              {/* Tooltip - only appears on hover */}
              <div 
                className="absolute bottom-full left-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ 
                  transform: 'translateX(-50%)',
                  zIndex: '1000'
                }}
              >
                <div className="glass-card p-sm text-xs whitespace-nowrap shadow-md">
                  <div className="font-semibold mb-xs">{city.name}</div>
                  <div className="text-tertiary">{city.trips.toLocaleString()} trips</div>
                  <div className="text-tertiary text-xs">{((city.trips / cities.reduce((sum, c) => sum + c.trips, 0)) * 100).toFixed(1)}% of total</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Cities List */}
      <div style={{ paddingBottom: '24px', overflow: 'visible' }}>
        <div className="text-sm font-semibold mb-sm">Top Locations</div>
        <div className="flex flex-col gap-sm" style={{ minHeight: 'auto' }}>
          {cities.slice(0, 5).map((city, index) => (
            <div key={city.name} className="flex items-center justify-between">
              <div className="flex items-center gap-sm flex-1">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  {index + 1}
                </div>
                <span className="text-sm text-left">{city.name}</span>
              </div>
              <div className="flex items-center gap-md">
                <div className="flex-1">
                  <div className="w-32 h-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(city.trips / maxTrips) * 100}%`,
                        background: getHeatColor(city.trips)
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold mono" style={{ minWidth: '80px', textAlign: 'right' }}>
                  {city.trips.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TripHeatmap;
