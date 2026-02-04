import { useState, useEffect } from 'react';

function CustomerStats({ userId }) {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    rideHistory: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/customers/${userId}/stats`);
      // const data = await response.json();
      
      // No mock data - show zeros until API is implemented
      setTimeout(() => {
        setStats({
          totalBookings: 0,
          activeBookings: 0,
          rideHistory: 0
        });
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      id: 'total',
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      color: 'blue',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'active',
      label: 'Active Booking',
      value: stats.activeBookings,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
      ),
      color: 'green',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
    },
    {
      id: 'history',
      label: 'Ride History',
      value: stats.rideHistory,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      color: 'purple',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    }
  ];

  if (loading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="stat-card skeleton" style={{ height: '120px' }}>
            <div className="skeleton-shimmer"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stats-grid">
      {statCards.map((stat) => (
        <div 
          key={stat.id} 
          className={`stat-card stat-card-${stat.color}`}
          style={{ background: stat.gradient }}
        >
          <div className="stat-card-content">
            <div className="stat-header">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-icon">{stat.icon}</div>
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CustomerStats;
