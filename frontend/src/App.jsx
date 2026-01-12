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
        
      </Routes>
    </BrowserRouter>
  )
}

export default App
