import { useState, useEffect } from 'react';
import { showToast } from './Toast';

function VehicleSearch({ user }) {
  const [filters, setFilters] = useState({
    type: 'all',
    seats: 'all',
    fuelType: 'all',
    location: 'all'
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    // Simulate fetching available vehicles
    setTimeout(() => {
      setVehicles(generateMockVehicles());
      setLoading(false);
    }, 1000);
  }, []);

  const generateMockVehicles = () => {
    const types = ['EV', 'Sedan', 'SUV', 'Van', 'Bike'];
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    
    return Array.from({ length: 12 }, (_, i) => {
      const type = types[Math.floor(Math.random() * types.length)];
      return {
        id: `VH-${String(i + 1).padStart(4, '0')}`,
        type,
        name: `${type} ${['Premium', 'Deluxe', 'Standard', 'Comfort'][Math.floor(Math.random() * 4)]}`,
        seats: type === 'Bike' ? 2 : type === 'Van' ? 8 : Math.floor(Math.random() * 3) + 4,
        fuelType: type === 'EV' ? 'Electric' : Math.random() > 0.5 ? 'Petrol' : 'Diesel',
        location: locations[Math.floor(Math.random() * locations.length)],
        pricePerHour: Math.floor(Math.random() * 30) + 10,
        rating: (Math.random() * 2 + 3).toFixed(1),
        battery: Math.floor(Math.random() * 40) + 60,
        features: ['GPS', 'AC', 'Bluetooth', 'USB Charging'].slice(0, Math.floor(Math.random() * 2) + 2),
        aiRecommended: Math.random() > 0.7 // 30% chance of AI recommendation
      };
    });
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    if (filters.type !== 'all' && vehicle.type !== filters.type) return false;
    if (filters.seats !== 'all' && vehicle.seats < parseInt(filters.seats)) return false;
    if (filters.fuelType !== 'all' && vehicle.fuelType !== filters.fuelType) return false;
    if (filters.location !== 'all' && vehicle.location !== filters.location) return false;
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleBooking = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    // Simulate booking
    showToast(`Booking confirmed for ${selectedVehicle.name}!`, 'success');
    setShowBookingModal(false);
    setSelectedVehicle(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Filters */}
      <div className="glass-card mb-xl">
        <h3 className="font-semibold mb-lg flex items-center gap-sm">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--accent-cyan)">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
          </svg>
          Search Filters
        </h3>
        
        <div className="grid grid-cols-4 gap-md">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Vehicle Type</label>
            <select 
              className="form-select"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="EV">Electric Vehicle</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Van">Van</option>
              <option value="Bike">Bike</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Minimum Seats</label>
            <select 
              className="form-select"
              value={filters.seats}
              onChange={(e) => handleFilterChange('seats', e.target.value)}
            >
              <option value="all">Any</option>
              <option value="2">2+</option>
              <option value="4">4+</option>
              <option value="6">6+</option>
              <option value="8">8+</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Fuel Type</label>
            <select 
              className="form-select"
              value={filters.fuelType}
              onChange={(e) => handleFilterChange('fuelType', e.target.value)}
            >
              <option value="all">All</option>
              <option value="Electric">Electric</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location</label>
            <select 
              className="form-select"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            >
              <option value="all">All Locations</option>
              <option value="New York">New York</option>
              <option value="Los Angeles">Los Angeles</option>
              <option value="Chicago">Chicago</option>
              <option value="Houston">Houston</option>
              <option value="Phoenix">Phoenix</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-lg">
        <h3 className="font-semibold mb-sm">
          Available Vehicles ({filteredVehicles.length})
        </h3>
        <p className="text-sm text-secondary">
          AI-powered recommendations based on your preferences and history
        </p>
      </div>

      <div className="grid grid-cols-3">
        {filteredVehicles.map((vehicle, index) => (
          <div 
            key={vehicle.id}
            className="glass-card relative"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* AI Recommendation Badge */}
            {vehicle.aiRecommended && (
              <div 
                className="absolute top-4 right-4 badge badge-purple"
                style={{ 
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  boxShadow: 'var(--shadow-glow-purple)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                AI Pick
              </div>
            )}

            {/* Vehicle Image Placeholder */}
            <div 
              className="rounded-lg mb-md flex items-center justify-center"
              style={{ 
                height: '160px',
                background: 'var(--gradient-dark)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
              {vehicle.fuelType === 'Electric' && (
                <div 
                  className="absolute top-2 left-2 badge badge-success"
                  style={{ fontSize: '0.65rem' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.69 2.21L4.33 11.49c-.64.58-.28 1.65.58 1.73L13 14l-4.85 6.76c-.22.31-.19.74.08 1.01.3.3.77.31 1.08.02l10.36-9.28c.64-.58.28-1.65-.58-1.73L11 10l4.85-6.76c.22-.31.19-.74-.08-1.01-.3-.3-.77-.31-1.08-.02z"/>
                  </svg>
                  EV
                </div>
              )}
            </div>

            {/* Vehicle Info */}
            <div className="mb-md">
              <h4 className="font-bold text-lg mb-xs">{vehicle.name}</h4>
              <div className="flex items-center gap-md text-sm text-secondary mb-sm">
                <div className="flex items-center gap-xs">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                  </svg>
                  {vehicle.seats} seats
                </div>
                <div className="flex items-center gap-xs">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--accent-orange)">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  {vehicle.rating}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-sm mb-sm p-sm rounded-md" style={{ background: 'var(--bg-tertiary)' }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="var(--accent-cyan)">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm">{vehicle.location}</span>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-xs mb-md">
                {vehicle.features.map((feature, i) => (
                  <span key={i} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                    {feature}
                  </span>
                ))}
              </div>

              {/* Battery Level */}
              <div className="mb-md">
                <div className="flex justify-between items-center mb-xs">
                  <span className="text-xs text-secondary">
                    {vehicle.fuelType === 'Electric' ? 'Battery' : 'Fuel'}
                  </span>
                  <span className="text-xs font-semibold">{vehicle.battery}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${vehicle.battery}%`,
                      background: 'var(--gradient-success)'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Price & Book Button */}
            <div className="flex items-center justify-between pt-md" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <div>
                <div className="text-2xl font-bold text-gradient">${vehicle.pricePerHour}</div>
                <div className="text-xs text-secondary">per hour</div>
              </div>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => handleBooking(vehicle)}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
                Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedVehicle && (
        <div 
          className="fixed inset-0 flex items-center justify-center"
          style={{ 
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 'var(--z-modal)'
          }}
          onClick={() => setShowBookingModal(false)}
        >
          <div 
            className="glass-card animate-fadeIn"
            style={{ 
              maxWidth: '500px', 
              width: '90%',
              padding: '32px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-xl mb-lg">Confirm Booking</h3>
            
            <div className="mb-lg">
              <h4 className="font-semibold mb-sm">{selectedVehicle.name}</h4>
              <div className="p-md rounded-md" style={{ background: 'var(--bg-ghost)' }}>
                <div className="flex justify-between mb-sm">
                  <span className="text-sm text-secondary text-left">Vehicle ID</span>
                  <span className="text-sm font-semibold text-right">{selectedVehicle.id}</span>
                </div>
                <div className="flex justify-between mb-sm">
                  <span className="text-sm text-secondary text-left">Location</span>
                  <span className="text-sm font-semibold text-right">{selectedVehicle.location}</span>
                </div>
                <div className="flex justify-between mb-sm">
                  <span className="text-sm text-secondary text-left">Rate</span>
                  <span className="text-sm font-semibold text-right">${selectedVehicle.pricePerHour}/hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-secondary text-left">Rating</span>
                  <span className="text-sm font-semibold text-right">⭐ {selectedVehicle.rating}</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Pickup Date & Time</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                style={{
                  background: 'var(--bg-ghost)',
                  border: 'none',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: '1.5'
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Return Date & Time</label>
              <input 
                type="datetime-local" 
                className="form-input"
                style={{
                  background: 'var(--bg-ghost)',
                  border: 'none',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: '1.5'
                }}
              />
            </div>

            <div className="flex" style={{ gap: '16px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={confirmBooking}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleSearch;
