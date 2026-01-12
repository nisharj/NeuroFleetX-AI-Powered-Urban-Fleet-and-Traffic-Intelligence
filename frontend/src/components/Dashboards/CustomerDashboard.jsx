import { useEffect, useState } from "react";
import MetricCard from "../MetricCard";
import DashboardLayout from "../Layout/DashboardLayout";
import { FaBook, FaPlayCircle, FaHistory } from "react-icons/fa";

export default function CustomerDashboard() {
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    activeBooking: 0,
    rideHistoryCount: 0,
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/customer/metrics", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch(console.error);
  }, []);

  return (
    <DashboardLayout title="Customer Dashboard">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard title="Total Bookings" value={metrics.totalBookings} color="bg-blue-600" icon={<FaBook />} />
          <MetricCard title="Active Booking" value={metrics.activeBooking} color="bg-green-600" icon={<FaPlayCircle />} />
          <MetricCard title="Ride History Count" value={metrics.rideHistoryCount} color="bg-purple-600" icon={<FaHistory />}/>
        </div>
      </div>
    </DashboardLayout>
  );
}
