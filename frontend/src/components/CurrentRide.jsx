import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "./Toast";
import api from "../services/api";

function CurrentRide() {
  const navigate = useNavigate();

  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ✅ Fetch Active Ride for driver
  const fetchDriverActiveRide = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // ✅ Backend endpoint: driver active ride
      const res = await api.get("/v1/bookings/driver/active");
      const data = res?.data || null;

      // ✅ Hide if null or completed/expired
      if (!data || ["COMPLETED", "EXPIRED"].includes(data.status)) {
        setActiveRide(null);
        return;
      }

      setActiveRide(data);
    } catch (err) {
      const status = err?.response?.status;

      // ✅ No active ride
      if (status === 204 || status === 404) {
        setActiveRide(null);
        return;
      }

      // ✅ Unauthorized
      if (status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("neurofleetx_user");
        showToast("Session expired. Please login again.", "error");
        navigate("/login");
        return;
      }

      console.error(
        "CurrentRide fetch error:",
        err?.response?.data || err?.message,
      );
      setActiveRide(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ✅ Ride Actions
  const handleMarkArrived = async () => {
    if (!activeRide?.id) return;

    try {
      setActionLoading(true);

      await api.post(`/v1/bookings/${activeRide.id}/arrived`);
      showToast("✅ Marked as Arrived", "success");

      // ✅ Auto refresh
      await fetchDriverActiveRide();

      // ✅ notify other components
      window.dispatchEvent(new Event("driverRideChanged"));
    } catch (err) {
      console.error("Mark arrived error:", err?.response?.data || err?.message);
      showToast(
        err?.response?.data?.message || "Failed to mark arrived",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartRide = async () => {
    if (!activeRide?.id) return;

    try {
      setActionLoading(true);

      await api.post(`/v1/bookings/${activeRide.id}/start`);
      showToast("🚗 Ride started", "success");

      // ✅ Auto refresh
      await fetchDriverActiveRide();

      // ✅ notify other components
      window.dispatchEvent(new Event("driverRideChanged"));
    } catch (err) {
      console.error("Start ride error:", err?.response?.data || err?.message);
      showToast(err?.response?.data?.message || "Failed to start ride", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRide = async () => {
    if (!activeRide?.id) return;

    const confirmComplete = window.confirm(
      "Are you sure you want to complete this ride?",
    );
    if (!confirmComplete) return;

    try {
      setActionLoading(true);

      await api.post(`/v1/bookings/${activeRide.id}/complete`);
      showToast("✅ Ride completed successfully", "success");

      // ✅ Auto refresh
      await fetchDriverActiveRide();

      // ✅ notify other components
      window.dispatchEvent(new Event("driverRideChanged"));
    } catch (err) {
      console.error("Complete ride error:", err?.response?.data || err?.message);
      showToast(
        err?.response?.data?.message || "Failed to complete ride",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverActiveRide();
  }, [fetchDriverActiveRide]);

  // ✅ Auto refresh CurrentRide if accept happens in PendingRideRequests.jsx
  useEffect(() => {
    const onRideChanged = () => fetchDriverActiveRide();
    window.addEventListener("driverRideChanged", onRideChanged);

    return () => {
      window.removeEventListener("driverRideChanged", onRideChanged);
    };
  }, [fetchDriverActiveRide]);

  const formatDateTime = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString();
  };

  const getBadgeClass = (status) => {
    const statusMap = {
      ACCEPTED: "badge-info",
      ARRIVED: "badge-info",
      STARTED: "badge-danger",
      COMPLETED: "badge-success",
      CANCELLED_BY_CUSTOMER: "badge-secondary",
      CANCELLED_BY_DRIVER: "badge-secondary",
      CANCELLED_BY_ADMIN: "badge-secondary",
      EXPIRED: "badge-secondary",
    };
    return statusMap[status] || "badge-secondary";
  };

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Current Trip</h3>
        <div className="driver-section-content skeleton" style={{ height: 120 }}>
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  // ✅ Empty UI
  if (!activeRide) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Current Trip</h3>
        <div className="driver-section-content empty">
          <p className="text-secondary">No active trip right now.</p>
        </div>
      </div>
    );
  }

  // ✅ Button visibility logic
  const showArrivedBtn = activeRide.status === "ACCEPTED";
  const showStartBtn = activeRide.status === "ARRIVED";
  const showCompleteBtn = activeRide.status === "STARTED";

  return (
    <div className="driver-section-card">
      <h3 className="driver-section-title">Current Trip</h3>

      <div className="driver-section-content">
        <div className="pending-request-item">
          <div className="request-details">
            <div className="request-route">
              <p>
                <b>Pickup:</b> {activeRide.pickupAddress || "-"}
              </p>
              <p>
                <b>Drop:</b> {activeRide.dropAddress || "-"}
              </p>
            </div>

            <div className="request-info">
              <span className="request-fare">
                ₹{Number(activeRide.totalCost || 0).toFixed(2)}
              </span>

              <span className="request-distance">
                {Number(activeRide.distanceKm || 0).toFixed(2)} km
              </span>

              {activeRide.requestedVehicleType && (
                <span className="badge badge-secondary ml-sm">
                  {activeRide.requestedVehicleType}
                </span>
              )}
            </div>

            <div style={{ marginTop: 10 }}>
              <span className={`badge ${getBadgeClass(activeRide.status)}`}>
                {activeRide.status}
              </span>
              <span style={{ marginLeft: 10, fontSize: 12, color: "#64748B" }}>
                {formatDateTime(activeRide.createdAt || activeRide.pickupTime)}
              </span>
            </div>

            {activeRide.bookingCode && (
              <p style={{ marginTop: 6, fontSize: 12, color: "#64748B" }}>
                Booking: <b>{activeRide.bookingCode}</b>
              </p>
            )}

            {/* ✅ ACTION BUTTONS */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {showArrivedBtn && (
                <button
                  className="btn btn-primary"
                  disabled={actionLoading}
                  onClick={handleMarkArrived}
                >
                  {actionLoading ? "Updating..." : "Mark Arrived"}
                </button>
              )}

              {showStartBtn && (
                <button
                  className="btn btn-success"
                  disabled={actionLoading}
                  onClick={handleStartRide}
                >
                  {actionLoading ? "Updating..." : "Start Ride"}
                </button>
              )}

              {showCompleteBtn && (
                <button
                  className="btn btn-success"
                  disabled={actionLoading}
                  onClick={handleCompleteRide}
                  style={{ background: "#16a34a" }}
                >
                  {actionLoading ? "Completing..." : "Complete Ride"}
                </button>
              )}

              {/* Manual refresh */}
              <button
                className="btn btn-ghost"
                disabled={loading || actionLoading}
                onClick={fetchDriverActiveRide}
              >
                Refresh
              </button>
            </div>

            <p style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
              *Buttons appear based on ride status
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CurrentRide;
