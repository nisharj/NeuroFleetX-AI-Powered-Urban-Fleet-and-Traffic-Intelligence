import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import adminService from "../services/adminService";
import Toast from "../components/Toast";
import PendingDriversList from "../components/PendingDriversList";
import AdminBookings from "../components/AdminBookings";

function AdminDashboard({ user, onLogout }) {
  const [view, setView] = useState("overview"); // 'overview', 'users', 'drivers', 'approvals'
  const [users, setUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, pendingData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getPendingApprovals(),
      ]);
      setUsers(usersData);
      setPendingApprovals(pendingData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setLoading(false);
      showToast("Failed to load dashboard data", "error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    fetchData();
  }, [fetchData]);

  const handleApprove = async (userId) => {
    try {
      await adminService.approveUser(userId);
      showToast("User approved successfully");
      fetchData(); // Refresh data
    } catch (error) {
      showToast(error, "error");
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this user?")) return;
    try {
      await adminService.rejectUser(userId, "Admin rejected");
      showToast("User rejected successfully");
      fetchData(); // Refresh data
    } catch (error) {
      showToast(error, "error");
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      showToast("User stats updated successfully");
      fetchData(); // Refresh data
    } catch (error) {
      showToast(error, "error");
    }
  };

  // Calculate stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    pendingApprovals: pendingApprovals.length,
    fleetManagers: users.filter((u) => u.role === "FLEET_MANAGER").length,
    drivers: users.filter((u) => u.role === "DRIVER").length,
    customers: users.filter((u) => u.role === "CUSTOMER").length,
  };

  if (loading) {
    return (
      <div
        className="app-container flex items-center justify-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={onLogout} />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="content-wrapper">
        {/* Header */}
        <div className="mb-xl animate-fadeIn">
          <h1 className="text-gradient mb-sm">Admin Dashboard</h1>
          <p className="text-secondary">System Overview and User Management</p>
        </div>

        {/* View Tabs */}
        <div className="driver-tabs mb-lg">
          <button
            className={`driver-tab ${view === "overview" ? "active" : ""}`}
            onClick={() => setView("overview")}
          >
            Overview
          </button>
          <button
            className={`driver-tab ${view === "users" ? "active" : ""}`}
            onClick={() => setView("users")}
          >
            User Management
          </button>
          <button
            className={`driver-tab ${view === "drivers" ? "active" : ""}`}
            onClick={() => setView("drivers")}
          >
            Driver Management
          </button>
          <button
            className={`driver-tab ${view === "bookings" ? "active" : ""}`}
            onClick={() => setView("bookings")}
          >
            Bookings
          </button>
          <button
            className={`driver-tab ${view === "approvals" ? "active" : ""}`}
            onClick={() => setView("approvals")}
          >
            Pending Approvals
            {pendingApprovals.length > 0 && (
              <span
                className="badge badge-error ml-sm"
                style={{ fontSize: "0.7rem", padding: "2px 6px" }}
              >
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>

        {/* Overview Tab */}
        {view === "overview" && (
          <div className="grid grid-cols-3 gap-xl mb-xl animate-fadeIn">
            {/* Stats Cards */}
            <div className="glass-card">
              <div className="flex justify-between items-center mb-md">
                <span className="text-secondary">Total Users</span>
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-4xl font-bold">{stats.totalUsers}</div>
              <div className="text-sm text-secondary mt-xs">
                {stats.activeUsers} active
              </div>
            </div>

            <div
              className="glass-card"
              style={{ cursor: "pointer" }}
              onClick={() => setView("approvals")}
            >
              <div className="flex justify-between items-center mb-md">
                <span className="text-secondary">Pending Approvals</span>
                <span className="text-2xl">⏳</span>
              </div>
              <div className="text-4xl font-bold text-accent-orange">
                {stats.pendingApprovals}
              </div>
              <div className="text-sm text-secondary mt-xs">
                Action Required
              </div>
            </div>

            <div className="glass-card">
              <div className="flex justify-between items-center mb-md">
                <span className="text-secondary">System Roles</span>
                <span className="text-2xl">🛡️</span>
              </div>
              <div className="flex flex-col gap-xs">
                <div className="flex justify-between">
                  <span>Managers</span>
                  <span className="font-bold">{stats.fleetManagers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Drivers</span>
                  <span className="font-bold">{stats.drivers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customers</span>
                  <span className="font-bold">{stats.customers}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {view === "users" && (
          <div className="glass-card animate-fadeIn">
            <h3 className="section-title mb-lg">All Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-light">
                    <th className="p-md font-semibold text-secondary">Name</th>
                    <th className="p-md font-semibold text-secondary">Email</th>
                    <th className="p-md font-semibold text-secondary">Role</th>
                    <th className="p-md font-semibold text-secondary">
                      Status
                    </th>
                    <th className="p-md font-semibold text-secondary">
                      Approval
                    </th>
                    <th className="p-md font-semibold text-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-light hover:bg-white/5 transition-colors"
                    >
                      <td className="p-md font-medium">{u.name}</td>
                      <td className="p-md text-secondary">{u.email}</td>
                      <td className="p-md">
                        <span
                          className={`badge ${
                            u.role === "ADMIN"
                              ? "badge-primary"
                              : u.role === "FLEET_MANAGER"
                                ? "badge-secondary"
                                : u.role === "DRIVER"
                                  ? "badge-success"
                                  : "badge-neutral"
                          }`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-md">
                        <span
                          className={`status-dot ${u.isActive ? "bg-success" : "bg-error"}`}
                        ></span>
                        {u.isActive ? "Active" : "Inactive"}
                      </td>
                      <td className="p-md">
                        {u.approvalStatus === "APPROVED" && (
                          <span className="text-success">Approved</span>
                        )}
                        {u.approvalStatus === "PENDING" && (
                          <span className="text-warning">Pending</span>
                        )}
                        {u.approvalStatus === "REJECTED" && (
                          <span className="text-error">Rejected</span>
                        )}
                        {!u.approvalStatus && (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                      <td className="p-md">
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`btn btn-sm ${u.isActive ? "btn-danger" : "btn-success"}`}
                          disabled={u.role === "ADMIN"}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Driver Management Tab */}
        {view === "drivers" && (
          <div className="animate-fadeIn">
            <PendingDriversList />
          </div>
        )}

        {/* Bookings Tab */}
        {view === "bookings" && (
          <div className="animate-fadeIn">
            <AdminBookings />
          </div>
        )}

        {/* Pending Approvals Tab */}
        {view === "approvals" && (
          <div className="animate-fadeIn">
            <h3 className="section-title mb-lg">Pending Approvals</h3>
            {pendingApprovals.length === 0 ? (
              <div className="glass-card text-center p-xl">
                <span className="text-4xl block mb-md">✅</span>
                <p className="text-secondary">No pending approvals found.</p>
              </div>
            ) : (
              <div className="grid gap-md">
                {pendingApprovals.map((u) => (
                  <div
                    key={u.id}
                    className="glass-card flex items-center justify-between p-lg"
                  >
                    <div className="flex items-center gap-lg">
                      <div
                        className={`p-md rounded-full ${u.role === "DRIVER" ? "bg-success/10 text-success" : "bg-secondary/10 text-secondary"}`}
                      >
                        {u.role === "DRIVER" ? "🚗" : "👔"}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{u.name}</h4>
                        <p className="text-secondary">{u.email}</p>
                        <div className="flex gap-sm mt-xs text-sm">
                          <span className="badge badge-neutral">
                            {u.role.replace("_", " ")}
                          </span>
                          <span className="text-secondary">
                            Registered:{" "}
                            {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-sm">
                      <button
                        onClick={() => handleReject(u.id)}
                        className="btn btn-danger"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(u.id)}
                        className="btn btn-success"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
