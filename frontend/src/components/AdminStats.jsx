function AdminStats({ timeRange }) {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$125,430',
      change: '+12.5%',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
        </svg>
      ),
      gradient: 'var(--gradient-success)',
      color: 'var(--accent-green)'
    },
    {
      title: 'Active Bookings',
      value: '342',
      change: '+8.2%',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
        </svg>
      ),
      gradient: 'var(--gradient-cyber)',
      color: 'var(--accent-cyan)'
    },
    {
      title: 'Fleet Utilization',
      value: '87%',
      change: '+5.3%',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      ),
      gradient: 'var(--gradient-primary)',
      color: 'var(--accent-purple)'
    },
    {
      title: 'Customer Satisfaction',
      value: '4.8/5',
      change: '+0.3',
      trend: 'up',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      ),
      gradient: 'var(--gradient-warning)',
      color: 'var(--accent-orange)'
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-md mb-xl animate-fadeIn">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="glass-card"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex justify-between items-start mb-md">
            <div>
              <p className="text-sm text-secondary mb-xs">{stat.title}</p>
              <h2 className="text-3xl font-bold mb-sm" style={{ color: stat.color }}>
                {stat.value}
              </h2>
              <div className="flex items-center gap-xs">
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 20 20" 
                  fill={stat.trend === 'up' ? 'var(--accent-green)' : 'var(--accent-red)'}
                  style={{ transform: stat.trend === 'down' ? 'rotate(180deg)' : 'none' }}
                >
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                </svg>
                <span 
                  className="text-sm font-semibold"
                  style={{ color: stat.trend === 'up' ? 'var(--accent-green)' : 'var(--accent-red)' }}
                >
                  {stat.change}
                </span>
                <span className="text-xs text-tertiary">vs last {timeRange}</span>
              </div>
            </div>
            <div 
              className="p-md rounded-lg"
              style={{ background: `${stat.gradient}`, opacity: 0.2 }}
            >
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminStats;
