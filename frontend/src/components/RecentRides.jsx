import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "./Toast";
import api from "../services/api";

function RecentRides() {
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ helper: check 24h expiry condition (frontend-only display)
  const isExpired24h = (ride) => {
    const created = ride?.createdAt || ride?.pickupTime;
    if (!created) return false;

    const createdTime = new Date(created).getTime();
    const now = Date.now();

    const status = ride?.status;
    const notStartedStatuses = ["PENDING", "BROADCASTED", "ACCEPTED"];

    // if already expired/cancelled/completed -> ignore
    if (
      status === "EXPIRED" ||
      status === "COMPLETED" ||
      status?.startsWith("CANCELLED")
    ) {
      return false;
    }

    // if still not started after 24 hours
    return notStartedStatuses.includes(status) && now - createdTime > 24 * 60 * 60 * 1000;
  };

  const normalizeStatus = (ride) => {
    const status = ride?.status || "UNKNOWN";

    // ✅ show expired 24h rides clearly
    if (isExpired24h(ride)) return "EXPIRED (24h)";

    // ✅ simplify cancel status
    if (status.startsWith("CANCELLED")) return "CANCELLED";

    return status;
  };

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
      CANCELLED: "badge-secondary",
      EXPIRED: "badge-secondary",
      "EXPIRED (24h)": "badge-secondary",
    };

    return statusMap[status] || "badge-secondary";
  };

  const fetchRecentRides = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // ✅ ONLY this logged-in user's bookings
      const res = await api.get("/v1/bookings/user");

      const data = Array.isArray(res.data) ? res.data : [];

      // ✅ latest first
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

      console.error("RecentRides fetch error:", err.response?.data || err.message);
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRecentRides();
  }, [fetchRecentRides]);

  const formatDateTime = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString();
  };

  if (loading) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Recent Rides</h3>
        <div className="driver-section-content skeleton" style={{ height: 120 }}>
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
          {rides.slice(0, 5).map((ride) => {
            const displayStatus = normalizeStatus(ride);

            return (
              <div key={ride.id} className="pending-request-item">
                <div className="request-details">
                  {/* ✅ Pickup/Drop exactly like your UI */}
                  <div className="request-route">
                    <p>
                      <b>Pickup:</b> {ride.pickupAddress || "-"}
                    </p>
                    <p>
                      <b>Drop:</b> {ride.dropAddress || "-"}
                    </p>
                  </div>

                  {/* ✅ Fare + distance line */}
                  <div className="request-info">
                    <span className="request-fare">
                      ₹{ride.totalCost?.toFixed?.(2) ?? "-"}
                    </span>
                    <span className="request-distance">{ride.distanceKm ?? "-"} km</span>
                  </div>

                  {/* ✅ Status badge + time */}
                  <div style={{ marginTop: 10 }}>
                    <span className={`badge ${getBadgeClass(displayStatus)}`}>
                      {displayStatus}
                    </span>

                    <span style={{ marginLeft: 10, fontSize: 12, color: "#64748B" }}>
                      {formatDateTime(ride.createdAt || ride.pickupTime)}
                    </span>
                  </div>

                  {/* ✅ Booking code */}
                  {ride.bookingCode && (
                    <p style={{ marginTop: 6, fontSize: 12, color: "#64748B" }}>
                      Booking: <b>{ride.bookingCode}</b>
                    </p>
                  )}

                  {/* ✅ Extra note for expired display */}
                  {displayStatus === "EXPIRED (24h)" && (
                    <p style={{ marginTop: 6, fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
                      ⚠ Booking expired because it was not started within 24 hours.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RecentRides;
