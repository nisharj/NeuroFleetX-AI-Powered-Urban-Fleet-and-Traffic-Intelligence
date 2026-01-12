import { useEffect, useState } from "react";
import MetricCard from "../MetricCard";
import DashboardLayout from "../Layout/DashboardLayout.jsx";
import { FaCar, FaTools, FaRoad } from "react-icons/fa";

export default function FleetDashboard() {
  const [metrics, setMetrics] = useState({
    totalVehicles: 0,
    vehiclesInUse: 0,
    vehiclesUnderMaintenance: 0,
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/fleet/metrics", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch(console.error);
  }, []);

  return (
    <DashboardLayout title="Fleet Manager Dashboard">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard title="Total Vehicles" value={metrics.totalVehicles} color="bg-blue-600" icon={<FaCar />} />
          <MetricCard title="Vehicles In Use" value={metrics.vehiclesInUse} color="bg-green-600" icon={<FaRoad />} />
          <MetricCard title="Vehicles Under Maintenance" value={metrics.vehiclesUnderMaintenance} color="bg-red-600" icon={<FaTools />} />
        </div>
      </div>
    </DashboardLayout>
  );
}
