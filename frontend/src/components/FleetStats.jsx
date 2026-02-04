function FleetStats({ vehicles }) {
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'Available').length,
    inUse: vehicles.filter(v => v.status === 'In Use').length,
    maintenance: vehicles.filter(v => v.status === 'Maintenance').length,
    avgBattery: Math.round(vehicles.reduce((acc, v) => acc + v.battery, 0) / vehicles.length)
  };

  const statCards = [
    {
      title: 'Total Fleet',
      value: stats.total,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      ),
      gradient: 'var(--gradient-primary)',
      color: 'var(--accent-purple)'
    },
    {
      title: 'Available',
      value: stats.available,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
        </svg>
      ),
      gradient: 'var(--gradient-success)',
      color: 'var(--accent-green)'
    },
    {
      title: 'In Use',
      value: stats.inUse,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2.05v3.03c3.39.49 6 3.39 6 6.92 0 .9-.18 1.75-.48 2.54l2.6 1.53c.56-1.24.88-2.62.88-4.07 0-5.18-3.95-9.45-9-9.95zM12 19c-3.87 0-7-3.13-7-7 0-3.53 2.61-6.43 6-6.92V2.05c-5.06.5-9 4.76-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-2.6-1.53C16.17 17.98 14.21 19 12 19z"/>
        </svg>
      ),
      gradient: 'var(--gradient-cyber)',
      color: 'var(--accent-cyan)'
    },
    {
      title: 'Maintenance',
      value: stats.maintenance,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
        </svg>
      ),
      gradient: 'var(--gradient-warning)',
      color: 'var(--accent-orange)'
    }
  ];

  return (
    <div className="grid grid-cols-4 mb-xl animate-fadeIn">
      {statCards.map((stat, index) => (
        <div key={index} className="glass-card" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="flex justify-between items-start mb-md">
            <div>
              <p className="text-sm text-secondary mb-xs">{stat.title}</p>
              <h2 className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</h2>
            </div>
            <div 
              className="p-md rounded-lg" 
              style={{ background: `${stat.gradient}`, opacity: 0.2 }}
            >
              {stat.icon}
            </div>
          </div>
          <div className="flex items-center gap-sm text-sm">
            <div 
              className="p-xs rounded-full" 
              style={{ background: stat.color, width: '8px', height: '8px' }}
            ></div>
            <span className="text-tertiary">
              {((stat.value / stats.total) * 100).toFixed(0)}% of fleet
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FleetStats;
