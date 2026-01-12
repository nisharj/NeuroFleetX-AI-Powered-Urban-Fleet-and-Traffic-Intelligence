import { useEffect, useState } from "react";
import DashboardLayout from "../Layout/DashboardLayout.jsx";
import MetricCard from "../MetricCard";
import { FaUsers, FaCar, FaTruckMoving, FaClipboardList } from "react-icons/fa";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalVehicles: 0,
    activeFleets: 0,
    todayBookings: 0
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/admin/metrics", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    })
      .then(res => res.json())
      .then(setMetrics);
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Users" value={metrics.totalUsers} color="bg-blue-600" icon={<FaUsers />} />
        <MetricCard title="Total Vehicles" value={metrics.totalVehicles} color="bg-green-600" icon={<FaCar />} />
        <MetricCard title="Active Fleets" value={metrics.activeFleets} color="bg-purple-600" icon={<FaTruckMoving />} />
        <MetricCard title="Today’s Bookings" value={metrics.todayBookings} color="bg-orange-600" icon={<FaClipboardList />} />
      </div>
    </DashboardLayout>
  );
}
