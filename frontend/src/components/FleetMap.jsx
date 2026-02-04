import { useState } from 'react';

function FleetMap({ vehicles }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Group vehicles by city for the map visualization
  const vehiclesByCity = vehicles.reduce((acc, vehicle) => {
    const city = vehicle.location.city;
    if (!acc[city]) {
      acc[city] = [];
    }
    acc[city].push(vehicle);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'var(--accent-green)';
      case 'In Use': return 'var(--accent-cyan)';
      case 'Maintenance': return 'var(--accent-orange)';
      case 'Charging': return 'var(--accent-purple)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-lg">Fleet Map View</h2>
      
      <div className="grid grid-cols-3 gap-xl">
        {/* Map Visualization */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <div className="mb-md flex justify-between items-center">
            <h3 className="font-semibold">Real-Time Fleet Distribution</h3>
            <div className="flex gap-sm">
              <span className="badge badge-success">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-green)' }}></div>
                Live Tracking
              </span>
            </div>
          </div>

          {/* Simplified Map Representation */}
          <div 
            className="rounded-lg p-xl relative"
            style={{ 
              background: 'var(--bg-tertiary)',
              minHeight: '600px',
              backgroundImage: `
                linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          >
            {/* City Clusters */}
            {Object.entries(vehiclesByCity).map(([city, cityVehicles], index) => {
              const positions = [
                { top: '15%', left: '20%' },
                { top: '40%', left: '70%' },
                { top: '65%', left: '30%' },
                { top: '25%', left: '85%' },
                { top: '75%', left: '60%' }
              ];
              const pos = positions[index % positions.length];

              return (
                <div
                  key={city}
                  className="absolute"
                  style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                >
                  {/* City Label */}
                  <div className="text-center mb-sm">
                    <div className="badge badge-primary mb-xs">{city}</div>
                    <div className="text-xs text-secondary">{cityVehicles.length} vehicles</div>
                  </div>

                  {/* Vehicle Pins */}
                  <div className="flex flex-wrap gap-xs justify-center" style={{ maxWidth: '200px' }}>
                    {cityVehicles.slice(0, 8).map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="cursor-pointer transition-all"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: getStatusColor(vehicle.status),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 0 20px ${getStatusColor(vehicle.status)}`,
                          transform: selectedVehicle?.id === vehicle.id ? 'scale(1.3)' : 'scale(1)',
                          border: selectedVehicle?.id === vehicle.id ? '2px solid white' : 'none'
                        }}
                        onClick={() => setSelectedVehicle(vehicle)}
                        title={vehicle.id}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z"/>
                        </svg>
                      </div>
                    ))}
                    {cityVehicles.length > 8 && (
                      <div
                        className="flex items-center justify-center text-xs font-semibold"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--bg-secondary)',
                          border: '2px solid var(--glass-border)'
                        }}
                      >
                        +{cityVehicles.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 glass-card p-md">
              <div className="text-xs font-semibold mb-sm text-secondary">STATUS LEGEND</div>
              <div className="flex flex-col gap-xs">
                {['Available', 'In Use', 'Maintenance', 'Charging'].map((status) => (
                  <div key={status} className="flex items-center gap-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: getStatusColor(status) }}
                    ></div>
                    <span className="text-xs">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Details Panel */}
        <div className="glass-card">
          <h3 className="font-semibold mb-md">Vehicle Details</h3>
          
          {selectedVehicle ? (
            <div className="animate-fadeIn">
              <div className="mb-lg">
                <div className="flex justify-between items-start mb-md">
                  <div>
                    <h4 className="font-bold text-xl mb-xs">{selectedVehicle.id}</h4>
                    <p className="text-sm text-secondary">{selectedVehicle.type}</p>
                  </div>
                  <span 
                    className="badge"
                    style={{ 
                      background: `${getStatusColor(selectedVehicle.status)}20`,
                      color: getStatusColor(selectedVehicle.status),
                      border: `1px solid ${getStatusColor(selectedVehicle.status)}`
                    }}
                  >
                    {selectedVehicle.status}
                  </span>
                </div>

                {/* Location */}
                <div className="p-md rounded-md mb-md" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="flex items-center gap-sm mb-xs">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--accent-cyan)">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm font-semibold">Location</span>
                  </div>
                  <p className="text-sm text-secondary">{selectedVehicle.location.city}</p>
                  <p className="text-xs text-tertiary mono mt-xs">
                    {selectedVehicle.location.lat.toFixed(4)}, {selectedVehicle.location.lng.toFixed(4)}
                  </p>
                </div>

                {/* Battery/Fuel */}
                <div className="mb-md">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="text-sm font-semibold">
                      {selectedVehicle.type === 'EV' ? 'Battery' : 'Fuel'} Level
                    </span>
                    <span className="text-sm font-semibold">{Math.round(selectedVehicle.battery)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${selectedVehicle.battery}%`,
                        background: selectedVehicle.battery > 50 ? 'var(--gradient-success)' : 
                                   selectedVehicle.battery > 20 ? 'var(--gradient-warning)' : 
                                   'var(--gradient-danger)'
                      }}
                    ></div>
                  </div>
                </div>

                {/* Health Metrics */}
                <div className="mb-md">
                  <div className="text-sm font-semibold mb-sm">Health Metrics</div>
                  <div className="flex flex-col gap-sm">
                    {Object.entries(selectedVehicle.health).map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-xs">
                          <span className="text-xs text-secondary capitalize">{key}</span>
                          <span className="text-xs font-semibold">{value}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${value}%`,
                              background: value >= 80 ? 'var(--accent-green)' : 
                                         value >= 50 ? 'var(--accent-orange)' : 
                                         'var(--accent-red)'
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="p-md rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="flex justify-between mb-xs">
                    <span className="text-xs text-secondary">Mileage</span>
                    <span className="text-xs font-semibold">{selectedVehicle.mileage.toLocaleString()} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-secondary">Last Service</span>
                    <span className="text-xs font-semibold">{selectedVehicle.lastService}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-sm mt-lg">
                  <button className="btn btn-primary btn-sm">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    Track Route
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                    Edit Details
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-xl">
              <svg width="64" height="64" viewBox="0 0 20 20" fill="var(--text-muted)" style={{ margin: '0 auto', opacity: 0.3 }}>
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <p className="text-secondary mt-md">Select a vehicle on the map to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FleetMap;
