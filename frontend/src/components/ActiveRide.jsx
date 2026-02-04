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
  "ONGOING"        
];


function ActiveRide() {
  const navigate = useNavigate();

  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);

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

      // ✅ Fetch all user bookings then filter active
      const res = await api.get("/v1/bookings/user");

      const data = Array.isArray(res.data) ? res.data : [];

      const active = data.find((b) => ACTIVE_STATUSES.includes(b.status));

      setActiveRide(active || null);
    } catch (err) {
      const status = err.response?.status;

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

  useEffect(() => {
    fetchActiveRide();
  }, [fetchActiveRide]);

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

                <span style={{ marginLeft: 10, fontSize: 12, color: "#64748B" }}>
                  {formatDate(activeRide.createdAt)}
                </span>
              </div>

              {/* Booking code */}
              {activeRide.bookingCode && (
                <p style={{ marginTop: 6, fontSize: 12, color: "#64748B" }}>
                  Booking: <b>{activeRide.bookingCode}</b>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActiveRide;
