import { useEffect, useState } from "react";
import MetricCard from "./MetricCard";
import { FaRoad, FaStar } from "react-icons/fa";

export default function DriverDashboard() {
  const [metrics, setMetrics] = useState({
    todayTrips: 0,
    totalTrips: 0,
    rating: 0
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/driver/metrics")
      .then(res => res.json())
      .then(data => setMetrics(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Driver Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Trips Today" value={metrics.todayTrips} color="bg-blue-500" icon={<FaRoad />} />
        <MetricCard title="Total Trips" value={metrics.totalTrips} color="bg-green-500" icon={<FaRoad />} />
        <MetricCard title="Rating" value={metrics.rating} color="bg-yellow-500" icon={<FaStar />} />
      </div>
    </div>
  );
}
