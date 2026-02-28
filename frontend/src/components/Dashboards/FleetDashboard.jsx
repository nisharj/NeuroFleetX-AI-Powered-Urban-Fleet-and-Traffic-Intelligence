import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MetricCard from "../MetricCard";
import { apiFetch } from "../../api/api.js";
import DashboardLayout from "../Layout/DashboardLayout.jsx";
import VehicleSimulation from "../VehicleSimulation";
import AdminDriverApprovalPanel from "../AdminDriverApprovalPanel";
import {
  FaCar,
  FaTools,
  FaRoad,
  FaTruck,
  FaChartBar,
  FaSatelliteDish,
  FaIdCardAlt,
  FaCheckCircle,
} from "react-icons/fa";

export default function FleetDashboard() {
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("overview");
  const [metrics, setMetrics] = useState({
    totalVehicles: 0,
    vehiclesInUse: 0,
    vehiclesUnderMaintenance: 0,
  });
  const [approvedVehicles, setApprovedVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [metricsRes, vehiclesRes] = await Promise.all([
          apiFetch("/api/fleet/metrics"),
          apiFetch("/api/fleet/vehicles/approved"),
        ]);

        if (!metricsRes || !metricsRes.ok) {
          // Endpoint doesn't exist yet, use default values
          console.warn("Fleet metrics endpoint not available, using defaults");
          setMetrics({
            totalVehicles: 6,
            vehiclesInUse: 0,
            vehiclesUnderMaintenance: 0,
          });
        } else {
          const data = await metricsRes.json();
          setMetrics(data);
        }

        if (vehiclesRes && vehiclesRes.ok) {
          const vehiclesData = await vehiclesRes.json();
          const list = Array.isArray(vehiclesData) ? vehiclesData : [];
          const eligible = list.filter((v) => v.status === "AVAILABLE");
          setApprovedVehicles(eligible);
          setError("");
        } else {
          setApprovedVehicles([]);
        }
      } catch (err) {
        console.warn("Failed to load fleet metrics, using defaults:", err);
        // Use default values instead of showing error
        setMetrics({
          totalVehicles: 6,
          vehiclesInUse: 0,
          vehiclesUnderMaintenance: 0,
        });
        setApprovedVehicles([]);
        setError("Failed to load approved vehicles");
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
      {/* VIEW TABS */}
      <div className="mb-6 flex flex-wrap gap-2 bg-white p-2 rounded-lg shadow-sm">
        <button
          onClick={() => setActiveView("overview")}
          className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
            activeView === "overview"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FaChartBar />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveView("vehicles")}
          className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
            activeView === "vehicles"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FaSatelliteDish />
          <span>Vehicle Simulation</span>
        </button>
        <button
          onClick={() => setActiveView("drivers")}
          className={`flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-all ${
            activeView === "drivers"
              ? "bg-indigo-600 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FaIdCardAlt />
          <span>Driver Management</span>
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {activeView === "overview" && (
        <>
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

            <div
              onClick={() => setActiveView("vehicles")}
              className="cursor-pointer bg-green-600 text-white p-6 rounded-lg shadow hover:scale-105 transition"
            >
              <FaSatelliteDish className="text-3xl mb-3" />
              <h3 className="text-lg font-semibold">Vehicle Simulation</h3>
              <p className="text-sm opacity-90">
                Live monitoring of all registered vehicles
              </p>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FaCheckCircle className="text-green-600" />
                Approved Vehicles
              </h3>
              <span className="text-sm text-gray-500">
                {approvedVehicles.length} ready for assignment
              </span>
            </div>

            {approvedVehicles.length === 0 ? (
              <p className="px-6 py-6 text-gray-500 text-sm">
                No approved vehicles found right now.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-6 py-3 font-semibold">Vehicle</th>
                      <th className="text-left px-6 py-3 font-semibold">Type</th>
                      <th className="text-left px-6 py-3 font-semibold">Health</th>
                      <th className="text-left px-6 py-3 font-semibold">Battery</th>
                      <th className="text-left px-6 py-3 font-semibold">Location</th>
                      <th className="text-left px-6 py-3 font-semibold">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedVehicles.slice(0, 12).map((v) => (
                      <tr key={v.id} className="border-t border-gray-100">
                        <td className="px-6 py-3">
                          <p className="font-medium text-gray-900">
                            {v.vehicleNumber || v.vehicleCode || v.name}
                          </p>
                          <p className="text-xs text-gray-500">{v.vehicleCode}</p>
                        </td>
                        <td className="px-6 py-3 text-gray-700">{v.type || "N/A"}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                            {v.healthStatus || "HEALTHY"}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-700">{v.batteryLevel ?? "--"}%</td>
                        <td className="px-6 py-3 text-gray-700">
                          {v.currentCityName || "Unknown"}
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {v.rating != null ? Number(v.rating).toFixed(1) : "0.0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* VEHICLES TAB */}
      {activeView === "vehicles" && (
        <div className="animate-fadeIn">
          <VehicleSimulation />
        </div>
      )}

      {/* DRIVER MANAGEMENT TAB */}
      {activeView === "drivers" && (
        <div className="animate-fadeIn">
          <AdminDriverApprovalPanel />
        </div>
      )}
    </DashboardLayout>
  );
}
