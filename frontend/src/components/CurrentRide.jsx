import { useState, useEffect } from 'react';

function CurrentRide({ userId }) {
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentRide();
  }, [userId]);

  const fetchCurrentRide = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/drivers/${userId}/current-ride`);
      // const data = await response.json();
      
      // No mock data - show empty state until API is implemented
      setTimeout(() => {
        setCurrentRide(null);
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error fetching current ride:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Current Ride</h3>
        <div className="driver-section-content skeleton" style={{ height: '60px' }}>
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  if (!currentRide) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Current Ride</h3>
        <div className="driver-section-content empty">
          <p className="text-secondary">No current ride assigned yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-section-card">
      <h3 className="driver-section-title">Current Ride</h3>
      <div className="driver-section-content">
        <div className="current-ride-details">
          <div className="ride-route">
            <div className="route-point">
              <div className="route-dot route-dot-pickup"></div>
              <div className="route-info">
                <span className="route-label">Pickup</span>
                <span className="route-address">{currentRide.pickup}</span>
              </div>
            </div>
            <div className="route-line"></div>
            <div className="route-point">
              <div className="route-dot route-dot-dropoff"></div>
              <div className="route-info">
                <span className="route-label">Drop</span>
                <span className="route-address">{currentRide.dropoff}</span>
              </div>
            </div>
          </div>
          <div className="ride-actions">
            <button className="btn btn-success btn-sm">Start Trip</button>
            <button className="btn btn-secondary btn-sm">Contact Customer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CurrentRide;
