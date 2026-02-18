import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import adminService from "../services/adminService";
import Toast from "../components/Toast";
import PendingDriversList from "../components/PendingDriversList";
import AdminBookings from "../components/AdminBookings";
import UserManagement from "../components/UserManagement";
import AdminDriverApprovalPanel from "../components/AdminDriverApprovalPanel";

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
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            System Overview and User Management
          </p>
        </div>

        {/* View Tabs - Enhanced */}
        <div className="flex gap-2 mb-8 bg-gray-100 p-2 rounded-xl">
          <button
            className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-all duration-200 ${
              view === "overview"
                ? "bg-white text-indigo-600 shadow-md transform scale-105"
                : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
            }`}
            onClick={() => setView("overview")}
          >
            <span className="flex items-center justify-center gap-2">
              <span>📊</span>
              <span>Overview</span>
            </span>
          </button>
          <button
            className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-all duration-200 ${
              view === "users"
                ? "bg-white text-indigo-600 shadow-md transform scale-105"
                : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
            }`}
            onClick={() => setView("users")}
          >
            <span className="flex items-center justify-center gap-2">
              <span>👤</span>
              <span>Users</span>
            </span>
          </button>
          <button
            className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-all duration-200 relative ${
              view === "approvals"
                ? "bg-white text-indigo-600 shadow-md transform scale-105"
                : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
            }`}
            onClick={() => setView("approvals")}
          >
            <span className="flex items-center justify-center gap-2">
              <span>⏳</span>
              <span>Account Approvals</span>
              {pendingApprovals.length > 0 && (
                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                  {pendingApprovals.length}
                </span>
              )}
            </span>
          </button>
          <button
            className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-all duration-200 ${
              view === "driver-approvals"
                ? "bg-white text-indigo-600 shadow-md transform scale-105"
                : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
            }`}
            onClick={() => setView("driver-approvals")}
          >
            <span className="flex items-center justify-center gap-2">
              <span>🚗</span>
              <span>Ride Eligibility</span>
            </span>
          </button>
          <button
            className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-all duration-200 ${
              view === "drivers"
                ? "bg-white text-indigo-600 shadow-md transform scale-105"
                : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
            }`}
            onClick={() => setView("drivers")}
          >
            <span className="flex items-center justify-center gap-2">
              <span>🚘</span>
              <span>Drivers</span>
            </span>
          </button>
          <button
            className={`flex-1 py-3 px-4 font-semibold rounded-lg transition-all duration-200 ${
              view === "bookings"
                ? "bg-white text-indigo-600 shadow-md transform scale-105"
                : "text-gray-600 hover:text-indigo-600 hover:bg-white/50"
            }`}
            onClick={() => setView("bookings")}
          >
            <span className="flex items-center justify-center gap-2">
              <span>📅</span>
              <span>Bookings</span>
            </span>
          </button>
        </div>

        {/* Overview Tab */}
        {view === "overview" && (
          <div className="grid grid-cols-3 gap-6 mb-xl animate-fadeIn">
            {/* Total Users Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
              <div className="flex justify-between items-center mb-4">
                <span className="text-indigo-100 font-semibold">
                  Total Users
                </span>
                <span className="text-4xl">👥</span>
              </div>
              <div className="text-5xl font-bold mb-2">{stats.totalUsers}</div>
              <div className="text-sm text-indigo-100 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>{stats.activeUsers} active users</span>
              </div>
            </div>

            {/* Pending Approvals Card */}
            <div
              className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1 cursor-pointer"
              onClick={() => setView("approvals")}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-orange-100 font-semibold">
                  Pending Approvals
                </span>
                <span className="text-4xl">⏳</span>
              </div>
              <div className="text-5xl font-bold mb-2">
                {stats.pendingApprovals}
              </div>
              <div className="text-sm text-orange-100">
                Phase 1: Account Registration →
              </div>
            </div>

            {/* System Roles Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-white transform hover:-translate-y-1">
              <div className="flex justify-between items-center mb-4">
                <span className="text-emerald-100 font-semibold">
                  System Roles
                </span>
                <span className="text-4xl">🛡️</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <span className="font-medium">Managers</span>
                  <span className="font-bold text-lg">
                    {stats.fleetManagers}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <span className="font-medium">Drivers</span>
                  <span className="font-bold text-lg">{stats.drivers}</span>
                </div>
                <div className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                  <span className="font-medium">Customers</span>
                  <span className="font-bold text-lg">{stats.customers}</span>
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
            <AdminDriverApprovalPanel />
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
