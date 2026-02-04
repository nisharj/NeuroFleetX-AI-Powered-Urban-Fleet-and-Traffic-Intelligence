import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "./Toast";
import api from "../services/api";

function ActiveRide() {
  const navigate = useNavigate();

  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  const ACTIVE_STATUSES = [
    "PENDING",
    "BROADCASTED",
    "ACCEPTED",
    "ARRIVED",
    "STARTED",
    "IN_PROGRESS",
    "ONGOING",
  ];

  // ✅ customer can cancel before ride starts
  const CANCELLABLE_STATUSES = ["PENDING", "BROADCASTED", "ACCEPTED"];

  const fetchActiveRide = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await api.get("/rides/customer/active");
      const data = res?.data || null;

      // hide expired
      if (!data || data.status === "EXPIRED") {
        setActiveRide(null);
        return;
      }

      // show only active statuses
      if (data?.status && !ACTIVE_STATUSES.includes(data.status)) {
        setActiveRide(null);
        return;
      }

      setActiveRide(data);
    } catch (err) {
      const status = err.response?.status;

      if (status === 404 || status === 204) {
        setActiveRide(null);
        return;
      }

      if (status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("neurofleetx_user");
        showToast("Session expired. Please login again.", "error");
        navigate("/login");
        return;
      }

      console.error("ActiveRide fetch error:", err.response?.data || err.message);
      setActiveRide(null);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // ✅ Cancel ride
  const handleCancelRide = async () => {
    if (!activeRide?.id) {
      showToast("Booking ID not found", "error");
      return;
    }

    if (!CANCELLABLE_STATUSES.includes(activeRide.status)) {
      showToast("This ride cannot be cancelled now", "error");
      return;
    }

    const ok = window.confirm("Are you sure you want to cancel this ride?");
    if (!ok) return;

    try {
      setCancelLoading(true);

      await api.post(`/v1/bookings/${activeRide.id}/cancel`, {
        reason: "Cancelled by customer",
      });

      showToast("Ride cancelled ✅", "success");
      await fetchActiveRide();
    } catch (err) {
      console.error("Cancel ride error:", err.response?.data || err.message);
      showToast(err.response?.data?.message || "Failed to cancel ride", "error");
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRide();
  }, [fetchActiveRide]);

  const getBadgeClass = (status) => {
    const map = {
      PENDING: "badge-warning",
      BROADCASTED: "badge-warning",
      ACCEPTED: "badge-info",
      ARRIVED: "badge-info",
      STARTED: "badge-danger",
      IN_PROGRESS: "badge-danger",
      ONGOING: "badge-danger",
      COMPLETED: "badge-success",
      CANCELLED_BY_CUSTOMER: "badge-secondary",
      CANCELLED_BY_DRIVER: "badge-secondary",
      CANCELLED_BY_ADMIN: "badge-secondary",
      EXPIRED: "badge-secondary",
    };
    return map[status] || "badge-secondary";
  };

  const formatDateTime = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString();
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return "-";
    return num.toFixed(2);
  };

  // ✅ LOADING UI
  if (loading) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Active Ride</h3>
        <div className="driver-section-content skeleton" style={{ height: 120 }}>
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  // ✅ EMPTY UI
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

  const canCancelRide = CANCELLABLE_STATUSES.includes(activeRide.status);

  return (
    <div className="driver-section-card">
      <h3 className="driver-section-title">Active Ride</h3>

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
              {/* ✅ Fare fallback */}
              <span className="request-fare">
                ₹{formatMoney(activeRide.totalCost ?? activeRide.fare)}
              </span>

              <span className="request-distance">
                {activeRide.distanceKm ?? activeRide.distance ?? "-"} km
              </span>
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

            {/* ✅ Cancel Ride */}
            {canCancelRide && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={handleCancelRide}
                  disabled={cancelLoading}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #fecaca",
                    background: cancelLoading ? "#fca5a5" : "#ef4444",
                    color: "white",
                    fontWeight: 600,
                    cursor: cancelLoading ? "not-allowed" : "pointer",
                    width: "fit-content",
                  }}
                >
                  {cancelLoading ? "Cancelling..." : "Cancel Ride"}
                </button>

                <p style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                  *Allowed only before ride starts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActiveRide;
