import { useState, useEffect } from 'react';
import api from '../services/api';

function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch drivers
      const driversRes = await api.get('/admin/drivers');
      setDrivers(driversRes.data);

      // Fetch pending approvals
      const pendingRes = await api.get('/admin/pending-approvals');
      setPendingDrivers(pendingRes.data);
    } catch (error) {
      console.error('Error fetching driver data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      setProcessing(id);
      await api.post(`/admin/approve-user/${id}`);
      // Refresh data
      await fetchData();
    } catch (error) {
      alert('Failed to approve driver: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this driver?')) return;
    
    try {
      setProcessing(id);
      await api.post(`/admin/reject-user/${id}`);
      // Refresh data
      await fetchData();
    } catch (error) {
      alert('Failed to reject driver: ' + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(null);
    }
  };

  if (loading && drivers.length === 0) {
    return <div className="text-center p-xl">Loading driver data...</div>;
  }

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-lg">Driver Management</h2>

      {/* Pending Approvals Section */}
      {pendingDrivers.length > 0 && (
        <div className="mb-xl">
          <h3 className="text-xl font-semibold mb-md text-gradient">Pending Approvals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {pendingDrivers.map(driver => (
              <div key={driver.id} className="glass-card border-l-4 border-yellow-500">
                <div className="flex justify-between items-start mb-sm">
                  <div>
                    <h4 className="font-bold text-lg">{driver.name}</h4>
                    <span className="badge badge-warning text-xs">Pending Approval</span>
                  </div>
                  <div className="p-xs bg-yellow-500/10 rounded-full">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--color-warning)">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="text-sm text-secondary mb-md space-y-xs">
                  <div className="flex items-center gap-xs">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                    {driver.email}
                  </div>
                  <div className="flex items-center gap-xs">
                     <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                    {driver.phone || 'No phone'}
                  </div>
                  <div className="flex items-center gap-xs">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>
                    Registered: {new Date(driver.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-sm mt-md">
                  <button 
                    onClick={() => handleApprove(driver.id)}
                    disabled={processing === driver.id}
                    className="btn btn-primary flex-1 py-1 text-sm flex justify-center items-center gap-xs"
                  >
                    {processing === driver.id ? 'Processing...' : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                        Approve
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleReject(driver.id)}
                    disabled={processing === driver.id}
                    className="btn bg-red-500/10 text-red-500 hover:bg-red-500/20 flex-1 py-1 text-sm flex justify-center items-center gap-xs"
                  >
                     <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg>
                     Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Drivers List */}
      <div className="glass-card">
        <div className="flex justify-between items-center mb-lg">
          <h3 className="text-xl font-semibold">Active Drivers</h3>
          <span className="text-sm text-secondary">{drivers.length} total drivers</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-secondary text-sm">
                <th className="p-md font-medium">Name</th>
                <th className="p-md font-medium">Contact</th>
                <th className="p-md font-medium">Role</th>
                <th className="p-md font-medium">Status</th>
                <th className="p-md font-medium">Joined</th>
                <th className="p-md font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length > 0 ? (
                drivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-md">
                      <div className="font-medium">{driver.name}</div>
                      <div className="text-xs text-secondary">ID: {driver.id}</div>
                    </td>
                    <td className="p-md text-sm">
                      <div>{driver.email}</div>
                      <div className="text-xs text-secondary">{driver.phone || 'N/A'}</div>
                    </td>
                    <td className="p-md">
                      <span className="badge badge-primary text-xs">{driver.role}</span>
                    </td>
                    <td className="p-md">
                      <span className={`badge ${driver.isActive ? 'badge-success' : 'badge-danger'} text-xs`}>
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-md text-sm text-secondary">
                      {new Date(driver.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="p-md">
                      <button className="text-accent-cyan hover:text-white text-sm">View Details</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-xl text-center text-secondary">
                    No active drivers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DriverManagement;
