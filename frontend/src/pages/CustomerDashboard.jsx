import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import CustomerStats from "../components/CustomerStats";
import ActiveRide from "../components/ActiveRide";
import RecentRides from "../components/RecentRides";
import { FaPlus } from "react-icons/fa";
import api from "../services/api";
import "./CustomerDashboard.css";

function CustomerDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const wsRef = useRef(null);

  const [activeRide, setActiveRide] = useState(null);
  const [recentRides, setRecentRides] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("authToken");

  const setupWebSocket = useCallback(() => {
    console.log("WebSocket feature not enabled yet");
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        navigate("/login");
        return;
      }

      // ✅ Correct backend API
      const res = await api.get("/v1/bookings/user");
      const bookings = Array.isArray(res.data) ? res.data : [];

      // ✅ recent bookings
      setRecentRides(bookings.slice(0, 5));

      // ✅ find active booking
      const active = bookings.find((b) =>
        ["BROADCASTED", "ACCEPTED", "ARRIVED", "STARTED"].includes(b.status),
      );

      setActiveRide(active || null);
    } catch (err) {
      console.error(
        "Dashboard fetch error:",
        err.response?.data || err.message,
      );

      if (err.response?.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("neurofleetx_user");
        navigate("/login");
        return;
      }

      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  useEffect(() => {
    loadDashboard();
    setupWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [loadDashboard, setupWebSocket]);

  if (loading) {
    return (
      <div className="app-container">
        <Navbar user={user} onLogout={onLogout} />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={onLogout} />

      <div className="content-wrapper">
        {/* TOP HEADER */}
        <div className="dashboard-top">
          <div>
            <h1 className="text-gradient">Customer Dashboard</h1>
            <p className="text-secondary">
              Track active rides and view recent bookings
            </p>
          </div>

          {/* Book Ride Button */}
          <button
            className="btn btn-primary"
            onClick={() => navigate("/book-ride")}
          >
            <FaPlus style={{ marginRight: "8px" }} />
            Book Ride
          </button>
        </div>

        {/* Metrics */}
        {user && <CustomerStats userId={user.id} />}

        {error && <div className="alert alert-error">{error}</div>}

        {/* ✅ Only 2 Sections */}
        <div className="rides-overview">
          <div className="active-ride-section">
            <ActiveRide activeRide={activeRide} onRefresh={loadDashboard} />
          </div>

          <div className="recent-rides-section">
            <RecentRides rides={recentRides} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;
