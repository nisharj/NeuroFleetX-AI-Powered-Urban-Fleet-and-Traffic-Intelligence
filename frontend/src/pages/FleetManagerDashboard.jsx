import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import FleetGrid from '../components/FleetGrid';
import FleetMap from '../components/FleetMap';
import MaintenanceAlerts from '../components/MaintenanceAlerts';
import PendingDriversList from '../components/PendingDriversList';
import FleetStats from '../components/FleetStats';

function FleetManagerDashboard({ user, onLogout }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid'); // 'grid', 'map', 'drivers'

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get('/vehicles');
        const mappedVehicles = response.data.map(v => ({
          id: v.vehicleCode || `VH-${v.id}`,
          type: v.type, // Assumes Enum matches (EV, Sedan, SUV, Van, Bike)
          status: formatStatus(v.status),
          battery: v.batteryLevel || 100,
          location: {
            lat: v.currentLatitude || 0,
            lng: v.currentLongitude || 0,
            city: v.currentCity ? v.currentCity.name : 'Unknown'
          },
          mileage: v.mileage || 0,
          lastService: v.lastMaintenanceDate ? new Date(v.lastMaintenanceDate).toISOString().split('T')[0] : 'N/A',
          health: {
            engine: v.engineHealth || 100,
            tires: v.tireHealth || 100,
            brakes: v.brakeHealth || 100
          }
        }));
        setVehicles(mappedVehicles);
      } catch (error) {
        console.error('Error fetching fleet data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchVehicles, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    // AVAILABLE -> Available, IN_USE -> In Use
    return status.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="content-wrapper">
        {/* Header */}
        <div className="flex justify-between items-center mb-xl animate-fadeIn">
          <div>
            <h1 className="text-gradient mb-sm">Fleet Management</h1>
            <p className="text-secondary">Monitor and manage your entire fleet in real-time</p>
          </div>
          <div className="flex gap-md">
            <button 
              className={`btn ${view === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('grid')}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
              Grid View
            </button>
            <button 
              className={`btn ${view === 'map' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('map')}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              Map View
            </button>
            <button 
              className={`btn ${view === 'drivers' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('drivers')}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
              Drivers
            </button>
          </div>
        </div>

        {view === 'drivers' ? (
          <PendingDriversList />
        ) : (
          <>
            {/* Fleet Statistics */}
            <FleetStats vehicles={vehicles} />

            {/* Maintenance Alerts */}
            <MaintenanceAlerts vehicles={vehicles} />

            {/* Fleet View */}
            {view === 'grid' ? (
              <FleetGrid vehicles={vehicles} />
            ) : (
              <FleetMap vehicles={vehicles} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default FleetManagerDashboard;
