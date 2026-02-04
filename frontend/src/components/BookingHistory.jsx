import { useState, useEffect } from 'react';
import bookingService from '../services/bookingService';
import Toast from './Toast';

function BookingHistory({ user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'completed', 'cancelled'
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getUserBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      showToast('Failed to load booking history', 'error');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    if (filter === "active") return isActive(booking.status);
    if (filter === "completed") return booking.status === "COMPLETED";
    if (filter === "cancelled") return isCancelled(booking.status);
    return true;
  });


  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--accent-cyan)';
      case 'completed': return 'var(--accent-green)';
      case 'cancelled': return 'var(--accent-red)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return 'badge-primary';
      case 'completed': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const isActive = (status) =>
    ["PENDING","BROADCASTED","ACCEPTED","ASSIGNED","ARRIVED","STARTED"].includes(status);

  const isCancelled = (status) =>
    status?.startsWith("CANCELLED");


  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Filter Tabs */}
      <div className="flex gap-md mb-xl">
        {[
          { key: 'all', label: 'All Bookings', count: bookings.length },
          { key: 'active', label: 'Active', count: bookings.filter(b => b.status === 'active').length },
          { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
          { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
        ].map(tab => (
          <button
            key={tab.key}
            className={`btn ${filter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span 
              className="badge"
              style={{ 
                background: filter === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                marginLeft: '8px'
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="glass-card text-center py-xl">
          <svg width="64" height="64" viewBox="0 0 20 20" fill="var(--text-muted)" style={{ margin: '0 auto', opacity: 0.3 }}>
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
          <h3 className="font-semibold mt-md mb-sm">No bookings found</h3>
          <p className="text-secondary text-sm">You don't have any {filter !== 'all' ? filter : ''} bookings yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md">
          {filteredBookings.map((booking, index) => (
            <div 
              key={booking.id}
              className="glass-card"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                {/* Left Section - Booking Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-md mb-md">
                    <div>
                      <div className="flex items-center gap-sm mb-xs">
                        <h4 className="font-bold text-lg">{booking.vehicleName}</h4>
                        <span className={`badge ${getStatusBadge(booking.status)}`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-md text-sm text-secondary">
                        <span className="mono">{booking.id}</span>
                        <span>•</span>
                        <span>{booking.vehicleId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-lg mb-md">
                    {/* Location */}
                    <div>
                      <div className="flex items-center gap-xs mb-xs">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--accent-cyan)">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-xs text-secondary font-semibold">LOCATION</span>
                      </div>
                      <p className="text-sm">{booking.location}</p>
                    </div>

                    {/* Duration */}
                    <div>
                      <div className="flex items-center gap-xs mb-xs">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--accent-purple)">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-xs text-secondary font-semibold">DURATION</span>
                      </div>
                      <p className="text-sm">{booking.hours} hours</p>
                    </div>

                    {/* Dates */}
                    <div>
                      <div className="flex items-center gap-xs mb-xs">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--accent-green)">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-xs text-secondary font-semibold">DATES</span>
                      </div>
                      <p className="text-sm">{booking.startDate} → {booking.endDate}</p>
                    </div>
                  </div>

                  {/* Rating (if completed) */}
                  {booking.status === 'completed' && booking.rating && (
                    <div className="flex items-center gap-sm p-sm rounded-md" style={{ background: 'var(--bg-tertiary)', width: 'fit-content' }}>
                      <span className="text-sm text-secondary">Your Rating:</span>
                      <div className="flex items-center gap-xs">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="var(--accent-orange)">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <span className="font-semibold">{booking.rating}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Section - Price & Actions */}
                <div className="text-right">
                  <div className="mb-md">
                    <div className="text-3xl font-bold text-gradient mb-xs">
                      ${booking.totalCost}
                    </div>
                    <div className="text-xs text-secondary">
                      ${booking.pricePerHour}/hr × {booking.hours}h
                    </div>
                  </div>

                  <div className="flex flex-col gap-sm">
                    {booking.status === 'active' && (
                      <>
                        <button className="btn btn-primary btn-sm">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                          Track
                        </button>
                        <button className="btn btn-danger btn-sm">
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                          </svg>
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'completed' && (
                      <button className="btn btn-secondary btn-sm">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 004 9.528V4z"/>
                          <path fillRule="evenodd" d="M8 10a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 108 10zm-2 4a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd"/>
                        </svg>
                        Receipt
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingHistory;
