import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import adminService from "../services/adminService";
import Toast from "../components/Toast";
import PendingDriversList from "../components/PendingDriversList";
import AdminBookings from "../components/AdminBookings";
import UserManagement from "../components/UserManagement";
import AdminDriverApprovals from "../components/AdminDriverApprovals";

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
            className={`driver-tab ${view === "approvals" ? "active" : ""}`}
            onClick={() => setView("approvals")}
          >
            Account Approvals (Phase 1)
            {pendingApprovals.length > 0 && (
              <span
                className="badge badge-error ml-sm"
                style={{ fontSize: "0.7rem", padding: "2px 6px" }}
              >
                {pendingApprovals.length}
              </span>
            )}
          </button>
          <button
            className={`driver-tab ${view === "driver-approvals" ? "active" : ""}`}
            onClick={() => setView("driver-approvals")}
          >
            Ride Eligibility (Phase 2)
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
                <span className="text-secondary">
                  Pending Account Approvals
                </span>
                <span className="text-2xl">⏳</span>
              </div>
              <div className="text-4xl font-bold text-accent-orange">
                {stats.pendingApprovals}
              </div>
              <div className="text-sm text-secondary mt-xs">
                Phase 1: Account Registration
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
          <div className="animate-fadeIn">
            <UserManagement />
          </div>
        )}

        {/* Driver Verifications Tab (Phase 2) */}
        {view === "driver-approvals" && (
          <div className="animate-fadeIn">
            <div className="mb-lg">
              <h3 className="section-title mb-sm">
                Phase 2: Ride Eligibility Approvals
              </h3>
              <p className="text-secondary">
                Review and approve driver verification details (license,
                vehicle, insurance). Drivers must complete Phase 1 (account
                approval) before submitting verification. Only drivers with both
                approvals can accept ride requests.
              </p>
            </div>
            <AdminDriverApprovals />
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

        {/* Pending Approvals Tab (Phase 1) */}
        {view === "approvals" && (
          <div className="animate-fadeIn">
            <div className="mb-lg">
              <h3 className="section-title mb-sm">
                Phase 1: Account Approvals
              </h3>
              <p className="text-secondary">
                Approve new driver and fleet manager registrations. Once
                approved, they can log in to their dashboard. Drivers will then
                need to submit verification details (Phase 2) before accepting
                rides.
              </p>
            </div>
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
