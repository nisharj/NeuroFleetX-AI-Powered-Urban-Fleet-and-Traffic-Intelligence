import { useEffect, useState } from "react";
import MetricCard from "../MetricCard";
import { apiFetch } from "../../api/api";
import DashboardLayout from "../Layout/DashboardLayout";
import {
  FaBook,
  FaPlayCircle,
  FaHistory,
  FaCar,
  FaPlusCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// ===== STATUS NORMALIZER (IMPORTANT) =====
const normalizeStatus = (status) =>
  typeof status === "string" ? status.trim().toUpperCase() : "";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===== FETCH BOOKINGS =====
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await apiFetch("/api/customer/bookings");
        if (!res || !res.ok) throw new Error();
        const data = await res.json();
        console.log("📊 Customer Dashboard - Fetched bookings:", data);
        console.log("📊 Sample booking structure:", data[0]);
        setBookings(data);
      } catch {
        setError("Failed to load booking data");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // ===== NORMALIZED DATA =====
  const normalizedBookings = bookings.map((b) => ({
    ...b,
    status: normalizeStatus(b.status),
  }));

  const totalBookings = normalizedBookings.length;

  const activeBookings = normalizedBookings.filter((b) =>
    [
      "PENDING",
      "BROADCASTED",
      "ACCEPTED",
      "ARRIVED",
      "IN_PROGRESS",
      "STARTED",
    ].includes(b.status),
  );

  const completedBookings = normalizedBookings.filter(
    (b) => b.status === "COMPLETED",
  );

  console.log("📊 Total bookings:", totalBookings);
  console.log("📊 Active bookings:", activeBookings.length, activeBookings);
  console.log(
    "📊 Completed bookings:",
    completedBookings.length,
    completedBookings,
  );

  const activeRide = activeBookings[0] || null;

  const recentRides = completedBookings
    .slice()
    .sort(
      (a, b) =>
        new Date(b.pickupTime || b.createdAt) -
        new Date(a.pickupTime || a.createdAt),
    )
    .slice(0, 5);

  // ===== LOADING =====
  if (loading) {
    return (
      <DashboardLayout title="Customer Dashboard">
        <p className="p-6 text-gray-500">Loading dashboard...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Customer Dashboard">
      <div className="p-6 space-y-8">
        {/* ===== METRICS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Total Bookings"
            value={totalBookings}
            icon={<FaBook />}
            color="bg-blue-600"
          />
          <MetricCard
            title="Active Booking"
            value={activeBookings.length}
            color="bg-green-600"
            icon={<FaPlayCircle />}
          />
          <MetricCard
            title="Ride History"
            value={completedBookings.length}
            color="bg-purple-600"
            icon={<FaHistory />}
          />
        </div>

        {/* ===== ACTIVE RIDE ===== */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Active Ride</h2>

          {error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : activeRide ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  Pickup: {activeRide.pickupAddress || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Drop: {activeRide.dropAddress || "N/A"}
                </p>
              </div>
              <span className="px-4 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                {activeRide.status}
              </span>
            </div>
          ) : (
            <p className="text-gray-500">No active booking</p>
          )}
        </div>

        {/* ===== QUICK ACTIONS ===== */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => navigate("/customer/book")}
              className="cursor-pointer bg-indigo-600 text-white p-6 rounded-lg shadow hover:scale-105 transition"
            >
              <FaPlusCircle className="text-3xl mb-3" />
              <h3 className="text-lg font-semibold">Book a Ride</h3>
              <p className="text-sm opacity-90">Request a new ride instantly</p>
            </div>

            <div className="bg-gray-700 text-white p-6 rounded-lg shadow">
              <FaCar className="text-3xl mb-3" />
              <h3 className="text-lg font-semibold">Ride History</h3>
              <p className="text-sm opacity-90">View completed rides below</p>
            </div>
          </div>
        </div>

        {/* ===== RECENT RIDES ===== */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Rides</h2>

          {recentRides.length === 0 ? (
            <p className="text-gray-500">No completed rides yet</p>
          ) : (
            <ul className="space-y-3">
              {recentRides.map((ride) => (
                <li
                  key={ride.id}
                  className="flex justify-between text-sm border-b pb-2"
                >
                  <span>
                    {new Date(
                      ride.pickupTime || ride.createdAt,
                    ).toLocaleDateString()}{" "}
                    - {ride.pickupAddress || "N/A"} →{" "}
                    {ride.dropAddress || "N/A"}
                  </span>
                  <span className="font-medium text-green-600">
                    {ride.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
