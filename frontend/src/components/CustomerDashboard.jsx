import { useEffect, useState } from "react";
import MetricCard from "./MetricCard";
import { FaClipboardList, FaRoad, FaWallet } from "react-icons/fa";

export default function CustomerDashboard() {
  const [metrics, setMetrics] = useState({
    bookings: 0,
    activeTrips: 0,
    wallet: 0
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/customer/metrics")
      .then(res => res.json())
      .then(data => setMetrics(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Customer Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Bookings" value={metrics.bookings} color="bg-blue-500" icon={<FaClipboardList />} />
        <MetricCard title="Active Trips" value={metrics.activeTrips} color="bg-green-500" icon={<FaRoad />} />
        <MetricCard title="Wallet" value={`₹${metrics.wallet}`} color="bg-purple-500" icon={<FaWallet />} />
      </div>
    </div>
  );
}
