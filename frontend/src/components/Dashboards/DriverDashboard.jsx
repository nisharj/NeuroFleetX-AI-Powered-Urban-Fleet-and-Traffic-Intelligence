import { useEffect, useState } from "react";
import MetricCard from "../MetricCard";
import DashboardLayout from "../Layout/DashboardLayout.jsx";
import { apiFetch } from "../../api/api";
import { FaClipboardCheck, FaCheckCircle, FaCarSide } from "react-icons/fa";

import DriverPendingRides from "../DriverPendingRides";

export default function DriverDashboard() {
  // ================= STATE =================
  const [metrics, setMetrics] = useState(null);
  const [activeRide, setActiveRide] = useState(null);

  const [metricsError, setMetricsError] = useState("");
  const [activeRideError, setActiveRideError] = useState("");

  const [loading, setLoading] = useState(true);

  // ================= LOAD METRICS =================
  const loadMetrics = async () => {
    try {
      // TODO: Replace with actual backend endpoint when available
      // For now using mock data
      setMetrics({
        assignedTrips: 0,
        completedTrips: 0,
        vehicleStatus: "Active",
      });
      setMetricsError("");
    } catch {
      setMetricsError("Unable to load metrics");
    }
  };

  // ================= LOAD ACTIVE RIDE =================
  const loadActiveRide = async () => {
    try {
      const res = await apiFetch("/api/v1/bookings/driver/active");

      // API reachable → clear error
      setActiveRideError("");

      if (!res || !res.ok) {
        throw new Error("Active ride API failed");
      }

      const text = await res.text();

      // 👇 IMPORTANT: empty response = no active ride
      if (!text) {
        setActiveRide(null);
        return;
      }

      const data = JSON.parse(text);
      setActiveRide(data || null);
    } catch (err) {
      console.error("Active ride error:", err);
      setActiveRide(null);
      setActiveRideError("Unable to load active ride");
    }
  };

  // ================= ACTIONS =================
  const startRide = async () => {
    await apiFetch(`/api/v1/bookings/${activeRide.id}/start`, {
      method: "POST",
    });
    loadActiveRide();
    loadMetrics();
  };

  const completeRide = async () => {
    await apiFetch(`/api/v1/bookings/${activeRide.id}/complete`, {
      method: "POST",
    });
    loadActiveRide();
    loadMetrics();
  };

  // ================= INIT + POLLING =================
  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([loadMetrics(), loadActiveRide()]);
      setLoading(false);
    };

    loadAll();
    const interval = setInterval(loadAll, 5000);
    return () => clearInterval(interval);
  }, []);

  // ================= LOADING STATE =================
  if (loading) {
    return (
      <DashboardLayout title="Driver Dashboard">
        <p className="p-6 text-gray-500">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  // ================= UI =================
  return (
    <DashboardLayout title="Driver Dashboard">
      <div className="p-6 space-y-8">
        {/* ================= METRICS ================= */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Overview</h2>

          {metricsError ? (
            <p className="text-red-500 text-sm">{metricsError}</p>
          ) : metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Assigned Trips"
                value={metrics.assignedTrips}
                color="bg-blue-600"
                icon={<FaClipboardCheck />}
              />
              <MetricCard
                title="Completed Trips"
                value={metrics.completedTrips}
                color="bg-green-600"
                icon={<FaCheckCircle />}
              />
              <MetricCard
                title="Vehicle Status"
                value={metrics.vehicleStatus}
                color="bg-purple-600"
                icon={<FaCarSide />}
              />
            </div>
          ) : null}
        </div>

        {/* ================= ACTIVE RIDE ================= */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Current Ride</h2>

          {activeRideError ? (
            <p className="text-red-500 text-sm">{activeRideError}</p>
          ) : activeRide ? (
            <>
              <p>
                <b>Pickup:</b> {activeRide.pickup}
              </p>
              <p>
                <b>Drop:</b> {activeRide.dropLocation}
              </p>

              <p className="mt-2">
                <b>Status:</b>{" "}
                <span className="font-semibold text-indigo-600">
                  {activeRide.status}
                </span>
              </p>

              <div className="mt-4 flex gap-4">
                {activeRide.status === "ACCEPTED" && (
                  <button
                    onClick={startRide}
                    className="bg-indigo-600 text-white px-4 py-2 rounded"
                  >
                    Start Ride
                  </button>
                )}

                {activeRide.status === "IN_PROGRESS" && (
                  <button
                    onClick={completeRide}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Complete Ride
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-500">No current ride assigned yet.</p>
          )}
        </div>

        {/* ================= PENDING RIDES ================= */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Ride Requests</h2>

          <DriverPendingRides onAction={loadActiveRide} />
        </div>
      </div>
    </DashboardLayout>
  );
}
