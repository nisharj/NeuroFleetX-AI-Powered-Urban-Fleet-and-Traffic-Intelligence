import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "./Toast";
import api from "../services/api";

function RecentRides() {
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentRides = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // ✅ ONLY this user bookings
      const res = await api.get("/v1/bookings/user");

      const data = Array.isArray(res.data) ? res.data : [];

      // ✅ sort latest first
      data.sort((a, b) => {
        const da = new Date(a.createdAt || a.pickupTime || 0).getTime();
        const db = new Date(b.createdAt || b.pickupTime || 0).getTime();
        return db - da;
      });

      setRides(data);
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("neurofleetx_user");
        showToast("Session expired. Please login again.", "error");
        navigate("/login");
        return;
      }

      console.error(
        "RecentRides fetch error:",
        err.response?.data || err.message,
      );
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRecentRides();
  }, [fetchRecentRides]);

  const getBadgeClass = (status) => {
    const statusMap = {
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

    return statusMap[status] || "badge-secondary";
  };

  const formatDateTime = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString();
  };

  if (loading) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Recent Rides</h3>
        <div
          className="driver-section-content skeleton"
          style={{ height: 120 }}
        >
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  if (!rides.length) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Recent Rides</h3>
        <div className="driver-section-content empty">
          <p className="text-secondary">No bookings yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-section-card">
      <h3 className="driver-section-title">Recent Rides</h3>

      <div className="driver-section-content">
        <div className="pending-requests-list">
          {rides.slice(0, 5).map((ride) => (
            <div key={ride.id} className="pending-request-item">
              <div className="request-details">
                <div className="request-route">
                  <p>
                    <b>Pickup:</b> {ride.pickupAddress || "-"}
                  </p>
                  <p>
                    <b>Drop:</b> {ride.dropAddress || "-"}
                  </p>
                </div>

                <div className="request-info">
                  <span className="request-fare">
                    ₹{ride.totalCost?.toFixed?.(2) ?? "-"}
                  </span>

                  <span className="request-distance">
                    {ride.distanceKm ?? "-"} km
                  </span>
                </div>

                <div style={{ marginTop: 10 }}>
                  <span className={`badge ${getBadgeClass(ride.status)}`}>
                    {ride.status}
                  </span>

                  <span
                    style={{ marginLeft: 10, fontSize: 12, color: "#64748B" }}
                  >
                    {formatDateTime(ride.createdAt || ride.pickupTime)}
                  </span>
                </div>

                {ride.bookingCode && (
                  <p style={{ marginTop: 6, fontSize: 12, color: "#64748B" }}>
                    Booking: <b>{ride.bookingCode}</b>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RecentRides;
