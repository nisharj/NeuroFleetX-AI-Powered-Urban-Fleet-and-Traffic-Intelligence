import { useEffect, useState } from "react";
import MetricCard from "./MetricCard";
import { FaUsers, FaTruck, FaClipboardList } from "react-icons/fa";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    users: 0,
    fleet: 0,
    bookings: 0
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/admin/metrics")
      .then(res => res.json())
      .then(data => setMetrics(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Users" value={metrics.users} color="bg-purple-500" icon={<FaUsers />} />
        <MetricCard title="Fleet" value={metrics.fleet} color="bg-green-500" icon={<FaTruck />} />
        <MetricCard title="Bookings" value={metrics.bookings} color="bg-blue-500" icon={<FaClipboardList />} />
      </div>
    </div>
  );
}
