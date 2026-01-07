import { useEffect, useState } from "react";
import MetricCard from "./MetricCard";
import { FaTruck, FaUserTie, FaTools } from "react-icons/fa";

export default function FleetDashboard() {
  const [metrics, setMetrics] = useState({
    vehicles: 0,
    drivers: 0,
    maintenance: 0
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/fleet/metrics")
      .then(res => res.json())
      .then(data => setMetrics(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Fleet Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Vehicles" value={metrics.vehicles} color="bg-green-600" icon={<FaTruck />} />
        <MetricCard title="Drivers" value={metrics.drivers} color="bg-indigo-500" icon={<FaUserTie />} />
        <MetricCard title="Maintenance" value={metrics.maintenance} color="bg-red-500" icon={<FaTools />} />
      </div>
    </div>
  );
}
