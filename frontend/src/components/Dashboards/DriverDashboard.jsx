import { useEffect, useState } from "react";
import MetricCard from "../MetricCard";
import DashboardLayout from "../Layout/DashboardLayout.jsx";
import { FaClipboardCheck, FaCheckCircle, FaCarSide } from "react-icons/fa";

export default function DriverDashboard() {
  const [metrics, setMetrics] = useState({
    assignedTrips: 0,
    completedTrips: 0,
    vehicleStatus: "Inactive",
  });

  useEffect(() => {
    fetch("http://localhost:8080/api/driver/metrics", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((data) =>
        setMetrics({
          assignedTrips: data.assignedTrips,
          completedTrips: data.completedTrips,
          vehicleStatus: data.vehicleStatus === 1 ? "Active" : "Inactive",
        })
      )
      .catch(console.error);
  }, []);

  return (
    <DashboardLayout title="Driver Dashboard">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard title="Assigned Trips"value={metrics.assignedTrips} color="bg-blue-600" icon={<FaClipboardCheck />} />
          <MetricCard title="Completed Trips" value={metrics.completedTrips} color="bg-green-600" icon={<FaCheckCircle />} />
          <MetricCard title="Vehicle Status"value={metrics.vehicleStatus} color="bg-purple-600" icon={<FaCarSide />} />
        </div>
      </div>
    </DashboardLayout>
  );
}
