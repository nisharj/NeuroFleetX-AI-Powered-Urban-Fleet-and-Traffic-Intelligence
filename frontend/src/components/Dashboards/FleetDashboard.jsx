import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MetricCard from "../MetricCard";
import { apiFetch } from "../../api/api.js";
import DashboardLayout from "../Layout/DashboardLayout.jsx";
import { FaCar, FaTools, FaRoad, FaTruck } from "react-icons/fa";

export default function FleetDashboard() {
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalVehicles: 0,
    vehiclesInUse: 0,
    vehiclesUnderMaintenance: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiFetch("/api/fleet/metrics");

        if (!res || !res.ok) {
          throw new Error("Failed to fetch fleet metrics");
        }

        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load fleet metrics:", err);
        setError("Unable to load fleet metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Fleet Manager Dashboard">
        <p className="p-6 text-gray-500">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Fleet Manager Dashboard">
        <p className="p-6 text-red-500">{error}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Fleet Manager Dashboard">
      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Vehicles"
          value={metrics.totalVehicles}
          color="bg-blue-600"
          icon={<FaCar />}
        />
        <MetricCard
          title="Vehicles In Use"
          value={metrics.vehiclesInUse}
          color="bg-green-600"
          icon={<FaRoad />}
        />
        <MetricCard
          title="Under Maintenance"
          value={metrics.vehiclesUnderMaintenance}
          color="bg-red-600"
          icon={<FaTools />}
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
          <h3 className="text-lg font-semibold">Manage Vehicles</h3>
          <p className="text-sm opacity-90">
            View, update and monitor fleet vehicles
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
