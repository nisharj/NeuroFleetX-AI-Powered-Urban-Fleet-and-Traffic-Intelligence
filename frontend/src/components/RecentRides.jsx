import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "./Toast";
import api from "../services/api";

function RecentRides() {
  const navigate = useNavigate();

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(5);

  const fetchRecentRides = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await api.get("/v1/bookings/user");
      const data = Array.isArray(res.data) ? res.data : [];

      // sort latest first
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

  const isActive = (status) =>
    ["PENDING", "BROADCASTED", "ACCEPTED", "ARRIVED", "STARTED"].includes(
      status,
    );

  const isCancelled = (status) =>
    (status || "").startsWith("CANCELLED") || status === "EXPIRED";

  const filteredRides = rides.filter((ride) => {
    if (filter === "all") return true;
    if (filter === "active") return isActive(ride.status);
    if (filter === "completed") return ride.status === "COMPLETED";
    if (filter === "cancelled") return isCancelled(ride.status);
    return true;
  });

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
    const d = new Date(iso);
    return (
      d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
      ", " +
      d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const formatStatus = (status) => {
    if (!status) return "-";
    return status.replace(/_/g, " ");
  };

  const filterCounts = {
    all: rides.length,
    active: rides.filter((r) => isActive(r.status)).length,
    completed: rides.filter((r) => r.status === "COMPLETED").length,
    cancelled: rides.filter((r) => isCancelled(r.status)).length,
  };

  if (loading) {
    return (
      <div className="driver-section-card">
        <h3 className="driver-section-title">Ride History</h3>
        <div
          className="driver-section-content skeleton"
          style={{ height: 120 }}
        >
          <div className="skeleton-shimmer"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-section-card">
      <h3 className="driver-section-title">
        Ride History
        <span
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: "#64748B",
            marginLeft: 8,
          }}
        >
          ({rides.length} total)
        </span>
      </h3>

      {/* Filter Tabs */}
      <div
        className="ride-history-filters"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {[
          { key: "all", label: "All" },
          { key: "active", label: "Active" },
          { key: "completed", label: "Completed" },
          { key: "cancelled", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setFilter(tab.key);
              setVisibleCount(5);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border:
                filter === tab.key ? "2px solid #3B82F6" : "1px solid #E2E8F0",
              background: filter === tab.key ? "#EFF6FF" : "#fff",
              color: filter === tab.key ? "#3B82F6" : "#64748B",
              fontWeight: filter === tab.key ? 600 : 400,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
            <span
              style={{
                marginLeft: 6,
                background: filter === tab.key ? "#3B82F6" : "#E2E8F0",
                color: filter === tab.key ? "#fff" : "#64748B",
                borderRadius: 10,
                padding: "1px 7px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {filterCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="driver-section-content">
        {filteredRides.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "30px 0", color: "#94A3B8" }}
          >
            <p style={{ fontSize: 14 }}>
              No {filter !== "all" ? filter : ""} rides found.
            </p>
          </div>
        ) : (
          <div className="pending-requests-list">
            {filteredRides.slice(0, visibleCount).map((ride, index) => (
              <div
                key={ride.id}
                className="pending-request-item"
                style={{
                  animation: `fadeInUp 0.3s ease ${index * 0.04}s both`,
                  borderLeft: `3px solid ${
                    ride.status === "COMPLETED"
                      ? "#10B981"
                      : isActive(ride.status)
                        ? "#3B82F6"
                        : isCancelled(ride.status)
                          ? "#EF4444"
                          : "#CBD5E1"
                  }`,
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <div className="request-details">
                  {/* Route */}
                  <div className="request-route" style={{ marginBottom: 6 }}>
                    <p
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span style={{ color: "#10B981", fontSize: 16 }}>●</span>
                      <b
                        style={{ fontSize: 12, color: "#94A3B8", minWidth: 50 }}
                      >
                        Pickup
                      </b>
                      <span>{ride.pickupAddress || "-"}</span>
                    </p>
                    <p
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span style={{ color: "#EF4444", fontSize: 16 }}>●</span>
                      <b
                        style={{ fontSize: 12, color: "#94A3B8", minWidth: 50 }}
                      >
                        Drop
                      </b>
                      <span>{ride.dropAddress || "-"}</span>
                    </p>
                  </div>

                  {/* Info row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      marginTop: 8,
                    }}
                  >
                    <span className={`badge ${getBadgeClass(ride.status)}`}>
                      {formatStatus(ride.status)}
                    </span>

                    {ride.totalCost != null && (
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#1E293B",
                        }}
                      >
                        ₹{ride.totalCost.toFixed(2)}
                      </span>
                    )}

                    {ride.distanceKm != null && (
                      <span style={{ fontSize: 13, color: "#64748B" }}>
                        {ride.distanceKm} km
                      </span>
                    )}

                    {ride.vehicleType && (
                      <span
                        style={{
                          fontSize: 12,
                          color: "#94A3B8",
                          textTransform: "capitalize",
                        }}
                      >
                        {ride.vehicleType}
                      </span>
                    )}
                  </div>

                  {/* Date + Booking code */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 8,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, color: "#94A3B8" }}>
                      {formatDateTime(ride.createdAt || ride.pickupTime)}
                    </span>

                    {ride.bookingCode && (
                      <span style={{ fontSize: 12, color: "#64748B" }}>
                        Booking: <b>{ride.bookingCode}</b>
                      </span>
                    )}

                    {ride.driverName && (
                      <span style={{ fontSize: 12, color: "#64748B" }}>
                        Driver: {ride.driverName}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  {ride.status === "COMPLETED" && ride.rating != null && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 13, color: "#F59E0B" }}>
                        {"★".repeat(ride.rating)}
                        {"☆".repeat(5 - ride.rating)}
                      </span>
                      {ride.feedback && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "#94A3B8",
                            marginLeft: 8,
                            fontStyle: "italic",
                          }}
                        >
                          "{ride.feedback}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Show More / Show Less */}
            {filteredRides.length > 5 && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                {visibleCount < filteredRides.length ? (
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 5)}
                    style={{
                      padding: "8px 24px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      background: "#F8FAFC",
                      color: "#3B82F6",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Show More ({filteredRides.length - visibleCount} remaining)
                  </button>
                ) : (
                  <button
                    onClick={() => setVisibleCount(5)}
                    style={{
                      padding: "8px 24px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      background: "#F8FAFC",
                      color: "#64748B",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Show Less
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentRides;
