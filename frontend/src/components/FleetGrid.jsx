function FleetGrid({ vehicles }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'var(--accent-green)';
      case 'In Use': return 'var(--accent-cyan)';
      case 'Maintenance': return 'var(--accent-orange)';
      case 'Charging': return 'var(--accent-purple)';
      default: return 'var(--text-secondary)';
    }
  };

  const getHealthColor = (health) => {
    if (health >= 80) return 'var(--accent-green)';
    if (health >= 50) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  };

  const getHealthStatus = (vehicle) => {
    const avgHealth = (vehicle.health.engine + vehicle.health.tires + vehicle.health.brakes) / 3;
    return avgHealth;
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-lg">
        <h2 className="text-2xl font-bold">Fleet Inventory</h2>
        <div className="flex gap-md">
          <input 
            type="text" 
            placeholder="Search vehicles..." 
            className="form-input" 
            style={{ width: '300px' }}
          />
          <button className="btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Add Vehicle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3">
        {vehicles.map((vehicle, index) => {
          const healthScore = getHealthStatus(vehicle);
          const healthColor = getHealthColor(healthScore);

          return (
            <div 
              key={vehicle.id} 
              className="glass-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-md">
                <div>
                  <h3 className="font-bold text-lg mb-xs">{vehicle.id}</h3>
                  <p className="text-sm text-secondary">{vehicle.type}</p>
                </div>
                <span 
                  className="badge"
                  style={{ 
                    background: `${getStatusColor(vehicle.status)}20`,
                    color: getStatusColor(vehicle.status),
                    border: `1px solid ${getStatusColor(vehicle.status)}`
                  }}
                >
                  {vehicle.status}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-sm mb-md p-sm rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--accent-cyan)">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm">{vehicle.location.city}</span>
              </div>

              {/* Battery/Fuel Level */}
              <div className="mb-md">
                <div className="flex justify-between items-center mb-xs">
                  <span className="text-sm text-secondary">
                    {vehicle.type === 'EV' ? 'Battery' : 'Fuel'} Level
                  </span>
                  <span className="text-sm font-semibold">{Math.round(vehicle.battery)}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${vehicle.battery}%`,
                      background: vehicle.battery > 50 ? 'var(--gradient-success)' : 
                                 vehicle.battery > 20 ? 'var(--gradient-warning)' : 
                                 'var(--gradient-danger)'
                    }}
                  ></div>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="mb-md">
                <div className="flex justify-between items-center mb-xs">
                  <span className="text-sm text-secondary">Vehicle Health</span>
                  <span className="text-sm font-semibold" style={{ color: healthColor }}>
                    {Math.round(healthScore)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-sm">
                  <div className="text-center p-xs rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="text-xs text-secondary mb-xs">Engine</div>
                    <div className="text-sm font-semibold" style={{ color: getHealthColor(vehicle.health.engine) }}>
                      {vehicle.health.engine}%
                    </div>
                  </div>
                  <div className="text-center p-xs rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="text-xs text-secondary mb-xs">Tires</div>
                    <div className="text-sm font-semibold" style={{ color: getHealthColor(vehicle.health.tires) }}>
                      {vehicle.health.tires}%
                    </div>
                  </div>
                  <div className="text-center p-xs rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="text-xs text-secondary mb-xs">Brakes</div>
                    <div className="text-sm font-semibold" style={{ color: getHealthColor(vehicle.health.brakes) }}>
                      {vehicle.health.brakes}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Mileage & Last Service */}
              <div className="flex justify-between text-xs text-tertiary pt-md" style={{ borderTop: '1px solid var(--glass-border)' }}>
                <span>{vehicle.mileage.toLocaleString()} mi</span>
                <span>Service: {vehicle.lastService}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-sm mt-md">
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                  View
                </button>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                  </svg>
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FleetGrid;
