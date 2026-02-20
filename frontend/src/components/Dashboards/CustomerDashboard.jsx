import { useEffect, useState, useCallback } from "react";
import MetricCard from "../MetricCard";
import DashboardLayout from "../Layout/DashboardLayout";
import {
  FaBook,
  FaPlayCircle,
  FaHistory,
  FaCar,
  FaPlusCircle,
  FaMapMarkerAlt,
  FaRoad,
  FaDollarSign,
  FaClock,
  FaTimesCircle,
  FaCheckCircle,
  FaBarcode,
  FaBroadcastTower,
  FaUserCheck,
  FaCarSide,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import bookingService from "../../services/bookingService";

// ===== STATUS NORMALIZER (IMPORTANT) =====
const normalizeStatus = (status) =>
  typeof status === "string" ? status.trim().toUpperCase() : "";

// ===== ACTIVE STATUS LIST =====
const ACTIVE_STATUSES = [
  "PENDING",
  "BROADCASTED",
  "CONFIRMED",
  "ACCEPTED",
  "ARRIVED",
  "IN_PROGRESS",
  "STARTED",
];

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: FaClock },
  BROADCASTED: { label: "Finding Driver", color: "bg-orange-100 text-orange-700", icon: FaBroadcastTower },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: FaCheckCircle },
  ACCEPTED: { label: "Driver Assigned", color: "bg-indigo-100 text-indigo-700", icon: FaUserCheck },
  ARRIVED: { label: "Driver Arrived", color: "bg-purple-100 text-purple-700", icon: FaMapMarkerAlt },
  STARTED: { label: "In Progress", color: "bg-green-100 text-green-700", icon: FaCarSide },
  IN_PROGRESS: { label: "In Progress", color: "bg-green-100 text-green-700", icon: FaCarSide },
  COMPLETED: { label: "Completed", color: "bg-gray-100 text-gray-700", icon: FaCheckCircle },
};

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // ===== FETCH BOOKINGS (with polling) =====
  const fetchBookings = useCallback(async () => {
    try {
      const data = await bookingService.getUserBookings();
      setBookings(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Failed to load customer bookings:", err);
      setError("Failed to load booking data");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== INIT + POLLING (every 5s like driver dashboard) =====
  useEffect(() => {
    fetchBookings();
    const interval = setInterval(fetchBookings, 5000);
    return () => clearInterval(interval);
  }, [fetchBookings]);

  // ===== CANCEL BOOKING =====
  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this ride?")) return;
    setCancelling(true);
    try {
      await bookingService.cancelBooking(bookingId, "Customer cancelled");
      fetchBookings();
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setCancelling(false);
    }
  };

  // ===== NORMALIZED DATA =====
  const normalizedBookings = bookings.map((b) => ({
    ...b,
    status: normalizeStatus(b.status),
  }));

  const totalBookings = normalizedBookings.length;

  const activeBookings = normalizedBookings.filter((b) =>
    ACTIVE_STATUSES.includes(b.status),
  );

  const completedBookings = normalizedBookings.filter(
    (b) => b.status === "COMPLETED",
  );

  // Sort active bookings by most recent first
  const sortedActive = activeBookings
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const activeRide = sortedActive[0] || null;

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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FaPlayCircle className="text-green-600" /> Active Ride
            </h2>
            {activeRide && (() => {
              const cfg = STATUS_CONFIG[activeRide.status] || STATUS_CONFIG.PENDING;
              const Icon = cfg.icon;
              return (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${cfg.color}`}>
                  <Icon className="text-xs" /> {cfg.label}
                </span>
              );
            })()}
          </div>

          <div className="p-6">
            {error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : activeRide ? (
              <div className="space-y-5">
                {/* Booking Code + Type */}
                <div className="flex flex-wrap items-center gap-3">
                  {activeRide.bookingCode && (
                    <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-mono">
                      <FaBarcode className="text-xs" /> {activeRide.bookingCode}
                    </span>
                  )}
                  {activeRide.requestedVehicleType && (
                    <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                      <FaCar className="text-xs" /> {activeRide.requestedVehicleType}
                    </span>
                  )}
                </div>

                {/* Status Progress Bar */}
                <div className="flex items-center gap-1">
                  {["BROADCASTED", "ACCEPTED", "ARRIVED", "STARTED"].map((step, i) => {
                    const statusOrder = ["PENDING", "BROADCASTED", "CONFIRMED", "ACCEPTED", "ARRIVED", "STARTED", "IN_PROGRESS"];
                    const currentIdx = statusOrder.indexOf(activeRide.status);
                    const stepIdx = statusOrder.indexOf(step);
                    const isActive = stepIdx <= currentIdx;
                    return (
                      <div key={step} className="flex-1">
                        <div className={`h-1.5 rounded-full transition-colors ${isActive ? 'bg-green-500' : 'bg-gray-200'}`} />
                        <p className={`text-[10px] mt-1 text-center ${isActive ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>
                          {step === "BROADCASTED" ? "Searching" : step === "ACCEPTED" ? "Assigned" : step === "ARRIVED" ? "Arrived" : "In Ride"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Route Card */}
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow" />
                      <div className="w-0.5 h-8 bg-gray-300" />
                      <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Pickup</p>
                        <p className="text-gray-900 font-semibold">
                          {activeRide.pickupAddress || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Drop-off</p>
                        <p className="text-gray-900 font-semibold">
                          {activeRide.dropAddress || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ride Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activeRide.distanceKm != null && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaRoad className="mx-auto text-indigo-500 mb-1" />
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="text-gray-900 font-bold">{activeRide.distanceKm} km</p>
                    </div>
                  )}
                  {activeRide.totalCost != null && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaDollarSign className="mx-auto text-green-500 mb-1" />
                      <p className="text-xs text-gray-500">Fare</p>
                      <p className="text-green-600 font-bold">{"\u20B9"}{activeRide.totalCost}</p>
                    </div>
                  )}
                  {activeRide.driverName && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaUserCheck className="mx-auto text-blue-500 mb-1" />
                      <p className="text-xs text-gray-500">Driver</p>
                      <p className="text-gray-900 font-semibold text-xs">{activeRide.driverName}</p>
                    </div>
                  )}
                  {activeRide.acceptedAt && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <FaClock className="mx-auto text-purple-500 mb-1" />
                      <p className="text-xs text-gray-500">Accepted At</p>
                      <p className="text-gray-900 font-semibold text-xs">
                        {new Date(activeRide.acceptedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cancel Button (only before ride starts) */}
                {["PENDING", "BROADCASTED", "CONFIRMED", "ACCEPTED", "ARRIVED"].includes(activeRide.status) && (
                  <div className="pt-2">
                    <button
                      onClick={() => cancelBooking(activeRide.id)}
                      disabled={cancelling}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 px-5 py-2.5 rounded-xl hover:bg-red-100 transition-colors font-medium w-full"
                    >
                      <FaTimesCircle /> {cancelling ? "Cancelling..." : "Cancel Ride"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaCar className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No active booking</p>
                <p className="text-gray-400 text-sm mt-1">Book a ride to get started</p>
              </div>
            )}
          </div>
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
