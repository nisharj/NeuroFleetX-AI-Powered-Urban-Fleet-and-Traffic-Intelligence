function MaintenanceAlerts({ vehicles }) {
  // Calculate vehicles needing maintenance based on health metrics
  const maintenanceNeeded = vehicles
    .map(vehicle => {
      const avgHealth = (vehicle.health.engine + vehicle.health.tires + vehicle.health.brakes) / 3;
      const criticalComponents = [];
      
      if (vehicle.health.engine < 50) criticalComponents.push('Engine');
      if (vehicle.health.tires < 50) criticalComponents.push('Tires');
      if (vehicle.health.brakes < 50) criticalComponents.push('Brakes');

      return {
        ...vehicle,
        avgHealth,
        criticalComponents,
        priority: avgHealth < 30 ? 'critical' : avgHealth < 60 ? 'high' : 'medium'
      };
    })
    .filter(v => v.avgHealth < 70)
    .sort((a, b) => a.avgHealth - b.avgHealth);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'var(--accent-red)';
      case 'high': return 'var(--accent-orange)';
      case 'medium': return 'var(--accent-cyan)';
      default: return 'var(--text-secondary)';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-primary';
      default: return 'badge-secondary';
    }
  };

  if (maintenanceNeeded.length === 0) {
    return null;
  }

  return (
    <div className="glass-card mb-xl animate-fadeIn" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'var(--accent-red)' }}>
      <div className="flex items-center gap-md mb-lg">
        <div className="p-md rounded-lg" style={{ background: 'var(--gradient-danger)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-lg">Predictive Maintenance Alerts</h3>
          <p className="text-sm text-secondary">
            {maintenanceNeeded.length} vehicle{maintenanceNeeded.length !== 1 ? 's' : ''} require{maintenanceNeeded.length === 1 ? 's' : ''} attention
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-md">
        {maintenanceNeeded.slice(0, 5).map((vehicle, index) => (
          <div 
            key={vehicle.id}
            className="p-md rounded-lg flex items-center justify-between"
            style={{ 
              background: 'var(--bg-tertiary)',
              border: `1px solid ${getPriorityColor(vehicle.priority)}40`,
              animationDelay: `${index * 100}ms`
            }}
          >
            <div className="flex items-center gap-md flex-1">
              {/* Priority Indicator */}
              <div 
                className="w-1 h-12 rounded-full"
                style={{ background: getPriorityColor(vehicle.priority) }}
              ></div>

              {/* Vehicle Info */}
              <div className="flex-1">
                <div className="flex items-center gap-sm mb-xs">
                  <span className="font-bold">{vehicle.id}</span>
                  <span className="text-sm text-secondary">•</span>
                  <span className="text-sm text-secondary">{vehicle.type}</span>
                  <span className={`badge ${getPriorityBadge(vehicle.priority)}`}>
                    {vehicle.priority.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center gap-lg">
                  {/* Health Score */}
                  <div className="flex items-center gap-sm">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill={getPriorityColor(vehicle.priority)}>
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm">
                      Health: <span className="font-semibold" style={{ color: getPriorityColor(vehicle.priority) }}>
                        {Math.round(vehicle.avgHealth)}%
                      </span>
                    </span>
                  </div>

                  {/* Critical Components */}
                  {vehicle.criticalComponents.length > 0 && (
                    <div className="flex items-center gap-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent-orange)">
                        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
                      </svg>
                      <span className="text-sm text-secondary">
                        {vehicle.criticalComponents.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Mileage */}
                  <div className="flex items-center gap-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-muted)">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <span className="text-sm text-tertiary">
                      {vehicle.mileage.toLocaleString()} mi
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-sm">
                <button className="btn btn-warning btn-sm">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                  Schedule
                </button>
                <button className="btn btn-secondary btn-sm">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {maintenanceNeeded.length > 5 && (
        <div className="text-center mt-md">
          <button className="btn btn-ghost btn-sm">
            View All {maintenanceNeeded.length} Alerts
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default MaintenanceAlerts;
