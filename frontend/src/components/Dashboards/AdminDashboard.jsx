import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../Layout/DashboardLayout.jsx";
import MetricCard from "../MetricCard";
import { apiFetch } from "../../api/api";
import {
  FaUsers,
  FaCar,
  FaTruckMoving,
  FaClipboardList,
  FaTruck,
} from "react-icons/fa";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    activeFleets: 0,
    todayBookings: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiFetch("/api/admin/metrics");

        if (!res || !res.ok) {
          throw new Error("Failed to fetch admin metrics");
        }

        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load admin metrics:", err);
        setError("Unable to load admin dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <p className="p-6 text-gray-500">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Admin Dashboard">
        <p className="p-6 text-red-500">{error}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers}
          color="bg-blue-600"
          icon={<FaUsers />}
        />
        <MetricCard
          title="Total Vehicles"
          value={metrics.totalVehicles}
          color="bg-green-600"
          icon={<FaCar />}
        />
        <MetricCard
          title="Active Fleets"
          value={metrics.activeFleets}
          color="bg-purple-600"
          icon={<FaTruckMoving />}
        />
        <MetricCard
          title="Today’s Bookings"
          value={metrics.todayBookings}
          color="bg-orange-600"
          icon={<FaClipboardList />}
        />
      </div>

      {/* QUICK ACTIONS */}
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => navigate("/vehicles")}
          className="cursor-pointer bg-indigo-600 text-white p-6 rounded-lg shadow hover:scale-105 transition"
        >
          <FaTruck className="text-3xl mb-3" />
          <h3 className="text-lg font-semibold">Fleet Vehicles</h3>
          <p className="text-sm opacity-90">
            Manage and monitor fleet vehicles
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
