import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import FleetManagerDashboard from "./pages/FleetManagerDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import BookRidePage from "./pages/BookRidePage";

import Toast from "./components/Toast";
import "./index.css";

/**
 * ✅ ProtectedRoute Wrapper
 */
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * ✅ Dashboard Router By Role
 */
function DashboardRouter({ user, handleLogout }) {
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "admin")
    return <AdminDashboard user={user} onLogout={handleLogout} />;

  if (user.role === "fleet_manager")
    return <FleetManagerDashboard user={user} onLogout={handleLogout} />;

  if (user.role === "driver")
    return <DriverDashboard user={user} onLogout={handleLogout} />;

  return <CustomerDashboard user={user} onLogout={handleLogout} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Check existing session only once
    const storedUser = localStorage.getItem("neurofleetx_user");
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("jwt_token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user:", err);
        setUser(null);
      }
    } else {
      // clear invalid session
      localStorage.removeItem("neurofleetx_user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user_id");
      setUser(null);
    }

    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem("neurofleetx_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("neurofleetx_user");
    localStorage.removeItem("authToken");
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_id");
  };

  if (loading) {
    return (
      <div
        className="app-container flex items-center justify-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Toast />

        <Routes>
          {/* ✅ Public */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onRegister={handleLogin} />} />

          {/* ✅ Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <DashboardRouter user={user} handleLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          {/* ✅ Protected Book Ride (Customer Only) */}
          <Route
            path="/book-ride"
            element={
              <ProtectedRoute user={user}>
                {user?.role === "customer" ? (
                  <BookRidePage user={user} />
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />

          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
