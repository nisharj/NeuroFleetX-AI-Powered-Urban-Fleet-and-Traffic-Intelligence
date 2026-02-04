import { useState, useEffect } from 'react';

function DriverStats({ userId }) {
  const [stats, setStats] = useState({
    assignedTrips: 0,
    completedTrips: 0,
    vehicleStatus: 'Active'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/drivers/${userId}/stats`);
      // const data = await response.json();
      
      // No mock data - show zeros until API is implemented
      setTimeout(() => {
        setStats({
          assignedTrips: 0,
          completedTrips: 0,
          vehicleStatus: 'Active'
        });
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error fetching driver stats:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      id: 'assigned',
      label: 'Assigned Trips',
      value: stats.assignedTrips,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
      ),
      color: 'blue',
      bgColor: '#2563eb'
    },
    {
      id: 'completed',
      label: 'Completed Trips',
      value: stats.completedTrips,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      color: 'green',
      bgColor: '#16a34a'
    },
    {
      id: 'vehicle',
      label: 'Vehicle Status',
      value: stats.vehicleStatus,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      ),
      color: 'purple',
      bgColor: '#9333ea'
    }
  ];

  if (loading) {
    return (
      <div className="driver-stats-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="driver-stat-card skeleton" style={{ height: '120px' }}>
            <div className="skeleton-shimmer"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="driver-stats-grid">
      {statCards.map((stat) => (
        <div 
          key={stat.id} 
          className={`driver-stat-card driver-stat-${stat.color}`}
          style={{ background: stat.bgColor }}
        >
          <div className="driver-stat-header">
            <span className="driver-stat-label">{stat.label}</span>
            <div className="driver-stat-icon">{stat.icon}</div>
          </div>
          <div className="driver-stat-value">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

export default DriverStats;
