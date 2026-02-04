<<<<<<< HEAD
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Login from "./components/Login.jsx"
import Register from "./components/Register.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import AdminDashboard from "./components/Dashboards/AdminDashboard.jsx";
import DriverDashboard from "./components/Dashboards/DriverDashboard.jsx";
import CustomerDashboard from "./components/Dashboards/CustomerDashboard.jsx";
import FleetDashboard from "./components/Dashboards/FleetDashboard.jsx";

import VehiclesPage from "./pages/VehiclesPage.jsx";
import BookRidePage from "./pages/BookRidePage";
function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/driver" element={
          <ProtectedRoute allowedRoles={["DRIVER"]}>
            <DriverDashboard />
          </ProtectedRoute>
        } />

        <Route path="/customer" element={
          <ProtectedRoute allowedRoles={["CUSTOMER"]}>
            <CustomerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/fleet" element={
          <ProtectedRoute allowedRoles={["FLEET_MANAGER"]}>
            <FleetDashboard />
          </ProtectedRoute>
        } />

        <Route path="/vehicles" element={
          <ProtectedRoute allowedRoles={["ADMIN","FLEET_MANAGER"]}>
            <VehiclesPage />
          </ProtectedRoute>
        } />

        <Route
          path="/customer/book"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <BookRidePage />
            </ProtectedRoute>
          }
        />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App
=======
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
>>>>>>> 6052cd2 (Initial commit: NeuroFleetX platform with Java 17 backend)
