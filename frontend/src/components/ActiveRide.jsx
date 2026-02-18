import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "./Toast";
import api from "../services/api";

const ACTIVE_STATUSES = [
  "PENDING",
  "BROADCASTED",
  "ACCEPTED",
  "ARRIVED",
  "STARTED",
  "IN_PROGRESS",
  "ONGOING",
];

function ActiveRide() {
  const navigate = useNavigate();

  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "BROADCASTED":
        return "badge-warning";
      case "ACCEPTED":
        return "badge-info";
      case "ARRIVED":
        return "badge-danger";
      case "STARTED":
        return "badge-danger";
      default:
        return "badge-secondary";
    }
  };

  const fetchActiveRide = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // ✅ Fetch driver's active ride from correct endpoint
      const res = await api.get("/bookings/driver/active");

      const data = res?.data || null;

      // ✅ Hide if null or completed/expired
      if (
        !data ||
        [
          "COMPLETED",
          "EXPIRED",
          "CANCELLED_BY_DRIVER",
          "CANCELLED_BY_CUSTOMER",
          "CANCELLED_BY_ADMIN",
        ].includes(data.status)
      ) {
        setActiveRide(null);
        return;
      }

      setActiveRide(data);
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("neurofleetx_user");
        showToast("Session expired. Please login again.", "error");
        navigate("/login");
        return;
      }

      // ✅ No active ride is not an error
      if (status === 404 || status === 204) {
        setActiveRide(null);
        return;
      }

      console.error(
        "ActiveRide fetch error:",
        err.response?.data || err.message,
      );
      setActiveRide(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchActiveRide();
  }, [fetchActiveRide]);

  // ✅ Auto refresh ActiveRide if accept happens
  useEffect(() => {
    const onRideChanged = () => fetchActiveRide();
    window.addEventListener("driverRideChanged", onRideChanged);

    return () => {
      window.removeEventListener("driverRideChanged", onRideChanged);
    };
  }, [fetchActiveRide]);

  // ✅ Ride Actions
  const handleMarkArrived = async () => {
    if (!activeRide?.id) return;

    try {
      setActionLoading(true);
      await api.post(`/bookings/${activeRide.id}/arrived`);
      showToast("✅ Marked as Arrived", "success");
      await fetchActiveRide();
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
      await api.post(`/bookings/${activeRide.id}/start`);
      showToast("🚗 Ride started", "success");
      await fetchActiveRide();
      window.dispatchEvent(new Event("driverRideChanged"));
    } catch (err) {
      console.error("Start ride error:", err?.response?.data || err?.message);
      showToast(
        err?.response?.data?.message || "Failed to start ride",
        "error",
      );
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
      await api.post(`/bookings/${activeRide.id}/complete`);
      showToast("✅ Ride completed successfully", "success");
      await fetchActiveRide();
      window.dispatchEvent(new Event("driverRideChanged"));
    } catch (err) {
      console.error(
        "Complete ride error:",
        err?.response?.data || err?.message,
      );
      showToast(
        err?.response?.data?.message || "Failed to complete ride",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString();
  };

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Active Ride</h3>
        <div className="driver-section-content skeleton" style={{ height: 70 }}>
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  // ✅ Empty UI
  if (!activeRide) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Active Ride</h3>
        <div className="driver-section-content empty">
          <p className="text-secondary">No active ride right now.</p>
        </div>
      </div>
    );
  }

  // ✅ Active Ride UI (same format)
  return (
    <div className="driver-section-card">
      <h3 className="driver-section-title">Active Ride</h3>

      <div className="driver-section-content">
        <div className="pending-requests-list">
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
                  ₹{activeRide.totalCost?.toFixed?.(2) ?? "-"}
                </span>

                <span className="request-distance">
                  {activeRide.distanceKm ?? "-"} km
                </span>
              </div>

              <div style={{ marginTop: 10 }}>
                <span
                  className={`badge ${getStatusBadgeClass(activeRide.status)}`}
                >
                  {activeRide.status}
                </span>

                <span
                  style={{ marginLeft: 10, fontSize: 12, color: "#64748B" }}
                >
                  {formatDate(activeRide.createdAt)}
                </span>
              </div>

              {/* Booking code */}
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
                {activeRide.status === "ACCEPTED" && (
                  <button
                    className="btn btn-primary"
                    disabled={actionLoading}
                    onClick={handleMarkArrived}
                  >
                    {actionLoading ? "Updating..." : "Mark Arrived"}
                  </button>
                )}

                {activeRide.status === "ARRIVED" && (
                  <button
                    className="btn btn-success"
                    disabled={actionLoading}
                    onClick={handleStartRide}
                  >
                    {actionLoading ? "Updating..." : "Start Ride"}
                  </button>
                )}

                {(activeRide.status === "STARTED" ||
                  activeRide.status === "IN_PROGRESS" ||
                  activeRide.status === "ONGOING") && (
                  <button
                    className="btn btn-success"
                    disabled={actionLoading}
                    onClick={handleCompleteRide}
                    style={{ background: "#16a34a" }}
                  >
                    {actionLoading ? "Completing..." : "Complete Ride"}
                  </button>
                )}

                <button
                  className="btn btn-ghost"
                  disabled={loading || actionLoading}
                  onClick={fetchActiveRide}
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
    </div>
  );
}

export default ActiveRide;
